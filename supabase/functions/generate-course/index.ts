// What: Turns a teacher's raw notes into structured chapters + quizzes via the Claude API.
// Why: Runs server-side because the Anthropic API key is a secret — it must never reach
//      the browser (see docs/data-model.md / PROJECT.md Section 9 cost guardrails).
// Depends on: supabase/migrations/20260719020000_add_courses_raw_notes.sql (courses.raw_notes),
//      the ANTHROPIC_API_KEY secret (set via `supabase secrets set`), and the caller being
//      the course's own teacher or an admin — enforced by re-using the courses table's RLS
//      (see supabase/migrations/20260719010100_create_courses.sql) via an RLS-respecting
//      client built from the caller's own JWT, not the service role.
//
// Input:  POST { courseId: string, rawNotes: string }
// Output: { chapters: [{ title, content, questions: [{ question, options, correct_index }] }] }
//
// Cost guardrail: one Claude call per invocation, no retries/loops. rawNotes is capped at
// MAX_NOTES_LENGTH to bound worst-case token spend. Estimated cost is logged per call —
// see docs/decisions/cost-notes.md for the budget this should stay inside (~৳6-19/course).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_NOTES_LENGTH = 20_000
const CLAUDE_MODEL = 'claude-sonnet-5'
// Rough USD pricing for cost logging only (not billing-accurate) — Sonnet-class pricing.
const USD_PER_INPUT_TOKEN = 3 / 1_000_000
const USD_PER_OUTPUT_TOKEN = 15 / 1_000_000
const USD_TO_BDT = 110

const CHAPTER_TOOL = {
  name: 'structure_course',
  description:
    "Return the teacher's notes restructured into an ordered list of course chapters, each with a short quiz.",
  input_schema: {
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
              description: 'A few paragraphs of plain-text chapter content explaining this part of the topic.',
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
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return jsonResponse({ error: 'Server is missing ANTHROPIC_API_KEY.' }, 500)
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

  let claudeRes: Response
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system:
          'You are an instructional designer turning a teacher\'s raw notes into a structured online course. Write clear, student-friendly chapter content in plain text (no markdown). Each chapter needs 1-5 multiple-choice quiz questions that test understanding of that chapter only.',
        messages: [
          {
            role: 'user',
            content: `Course title: ${course.title}\n\nTeacher's raw notes:\n${rawNotes}`,
          },
        ],
        tools: [CHAPTER_TOOL],
        tool_choice: { type: 'tool', name: 'structure_course' },
      }),
    })
  } catch (err) {
    return jsonResponse(
      { error: `Failed to reach Claude API: ${err instanceof Error ? err.message : String(err)}` },
      502,
    )
  }

  if (!claudeRes.ok) {
    const detail = await claudeRes.text()
    return jsonResponse({ error: `Claude API error (${claudeRes.status}): ${detail}` }, 502)
  }

  const claudeBody = await claudeRes.json()
  const toolUse = claudeBody.content?.find((block: { type: string }) => block.type === 'tool_use')
  if (!toolUse) {
    return jsonResponse({ error: 'Claude did not return structured output.' }, 502)
  }

  const usage = claudeBody.usage ?? { input_tokens: 0, output_tokens: 0 }
  const costUsd = usage.input_tokens * USD_PER_INPUT_TOKEN + usage.output_tokens * USD_PER_OUTPUT_TOKEN
  console.log(
    `[generate-course] course=${courseId} input_tokens=${usage.input_tokens} output_tokens=${usage.output_tokens} est_cost=$${costUsd.toFixed(4)} (~৳${(costUsd * USD_TO_BDT).toFixed(2)})`,
  )

  return jsonResponse({ chapters: toolUse.input.chapters })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
