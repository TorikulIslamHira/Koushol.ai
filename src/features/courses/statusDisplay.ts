import type { CourseStatus } from '@/types/database'

/** Shared badge tone/i18n-key for a course's status — used on the teacher dashboard, course editor, and admin review so they stay visually and textually consistent. Callers pass the key to t() since this is a plain module-level constant, not a component (can't call useTranslation() itself). */
export const COURSE_STATUS_BADGE_TONE: Record<CourseStatus, 'neutral' | 'gold' | 'green'> = {
  draft: 'neutral',
  pending_approval: 'gold',
  published: 'green',
}

export const COURSE_STATUS_LABEL_KEY: Record<CourseStatus, string> = {
  draft: 'courseStatus.draft',
  pending_approval: 'courseStatus.pendingApproval',
  published: 'courseStatus.published',
}
