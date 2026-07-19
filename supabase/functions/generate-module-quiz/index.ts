// What: Drafts a quiz for a module from its topics' content, via the Groq API
//       (OpenAI-compatible chat completions, hosting open models like Llama).
// Why: Runs server-side because the Groq API key is a secret — it must never reach the
//      browser (see docs/data-model.md / PROJECT.md Section 9 cost guardrails).
// Depends on: supabase/migrations/20260719050000_restructure_modules_topics.sql (modules,
//      topics, quizzes.module_id), the GROQ_API_KEY secret (set via `supabase secrets set`),
//      and the caller being the module's own teacher or an admin — enforced by re-using the
//      modules table's RLS (owner/admin select) via an RLS-respecting client built from the
//      caller's own JWT, not the service role. Replaces the old generate-course function,
//      which drafted whole courses from raw notes; AI now assists only at the per-module quiz
//      step — topics are always hand-written by the teacher.
//
// Input:  POST { moduleId: string }
// Output: { questions: [{ question, options, correct_index }] }
//
// Cost guardrail: one Groq call per invocation, no retries/loops. Topic content is capped at
// MAX_PROMPT_LENGTH to bound worst-case token spend. Token usage is logged per call — see
// docs/decisions/cost-notes.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_PROMPT_LENGTH = 20_000
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile'

const QUIZ_TOOL = {
  type: 'function',
  function: {
    name: 'structure_quiz',
    description:
      "Return a multiple-choice quiz testing understanding of a course module's topics.",
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          minItems: 3,
          maxItems: 10,
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
      required: ['questions'],
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

  let body: { moduleId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const { moduleId } = body
  if (!moduleId || typeof moduleId !== 'string') {
    return jsonResponse({ error: 'moduleId is required.' }, 400)
  }

  // RLS-respecting client (caller's own JWT, not the service role): this is what actually
  // enforces "must own the module's course or be admin" — the same owner/admin policy the
  // teacher UI relies on for manual editing.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401)
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id, title')
    .eq('id', moduleId)
    .single()
  if (moduleError || !module) {
    // RLS denies the select if the caller isn't the owning teacher or an admin.
    return jsonResponse({ error: 'Module not found or not yours to edit.' }, 403)
  }

  const { data: topics, error: topicsError } = await supabase
    .from('topics')
    .select('title, content')
    .eq('module_id', moduleId)
    .order('order_index')
  if (topicsError) {
    return jsonResponse({ error: topicsError.message }, 500)
  }
  if (!topics || topics.length === 0) {
    return jsonResponse({ error: 'This module has no topics yet — add some content first.' }, 400)
  }

  let prompt = topics.map((t) => `## ${t.title}\n${t.content}`).join('\n\n')
  if (prompt.length > MAX_PROMPT_LENGTH) {
    prompt = prompt.slice(0, MAX_PROMPT_LENGTH)
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
              'You write multiple-choice quizzes for online course modules. Write 3-10 questions that test understanding of the topics given, covering the whole module rather than just one topic.',
          },
          {
            role: 'user',
            content: `Module title: ${module.title}\n\nTopics:\n${prompt}`,
          },
        ],
        tools: [QUIZ_TOOL],
        tool_choice: { type: 'function', function: { name: 'structure_quiz' } },
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

  let parsedArgs: { questions: unknown }
  try {
    parsedArgs = JSON.parse(toolCall.function.arguments)
  } catch {
    return jsonResponse({ error: 'Groq returned malformed structured output.' }, 502)
  }

  const usage = groqBody.usage ?? { prompt_tokens: 0, completion_tokens: 0 }
  console.log(
    `[generate-module-quiz] module=${moduleId} model=${GROQ_MODEL} prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens}`,
  )

  return jsonResponse({ questions: parsedArgs.questions })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  })
}
