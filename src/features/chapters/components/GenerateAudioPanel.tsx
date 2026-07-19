import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { AudioPlayer } from '@/features/chapters/components/AudioPlayer'
import {
  useGenerateChapterAudio,
  SUPPORTED_AUDIO_LANGUAGES,
} from '@/features/chapters/hooks/useGenerateChapterAudio'
import { useChapterAudio } from '@/features/chapters/hooks/useChapterAudio'

/**
 * Teacher-facing "Generate audio" panel on the chapter editor. Language is an explicit
 * choice, not inferred from content — see useGenerateChapterAudio for why.
 */
export function GenerateAudioPanel({ chapterId }: { chapterId: string }) {
  const { audio, refetch } = useChapterAudio(chapterId)
  const { generate, generating, error } = useGenerateChapterAudio(chapterId)
  const [languageCode, setLanguageCode] = useState(audio?.language_code ?? 'bn-IN')

  async function handleGenerate() {
    const result = await generate(languageCode)
    if (result) refetch()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <select
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm"
        >
          {SUPPORTED_AUDIO_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
        <Button type="button" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating…' : audio ? 'Regenerate audio' : 'Generate audio'}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {audio && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-black/50">
            Current audio: {SUPPORTED_AUDIO_LANGUAGES.find((l) => l.code === audio.language_code)?.label ?? audio.language_code}
          </p>
          <AudioPlayer segments={audio.segments} />
        </div>
      )}
    </div>
  )
}
