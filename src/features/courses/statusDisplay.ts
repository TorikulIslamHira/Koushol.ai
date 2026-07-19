import type { CourseStatus } from '@/types/database'

/** Shared badge tone/label for a course's status — used on both the teacher dashboard and course editor so they stay visually consistent. */
export const COURSE_STATUS_BADGE_TONE: Record<CourseStatus, 'neutral' | 'gold' | 'green'> = {
  draft: 'neutral',
  pending_approval: 'gold',
  published: 'green',
}

export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  draft: 'draft',
  pending_approval: 'pending review',
  published: 'published',
}
