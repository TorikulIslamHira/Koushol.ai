/** Row shapes for Supabase tables, hand-written to match supabase/migrations/*.sql. Regenerate/reconcile whenever a migration changes a table shape. */

export type UserRole = 'student' | 'teacher' | 'admin'
export type CourseStatus = 'draft' | 'pending_approval' | 'published'
export type PaymentProvider = 'bkash' | 'nagad' | 'sslcommerz'
export type SaleStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface UserRow {
  id: string
  role: UserRole
  name: string
  email: string
  created_at: string
}

export interface CourseRow {
  id: string
  teacher_id: string
  title: string
  description: string
  status: CourseStatus
  price: number
  created_at: string
  /** Teacher's raw notes, used as AI course-generation input. Only fetched on teacher-authoring pages — see useCourse's includeRawNotes option. */
  raw_notes: string | null
}

export interface ChapterRow {
  id: string
  course_id: string
  order_index: number
  title: string
  content: string
  is_ai_generated: boolean
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
}

export interface QuizRow {
  id: string
  chapter_id: string
  questions: QuizQuestion[]
}

export interface AudioSegment {
  audio_base64: string
  mime_type: string
}

export interface ChapterAudioRow {
  id: string
  chapter_id: string
  segments: AudioSegment[]
  language_code: string
  generated_at: string
}

export interface EnrollmentRow {
  id: string
  student_id: string
  course_id: string
  unlocked_chapter_index: number
  enrolled_at: string
}

export interface ChapterProgressRow {
  id: string
  student_id: string
  chapter_id: string
  quiz_score: number | null
  completed_at: string | null
}

export interface CertificateRow {
  id: string
  student_id: string
  course_id: string
  issued_at: string
}

export interface SaleRow {
  id: string
  course_id: string
  student_id: string
  amount: number
  payment_provider: PaymentProvider
  status: SaleStatus
  created_at: string
}
