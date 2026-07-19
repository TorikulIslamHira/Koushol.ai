# Cost Guardrails

See `PROJECT.md` Section 9 for the rule; this doc holds the actual budget numbers so they're not buried in code comments.

Phase 1 and 2 called no paid API. Phase 3 (AI course generation, `supabase/functions/generate-course/`) is the first one that does — currently Groq's free tier (see `PROJECT.md` Section 2 for why Groq instead of the originally-planned Claude), so "cost" below is $0 for now but the rules still apply, since free-tier rate limits are a real constraint and this may move to a paid provider later. Phase 4 (TTS, `supabase/functions/generate-chapter-audio/`) is Sarvam AI, which is a paid API from the first call — no free tier to fall back on there.

## Budget ranges (per course, estimated)

| API | Use | Estimated cost |
|---|---|---|
| Groq API (Llama 3.3 70B) | Teacher notes → structured chapters + quiz | $0 (free tier) — revisit if/when this moves to a paid provider |
| Sarvam AI (Bulbul V3) | TTS narration of chapter content | ~৳43–65 / course |

## Rules for any code that calls a paid API

1. Log the estimated cost per call in a comment or `console.log` during development — before the call, not after, so a runaway loop is visible in logs immediately.
2. Never run in an uncapped loop. Concretely: no auto-regeneration on every keystroke, no retry-without-backoff, no batch job without an explicit item cap.
3. Stay inside the ranges above. If a real invocation is trending well outside them (e.g. a course generation call costing 5x the high end), stop and investigate before shipping — don't just raise the number in this doc to match.

## Phase 3: Groq course generation

`supabase/functions/generate-course/index.ts` implements all three rules above:

1. Logs `prompt_tokens` and `completion_tokens` after every call (`console.log`, visible via `supabase functions logs generate-course`). No dollar cost is computed since the free tier has none — if this moves to a paid Groq tier or back to Claude, add per-token pricing + a USD/BDT estimate here and in the function, the way the original Claude version of this function did.
2. One Groq call per invocation, no retries. `rawNotes` is capped at 20,000 characters to bound worst-case spend. Nothing auto-regenerates — the teacher explicitly clicks "Generate chapters" each time (`src/features/courses/components/AIGenerateCourse.tsx`).
3. Free tier, but still rate-limited — watch for `429` responses from Groq if this gets used heavily; that's the practical cap right now, not a dollar budget.

## Phase 4: Sarvam AI TTS

`supabase/functions/generate-chapter-audio/index.ts` implements the same three rules, adapted for a genuinely paid API (no free tier to lean on):

1. Logs segment count and total characters sent per call (`console.log`, visible via `supabase functions logs generate-chapter-audio`) — not a dollar figure, since exact Sarvam pricing wasn't confirmed while writing this (see the "not yet verified" note in `docs/data-model.md`). Add real per-character pricing here once confirmed against Sarvam's current pricing page.
2. One Sarvam call per text segment, no retries, and chapter content is capped at 15 segments (`MAX_SEGMENTS`) — a chapter needing more than that is rejected rather than silently generating an expensive multi-call chain. Nothing auto-regenerates — the teacher explicitly picks a language and clicks "Generate audio" (`src/features/chapters/components/GenerateAudioPanel.tsx`), and a second click ("Regenerate audio") is required to redo it.
3. Not yet validated against a real invocation's actual cost. Do that on first real use and fill in the ~৳43–65/course estimate above with a measured number.

## Revisit when

- This moves off the Groq free tier (paid Groq, or back to Claude per the original plan) — add real per-token pricing and replace the $0 estimate above with measured numbers.
- Sarvam's real per-call cost comes in — replace the ~৳43–65/course estimate with measured numbers, and add per-character pricing to the Edge Function's cost log.
- Supabase free tier limits are approached (rows, storage, or bandwidth) — add a row here for Supabase Pro costs before upgrading.
