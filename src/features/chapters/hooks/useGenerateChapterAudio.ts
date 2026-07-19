import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterAudioRow } from '@/types/database'

export const SUPPORTED_AUDIO_LANGUAGES: { code: string; label: string }[] = [
  { code: 'bn-IN', label: 'Bengali' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'od-IN', label: 'Odia' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
]

/**
 * Calls the generate-chapter-audio Edge Function (Sarvam AI TTS, server-side — see
 * supabase/functions/generate-chapter-audio/index.ts). Teacher picks the target language
 * explicitly rather than it being hardcoded to Bengali, since chapter content isn't always
 * written in the language it should be narrated in — see PROJECT.md Section 8 Phase 4 notes.
 */
export function useGenerateChapterAudio(chapterId: string) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (languageCode: string): Promise<ChapterAudioRow | null> => {
      setGenerating(true)
      setError(null)
      try {
        const { data, error } = await supabase.functions.invoke('generate-chapter-audio', {
          body: { chapterId, languageCode },
        })
        if (error) {
          setError(error.message)
          return null
        }
        if (data?.error) {
          setError(data.error)
          return null
        }
        return {
          id: '',
          chapter_id: chapterId,
          segments: data.segments,
          language_code: data.languageCode,
          generated_at: new Date().toISOString(),
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate audio.')
        return null
      } finally {
        setGenerating(false)
      }
    },
    [chapterId],
  )

  return { generate, generating, error }
}
