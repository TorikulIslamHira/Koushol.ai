# features/reviews

Student ratings & reviews for a course, shown only on `CourseDetailPage` (not on catalog
cards — avoids one aggregate query per card in the browse grid).

- `hooks/useCourseReviews.ts` — fetches every review for a course plus a computed average.
  Public read for published courses (`course_reviews_select_published` RLS), so this is
  visible even to signed-out visitors — it's meant as a trust signal for prospective
  students, not a members-only feature.
- `hooks/useReviewMutations.ts` — create/update (upsert, one review per student per course)
  and delete for the current student's *own* review. RLS requires the student to actually
  be enrolled to insert one (`course_reviews_insert_own`).
- `components/ReviewForm.tsx` — star rating (1-5) + comment, shown to enrolled students.
- `components/ReviewList.tsx` — public display of existing reviews + the average rating,
  plus an inline "Report" control (any signed-in visitor, not just enrolled students).
- `hooks/useFlagReview.ts` — flags a review via the `flag_review` security-definer RPC
  rather than a direct table update, so reporting can't be abused to edit someone else's
  review — see `supabase/migrations/20260725000000_review_moderation.sql`. The admin-side
  moderation queue (`src/pages/AdminModerationPage.tsx`, `/admin/moderation`) lives outside
  this folder since it's a page, not a student-facing feature component.
