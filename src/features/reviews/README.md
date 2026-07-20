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
- `components/ReviewList.tsx` — public display of existing reviews + the average rating.
