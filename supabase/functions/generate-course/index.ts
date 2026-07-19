// What: Turns a teacher's raw notes into structured chapters + quizzes via the Groq API
//       (OpenAI-compatible chat completions, hosting open models like Llama).
// Why: Runs server-side because the Groq API key is a secret — it must never reach the
//      browser (see docs/data-model.md / PROJECT.md Section 9 cost guardrails).
// Depends on: supabase/migrations/20260719020000_add_courses_raw_notes.sql (courses.raw_notes),
//      the GROQ_API_KEY secret (set via `supabase secrets set`), and the caller being the
//      course's own teacher or an admin — enforced by re-using the courses table's RLS (see
//      supabase/migrations/20260719010100_create_courses.sql) via an RLS-respecting client
//      built from the caller's own JWT, not the service role.
//
// Input:  POST { courseId: string, rawNotes: string }
// Output: { chapters: [{ title, content, questions: [{ question, options, correct_index }] }] }
//
// Cost guardrail: one Groq call per invocation, no retries/loops. rawNotes is capped at
// MAX_NOTES_LENGTH to bound worst-case token spend. Token usage is logged per call — see
// docs/decisions/cost-notes.md. Groq's free tier has no real cost, but still logs usage so a
// runaway loop would be visible before it hits rate limits.
//
// Note: chosen over Claude because the teacher wanted to test on a free tier first — this can
// swap back to Anthropic's Messages API later; see PROJECT.md Section 2 for that decision.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_NOTES_LENGTH = 20_000
// Override with a GROQ_MODEL secret if this gets deprecated — Groq's model lineup changes
// faster than most providers'. llama-3.3-70b-versatile is a solid default for tool-calling.
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile'

const CHAPTER_TOOL = {
  type: 'function',
  function: {
    name: 'structure_course',
    description:
      "Return the teacher's notes restructured into an ordered list of course chapters, each with a short quiz.",
    parameters: {
      type: 'object',
      properties: {
        chapters: {
          type: 'array',
          minItems: 1,
          maxItems: 10,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: {
                type: 'string',
                description:
                  'A few paragraphs of plain-text chapter content explaining this part of the topic.',
              },
              questions: {
                type: 'array',
                minItems: 1,
                maxItems: 5,
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: {
                      type: 'array',
                      minItems: 2,
                      maxItems: 5,
                      items: { type: 'string' },
                    },
                    correct_index: { type: 'integer' },
                  },
                  required: ['question', 'options', 'correct_index'],
                },
              },
            },
            required: ['title', 'content', 'questions'],
          },
        },
      },
      required: ['chapters'],
    },
  },
}

// Browsers preflight cross-origin POSTs with an OPTIONS request; without these headers the
// actual request never leaves the browser (fails as an opaque CORS error, not a real 4xx/5xx).
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const groqKey = Deno.env.get('GROQ_API_KEY')
  if (!groqKey) {
    return jsonResponse({ error: 'Server is missing GROQ_API_KEY.' }, 500)
  }

  let body: { courseId?: string; rawNotes?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const { courseId, rawNotes } = body
  if (!courseId || typeof courseId !== 'string') {
    return jsonResponse({ error: 'courseId is required.' }, 400)
  }
  if (!rawNotes || typeof rawNotes !== 'string' || !rawNotes.trim()) {
    return jsonResponse({ error: 'rawNotes is required.' }, 400)
  }
  if (rawNotes.length > MAX_NOTES_LENGTH) {
    return jsonResponse(
      { error: `rawNotes exceeds the ${MAX_NOTES_LENGTH}-character limit.` },
      400,
    )
  }

  // RLS-respecting client (caller's own JWT, not the service role): this is what actually
  // enforces "must own the course or be admin" — the same owner/admin policy the teacher
  // UI relies on for manual editing.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401)
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()
  if (courseError || !course) {
    // RLS denies the select if the caller isn't the owning teacher or an admin.
    return jsonResponse({ error: 'Course not found or not yours to edit.' }, 403)
  }

  let groqRes: Response
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content:
              "You are an instructional designer turning a teacher's raw notes into a structured online course. Write clear, student-friendly chapter content in plain text (no markdown). Each chapter needs 1-5 multiple-choice quiz questions that test understanding of that chapter only.",
          },
          {
            role: 'user',
            content: `Course title: ${course.title}\n\nTeacher's raw notes:\n${rawNotes}`,
          },
        ],
        tools: [CHAPTER_TOOL],
        tool_choice: { type: 'function', function: { name: 'structure_course' } },
      }),
    })
  } catch (err) {
    return jsonResponse(
      { error: `Failed to reach Groq API: ${err instanceof Error ? err.message : String(err)}` },
      502,
    )
  }

  if (!groqRes.ok) {
    const detail = await groqRes.text()
    return jsonResponse({ error: `Groq API error (${groqRes.status}): ${detail}` }, 502)
  }

  const groqBody = await groqRes.json()
  const toolCall = groqBody.choices?.[0]?.message?.tool_calls?.[0]
  if (!toolCall) {
    return jsonResponse({ error: 'Groq did not return structured output.' }, 502)
  }

  let parsedArgs: { chapters: unknown }
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments)
  } catch {
    return jsonResponse({ error: 'Groq returned malformed structured output.' }, 502)
  }

  const usage = groqBody.usage ?? { prompt_tokens: 0, completion_tokens: 0 }
  console.log(
    `[generate-course] course=${courseId} model=${GROQ_MODEL} prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens}`,
  )

  return jsonResponse({ chapters: parsedArgs.chapters })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  })
}
