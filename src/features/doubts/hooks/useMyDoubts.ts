import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { TopicChatMessageRow } from '@/types/database'

interface DoubtTopicContext {
  id: string
  title: string
  module_id: string
  module: {
    id: string
    course_id: string
    course: { id: string; title: string }
  }
}

interface DoubtMessageRow extends TopicChatMessageRow {
  topic: DoubtTopicContext
}

export interface DoubtThread {
  topicId: string
  topicTitle: string
  moduleId: string
  courseId: string
  courseTitle: string
  lastMessage: TopicChatMessageRow
  messageCount: number
}

/** Fetches every doubt-chat conversation the current student has, grouped by topic (latest message + count), for the account "Doubts" page. */
export function useMyDoubts() {
  const { session } = useAuth()
  const [threads, setThreads] = useState<DoubtThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('topic_chat_messages')
      .select('*, topic:topics(id, title, module_id, module:modules(id, course_id, course:courses(id, title)))')
      .eq('student_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(
        ({ data }) => {
          if (cancelled) return
          const rows = (data as DoubtMessageRow[]) ?? []
          const byTopic = new Map<string, DoubtThread>()
          for (const row of rows) {
            const existing = byTopic.get(row.topic_id)
            if (existing) {
              existing.messageCount += 1
              continue
            }
            byTopic.set(row.topic_id, {
              topicId: row.topic_id,
              topicTitle: row.topic.title,
              moduleId: row.topic.module_id,
              courseId: row.topic.module.course_id,
              courseTitle: row.topic.module.course.title,
              lastMessage: row,
              messageCount: 1,
            })
          }
          setThreads(Array.from(byTopic.values()))
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

  return { threads, loading }
}
