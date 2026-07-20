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
  is_verified_teacher: boolean
  bio: string | null
}

export interface CourseRow {
  id: string
  teacher_id: string
  title: string
  description: string
  status: CourseStatus
  price: number
  created_at: string
  category: string | null
}

export interface ModuleRow {
  id: string
  course_id: string
  order_index: number
  title: string
}

export interface TopicRow {
  id: string
  module_id: string
  order_index: number
  title: string
  content: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
}

export interface QuizRow {
  id: string
  module_id: string
  questions: QuizQuestion[]
}

export interface AudioSegment {
  audio_base64: string
  mime_type: string
}

export interface TopicAudioRow {
  id: string
  topic_id: string
  segments: AudioSegment[]
  language_code: string
  generated_at: string
}

export interface EnrollmentRow {
  id: string
  student_id: string
  course_id: string
  unlocked_module_index: number
  enrolled_at: string
}

export interface ModuleProgressRow {
  id: string
  student_id: string
  module_id: string
  quiz_score: number | null
  completed_at: string | null
}

export interface CourseReviewRow {
  id: string
  student_id: string
  course_id: string
  rating: number
  comment: string | null
  created_at: string
  flagged_at: string | null
  flag_reason: string | null
}

export interface TopicNoteRow {
  id: string
  student_id: string
  topic_id: string
  content: string
  updated_at: string
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
