# Cost Guardrails

See `PROJECT.md` Section 9 for the rule; this doc holds the actual budget numbers so they're not buried in code comments.

No paid API was called in Phase 1 or 2. Phase 3 (AI course generation, `supabase/functions/generate-course/`) is the first one that does — treat this doc as required reading before writing any more code that calls Claude or Sarvam AI.

## Budget ranges (per course, estimated)

| API | Use | Estimated cost |
|---|---|---|
| Claude API (Sonnet) | Teacher notes → structured chapters + quiz | ~৳6–19 / course |
| Sarvam AI (Bulbul V3) | TTS narration of chapter content | ~৳43–65 / course |

## Rules for any code that calls a paid API

1. Log the estimated cost per call in a comment or `console.log` during development — before the call, not after, so a runaway loop is visible in logs immediately.
2. Never run in an uncapped loop. Concretely: no auto-regeneration on every keystroke, no retry-without-backoff, no batch job without an explicit item cap.
3. Stay inside the ranges above. If a real invocation is trending well outside them (e.g. a course generation call costing 5x the high end), stop and investigate before shipping — don't just raise the number in this doc to match.

## Phase 3: Claude course generation

`supabase/functions/generate-course/index.ts` implements all three rules above:

1. Logs `input_tokens`, `output_tokens`, and an estimated USD/BDT cost after every call (`console.log`, visible via `supabase functions logs generate-course`). The BDT conversion and per-token pricing are rough constants in the function for logging only — not billing-accurate, don't use them for invoicing.
2. One Claude call per invocation, no retries. `rawNotes` is capped at 20,000 characters to bound worst-case spend. Nothing auto-regenerates — the teacher explicitly clicks "Generate chapters" each time (`src/features/courses/components/AIGenerateCourse.tsx`).
3. Not yet validated against real measured costs — do that the first few times this runs for real, and update the table above with actuals instead of the estimate once there's data.

## Revisit when

- Phase 3's real costs come in — replace the ~৳6–19/course estimate above with measured numbers.
- Phase 4 lands (Sarvam AI TTS) — add the same per-call logging + cap discipline.
- Supabase free tier limits are approached (rows, storage, or bandwidth) — add a row here for Supabase Pro costs before upgrading.
