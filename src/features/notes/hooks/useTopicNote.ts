import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { TopicNoteRow } from '@/types/database'

/** Reads and saves the current student's private note for a topic. RLS (own rows only, no teacher/admin visibility) — see supabase/migrations/20260724000000_topic_notes.sql. */
export function useTopicNote(topicId: string | undefined) {
  const { session } = useAuth()
  const [note, setNote] = useState<TopicNoteRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!topicId || !session) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('topic_notes')
      .select('*')
      .eq('topic_id', topicId)
      .eq('student_id', session.user.id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (cancelled) return
          setNote((data as TopicNoteRow) ?? null)
          setLoading(false)
        },
        () => {
          if (!cancelled) setLoading(false)
        },
      )
    return () => {
      cancelled = true
    }
  }, [topicId, session])

  const saveNote = useCallback(
    async (content: string) => {
      if (!topicId || !session) return false
      setSaving(true)
      try {
        const { data, error } = await supabase
          .from('topic_notes')
          .upsert(
            { topic_id: topicId, student_id: session.user.id, content, updated_at: new Date().toISOString() },
            { onConflict: 'student_id,topic_id' },
          )
          .select('*')
          .single()
        if (error) return false
        setNote(data as TopicNoteRow)
        return true
      } finally {
        setSaving(false)
      }
    },
    [topicId, session],
  )

  return { note, loading, saving, saveNote }
}
