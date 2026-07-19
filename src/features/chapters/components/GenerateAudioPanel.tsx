import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { AudioPlayer } from '@/features/chapters/components/AudioPlayer'
import {
  useGenerateTopicAudio,
  SUPPORTED_AUDIO_LANGUAGES,
} from '@/features/chapters/hooks/useGenerateTopicAudio'
import { useTopicAudio } from '@/features/chapters/hooks/useTopicAudio'

/**
 * Teacher-facing "Generate audio" panel on the topic editor. Language is an explicit
 * choice, not inferred from content — see useGenerateTopicAudio for why.
 */
export function GenerateAudioPanel({ topicId }: { topicId: string }) {
  const { t } = useTranslation()
  const { audio, refetch } = useTopicAudio(topicId)
  const { generate, generating, error } = useGenerateTopicAudio(topicId)
  const [languageCode, setLanguageCode] = useState(audio?.language_code ?? 'bn-IN')

  async function handleGenerate() {
    const result = await generate(languageCode)
    if (result) refetch()
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Select
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value)}
          className="text-sm"
        >
          {SUPPORTED_AUDIO_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {t(lang.labelKey)}
            </option>
          ))}
        </Select>
        <Button type="button" onClick={handleGenerate} disabled={generating}>
          {generating
            ? t('audioPanel.generating')
            : audio
              ? t('audioPanel.regenerateAudio')
              : t('audioPanel.generateAudio')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {audio && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">
            {t('audioPanel.currentAudio', {
              language: t(
                SUPPORTED_AUDIO_LANGUAGES.find((l) => l.code === audio.language_code)
                  ?.labelKey ?? '',
              ) || audio.language_code,
            })}
          </p>
          <AudioPlayer segments={audio.segments} />
        </div>
      )}
    </div>
  )
}
