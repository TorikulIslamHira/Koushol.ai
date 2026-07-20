// What: Answers a student's question about a specific topic's content via the Groq API,
//       scoped to that topic only (not a general-purpose chatbot).
// Why: Runs server-side because the Groq API key is a secret — it must never reach the
//      browser (see docs/data-model.md / PROJECT.md Section 9 cost guardrails). Same
//      pattern as supabase/functions/generate-module-quiz/.
// Depends on: supabase/migrations/20260727000000_topic_doubt_chat.sql (topic_chat_messages),
//      the GROQ_API_KEY secret (already set from Phase 3, no new secret needed), and the
//      caller being enrolled in the topic's course (or the free-preview topic, or the
//      owning teacher/admin) — enforced by re-using the topics table's existing RLS via an
//      RLS-respecting client built from the caller's own JWT, not the service role.
//
// Input:  POST { topicId: string, question: string }
// Output: { answer: string }
//
// Cost guardrail: unlike generate-module-quiz/generate-topic-audio (one-shot, naturally
// self-limiting — a teacher generates a quiz once), this is conversational and invites
// repeat use. MAX_MESSAGES_PER_TOPIC caps total messages (question + answer pairs) per
// student per topic — once hit, the function returns an error instead of silently letting
// an unbounded conversation run up Groq usage. Also caps conversation history sent as
// context (last CONTEXT_MESSAGE_COUNT messages) to bound per-call token spend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_MESSAGES_PER_TOPIC = 40 // 20 question/answer exchanges
const CONTEXT_MESSAGE_COUNT = 10
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') ?? 'llama-3.3-70b-versatile'

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

  let body: { topicId?: string; question?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const { topicId, question } = body
  if (!topicId || typeof topicId !== 'string') {
    return jsonResponse({ error: 'topicId is required.' }, 400)
  }
  if (!question || typeof question !== 'string' || !question.trim()) {
    return jsonResponse({ error: 'question is required.' }, 400)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header.' }, 401)
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id, title, content')
    .eq('id', topicId)
    .single()
  if (topicError || !topic) {
    // RLS denies the select if the caller isn't enrolled/free-preview/owner/admin.
    return jsonResponse({ error: 'Topic not found or not accessible to you.' }, 403)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return jsonResponse({ error: 'Not signed in.' }, 401)
  }

  const { count, error: countError } = await supabase
    .from('topic_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topicId)
    .eq('student_id', user.id)
  if (countError) {
    return jsonResponse({ error: countError.message }, 500)
  }
  if ((count ?? 0) >= MAX_MESSAGES_PER_TOPIC) {
    return jsonResponse(
      { error: `You've reached the question limit for this topic (${MAX_MESSAGES_PER_TOPIC / 2} questions).` },
      429,
    )
  }

  const { data: history } = await supabase
    .from('topic_chat_messages')
    .select('role, content')
    .eq('topic_id', topicId)
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(CONTEXT_MESSAGE_COUNT)

  const historyMessages = ((history ?? []) as { role: string; content: string }[])
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }))

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
              `You are a helpful tutor answering a student's question about ONE specific course topic. ` +
              `Only answer based on the topic content below; if the question is unrelated to it, gently ` +
              `redirect the student to ask something about the topic instead of answering off-topic questions.\n\n` +
              `Topic: ${topic.title}\n\n${topic.content}`,
          },
          ...historyMessages,
          { role: 'user', content: question },
        ],
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
  const answer = groqBody.choices?.[0]?.message?.content
  if (!answer) {
    return jsonResponse({ error: 'Groq did not return an answer.' }, 502)
  }

  const usage = groqBody.usage ?? { prompt_tokens: 0, completion_tokens: 0 }
  console.log(
    `[ask-topic-doubt] topic=${topicId} student=${user.id} model=${GROQ_MODEL} prompt_tokens=${usage.prompt_tokens} completion_tokens=${usage.completion_tokens}`,
  )

  return jsonResponse({ answer })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  })
}
