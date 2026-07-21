import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { TopicNoteRow } from '@/types/database'

interface NoteTopicContext {
  id: string
  title: string
  module_id: string
  module: {
    id: string
    title: string
    course_id: string
    course: { id: string; title: string }
  }
}

export interface NoteWithContext extends TopicNoteRow {
  topic: NoteTopicContext
}

/** Fetches every note the current student has written, joined with topic/module/course context, for the account "Notes" page. */
export function useMyNotes() {
  const { session } = useAuth()
  const [notes, setNotes] = useState<NoteWithContext[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('topic_notes')
      .select('*, topic:topics(id, title, module_id, module:modules(id, title, course_id, course:courses(id, title)))')
      .eq('student_id', session.user.id)
      .order('updated_at', { ascending: false })
      .then(
        ({ data }) => {
          if (cancelled) return
          setNotes((data as NoteWithContext[]) ?? [])
          setLoading(false)
        },
        () => {
          if (!cancelled) setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [session])

  return { notes, loading }
}
