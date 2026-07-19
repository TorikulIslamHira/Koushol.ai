# pages/

Route-level components — one file per URL path, wired up in `src/app/App.tsx`. File names match what they render, not the exact URL: `CourseDetailPage.tsx` → `/courses/:courseId`, `ChapterPage.tsx` → `/courses/:courseId/chapters/:chapterId`, etc.

Pages compose `features/*` hooks/components; they should stay thin (routing + layout + composition), not hold business logic themselves.
