import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { TopicAudioRow } from '@/types/database'

/** Fetches a topic's generated TTS audio (if any). RLS mirrors topic visibility — see supabase/migrations/20260719050000_restructure_modules_topics.sql. */
export function useTopicAudio(topicId: string | undefined) {
  const [audio, setAudio] = useState<TopicAudioRow | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!topicId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('topic_audio')
      .select('*')
      .eq('topic_id', topicId)
      .maybeSingle()
      .then(
        ({ data }) => {
          setAudio((data as TopicAudioRow) ?? null)
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [topicId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { audio, loading, refetch }
}
