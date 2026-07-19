// What: Turns a chapter's text content into TTS audio via the Sarvam AI API (Bulbul).
// Why: Runs server-side because the Sarvam API key is a secret — it must never reach the
//      browser (see docs/data-model.md / PROJECT.md Section 9 cost guardrails). Same
//      pattern as supabase/functions/generate-course/.
// Depends on: supabase/migrations/20260719030000_create_chapter_audio.sql, the
//      SARVAM_API_KEY secret (set via `supabase secrets set`), and the caller being the
//      chapter's owning teacher or an admin — enforced by re-using the chapters table's RLS
//      via an RLS-respecting client built from the caller's own JWT, not the service role.
//
// Input:  POST { chapterId: string, languageCode: string }
// Output: { segments: [{ audio_base64, mime_type }], languageCode }
//
// ASSUMPTIONS TO VERIFY on first real call (Sarvam's exact contract wasn't available to
// check live while writing this): endpoint path, request field names (inputs/speaker/model),
// and response shape (audios[]). If Sarvam rejects the request, check their current TTS API
// docs and fix here — the shape below is our best-effort recollection, not confirmed.
//
// Cost guardrail: rawText is chunked (Sarvam caps input length per request) and the number
// of chunks is capped at MAX_SEGMENTS so one chapter can't balloon into dozens of paid calls.
// Token/character usage is logged per call — see docs/decisions/cost-notes.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAX_CHARS_PER_SEGMENT = 450
const MAX_SEGMENTS = 15
// Override with a SARVAM_MODEL secret if Sarvam's model naming has moved on since this was written.
const SARVAM_MODEL = Deno.env.get('SARVAM_MODEL') ?? 'bulbul:v2'
// 'meera' (our original guess) doesn't exist — confirmed via a live 400 response listing
// valid speakers: anushka, abhilash, manisha, vidya, arya, karun, hitesh, aditya, ritu,
// priya, neha, rahul, pooja, rohan, simran, kavya, and more. 'anushka' is Sarvam's
// documented default voice.
const SARVAM_SPEAKER = Deno.env.get('SARVAM_SPEAKER') ?? 'anushka'

const SUPPORTED_LANGUAGES = new Set([
  'bn-IN',
  'en-IN',
  'hi-IN',
  'gu-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'od-IN',
  'pa-IN',
  'ta-IN',
  'te-IN',
])

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

/** Splits text into <=MAX_CHARS_PER_SEGMENT chunks on sentence boundaries where possible, rather than mid-word. */
function chunkText(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length > MAX_CHARS_PER_SEGMENT && current) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = (current + ' ' + sentence).trim()
    }
    // A single sentence longer than the limit still needs hard-splitting.
    while (current.length > MAX_CHARS_PER_SEGMENT) {
      chunks.push(current.slice(0, MAX_CHARS_PER_SEGMENT))
      current = current.slice(MAX_CHARS_PER_SEGMENT)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const sarvamKey = Deno.env.get('SARVAM_API_KEY')
  if (!sarvamKey) {
    return jsonResponse({ error: 'Server is missing SARVAM_API_KEY.' }, 500)
  }

  let body: { chapterId?: string; languageCode?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  const { chapterId, languageCode } = body
  if (!chapterId || typeof chapterId !== 'string') {
    return jsonResponse({ error: 'chapterId is required.' }, 400)
  }
  if (!languageCode || !SUPPORTED_LANGUAGES.has(languageCode)) {
    return jsonResponse(
      { error: `languageCode must be one of: ${[...SUPPORTED_LANGUAGES].join(', ')}` },
      400,
    )
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

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id, title, content')
    .eq('id', chapterId)
    .single()
  if (chapterError || !chapter) {
    // RLS denies the select if the caller isn't the owning teacher or an admin.
    return jsonResponse({ error: 'Chapter not found or not yours to edit.' }, 403)
  }
  if (!chapter.content || !chapter.content.trim()) {
    return jsonResponse({ error: 'Chapter has no content to narrate yet.' }, 400)
  }

  const chunks = chunkText(chapter.content)
  if (chunks.length > MAX_SEGMENTS) {
    return jsonResponse(
      {
        error: `Chapter content is too long for audio generation (${chunks.length} segments, max ${MAX_SEGMENTS}). Shorten the chapter first.`,
      },
      400,
    )
  }

  const segments: { audio_base64: string; mime_type: string }[] = []
  let totalChars = 0

  for (const chunk of chunks) {
    let sarvamRes: Response
    try {
      sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'api-subscription-key': sarvamKey,
        },
        body: JSON.stringify({
          inputs: [chunk],
          target_language_code: languageCode,
          speaker: SARVAM_SPEAKER,
          model: SARVAM_MODEL,
          enable_preprocessing: true,
        }),
      })
    } catch (err) {
      return jsonResponse(
        { error: `Failed to reach Sarvam API: ${err instanceof Error ? err.message : String(err)}` },
        502,
      )
    }

    if (!sarvamRes.ok) {
      const detail = await sarvamRes.text()
      return jsonResponse({ error: `Sarvam API error (${sarvamRes.status}): ${detail}` }, 502)
    }

    const sarvamBody = await sarvamRes.json()
    const audioBase64 = sarvamBody.audios?.[0]
    if (!audioBase64) {
      return jsonResponse({ error: 'Sarvam did not return audio for a segment.' }, 502)
    }
    segments.push({ audio_base64: audioBase64, mime_type: 'audio/wav' })
    totalChars += chunk.length
  }

  console.log(
    `[generate-chapter-audio] chapter=${chapterId} language=${languageCode} segments=${segments.length} chars=${totalChars}`,
  )

  const { error: upsertError } = await supabase
    .from('chapter_audio')
    .upsert(
      { chapter_id: chapterId, segments, language_code: languageCode },
      { onConflict: 'chapter_id' },
    )
  if (upsertError) {
    return jsonResponse({ error: `Failed to save audio: ${upsertError.message}` }, 500)
  }

  return jsonResponse({ segments, languageCode })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS_HEADERS },
  })
}
