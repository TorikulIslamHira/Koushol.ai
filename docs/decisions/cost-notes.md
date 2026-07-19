# Cost Guardrails

See `PROJECT.md` Section 9 for the rule; this doc holds the actual budget numbers so they're not buried in code comments.

Phase 1 and 2 called no paid API. Phase 3 (AI course generation, `supabase/functions/generate-course/`) is the first one that does — currently Groq's free tier (see `PROJECT.md` Section 2 for why Groq instead of the originally-planned Claude), so "cost" below is $0 for now but the rules still apply, since free-tier rate limits are a real constraint and this may move to a paid provider later.

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

## Revisit when

- This moves off the Groq free tier (paid Groq, or back to Claude per the original plan) — add real per-token pricing and replace the $0 estimate above with measured numbers.
- Phase 4 lands (Sarvam AI TTS) — add the same per-call logging + cap discipline.
- Supabase free tier limits are approached (rows, storage, or bandwidth) — add a row here for Supabase Pro costs before upgrading.
