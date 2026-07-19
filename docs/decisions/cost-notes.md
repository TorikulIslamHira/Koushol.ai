# Cost Guardrails

See `PROJECT.md` Section 9 for the rule; this doc holds the actual budget numbers so they're not buried in code comments.

No paid API is called anywhere in Phase 1. This becomes load-bearing starting Phase 3 (AI course generation) — treat it as required reading before writing any code that calls Claude or Sarvam AI.

## Budget ranges (per course, estimated)

| API | Use | Estimated cost |
|---|---|---|
| Claude API (Sonnet) | Teacher notes → structured chapters + quiz | ~৳6–19 / course |
| Sarvam AI (Bulbul V3) | TTS narration of chapter content | ~৳43–65 / course |

## Rules for any code that calls a paid API

1. Log the estimated cost per call in a comment or `console.log` during development — before the call, not after, so a runaway loop is visible in logs immediately.
2. Never run in an uncapped loop. Concretely: no auto-regeneration on every keystroke, no retry-without-backoff, no batch job without an explicit item cap.
3. Stay inside the ranges above. If a real invocation is trending well outside them (e.g. a course generation call costing 5x the high end), stop and investigate before shipping — don't just raise the number in this doc to match.

## Revisit when

- Phase 3 lands (Claude course generation) — add real measured costs here, not just estimates.
- Phase 4 lands (Sarvam AI TTS) — same.
- Supabase free tier limits are approached (rows, storage, or bandwidth) — add a row here for Supabase Pro costs before upgrading.
