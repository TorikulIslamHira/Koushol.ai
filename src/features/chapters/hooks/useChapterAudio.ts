import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterAudioRow } from '@/types/database'

/** Fetches a chapter's generated TTS audio (if any). RLS mirrors chapter visibility — see supabase/migrations/20260719030000_create_chapter_audio.sql. */
export function useChapterAudio(chapterId: string | undefined) {
  const [audio, setAudio] = useState<ChapterAudioRow | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    if (!chapterId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('chapter_audio')
      .select('*')
      .eq('chapter_id', chapterId)
      .maybeSingle()
      .then(
        ({ data }) => {
          setAudio((data as ChapterAudioRow) ?? null)
          setLoading(false)
        },
        () => setLoading(false),
      )
  }, [chapterId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { audio, loading, refetch }
}
