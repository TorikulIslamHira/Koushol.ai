import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { TopicChatMessageRow } from '@/types/database'

/**
 * A student's private Q&A conversation for a topic. Own-row-only RLS — see
 * supabase/migrations/20260727000000_topic_doubt_chat.sql. The Edge Function
 * (ask-topic-doubt) is stateless — this hook owns saving both the question and the
 * answer, same "frontend owns the save" split as quiz generation (useGenerateModuleQuiz).
 */
export function useTopicChat(topicId: string | undefined) {
  const { session } = useAuth()
  const [messages, setMessages] = useState<TopicChatMessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    if (!topicId || !session) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('topic_chat_messages')
      .select('*')
      .eq('topic_id', topicId)
      .eq('student_id', session.user.id)
      .order('created_at', { ascending: true })
      .then(
        ({ data }) => {
          setMessages((data as TopicChatMessageRow[]) ?? [])
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [topicId, session])

  useEffect(() => {
    refetch()
  }, [refetch])

  const askQuestion = useCallback(
    async (question: string) => {
      if (!topicId || !session) return
      setAsking(true)
      setError(null)
      try {
        const { data: userRow, error: userInsertError } = await supabase
          .from('topic_chat_messages')
          .insert({ topic_id: topicId, student_id: session.user.id, role: 'user', content: question })
          .select('*')
          .single()
        if (userInsertError) {
          setError(userInsertError.message)
          return
        }
        setMessages((prev) => [...prev, userRow as TopicChatMessageRow])

        const { data, error: fnError } = await supabase.functions.invoke('ask-topic-doubt', {
          body: { topicId, question },
        })
        if (fnError || data?.error) {
          setError(data?.error ?? fnError?.message ?? 'Failed to get an answer.')
          return
        }

        const { data: assistantRow, error: assistantInsertError } = await supabase
          .from('topic_chat_messages')
          .insert({ topic_id: topicId, student_id: session.user.id, role: 'assistant', content: data.answer })
          .select('*')
          .single()
        if (assistantInsertError) {
          setError(assistantInsertError.message)
          return
        }
        setMessages((prev) => [...prev, assistantRow as TopicChatMessageRow])
      } finally {
        setAsking(false)
      }
    },
    [topicId, session],
  )

  return { messages, loading, asking, error, askQuestion }
}
