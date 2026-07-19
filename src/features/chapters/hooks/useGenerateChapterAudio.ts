import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ChapterAudioRow } from '@/types/database'

/** labelKey points at src/i18n/locales/{en,bn}.json's "languageNames" namespace — GenerateAudioPanel translates it via t(), since this is a plain module-level constant and can't call useTranslation() itself. */
export const SUPPORTED_AUDIO_LANGUAGES: { code: string; labelKey: string }[] = [
  { code: 'bn-IN', labelKey: 'languageNames.bengali' },
  { code: 'en-IN', labelKey: 'languageNames.englishIndia' },
  { code: 'hi-IN', labelKey: 'languageNames.hindi' },
  { code: 'gu-IN', labelKey: 'languageNames.gujarati' },
  { code: 'kn-IN', labelKey: 'languageNames.kannada' },
  { code: 'ml-IN', labelKey: 'languageNames.malayalam' },
  { code: 'mr-IN', labelKey: 'languageNames.marathi' },
  { code: 'od-IN', labelKey: 'languageNames.odia' },
  { code: 'pa-IN', labelKey: 'languageNames.punjabi' },
  { code: 'ta-IN', labelKey: 'languageNames.tamil' },
  { code: 'te-IN', labelKey: 'languageNames.telugu' },
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
