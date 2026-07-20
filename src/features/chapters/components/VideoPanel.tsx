import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useTopicVideo } from '@/features/chapters/hooks/useTopicVideo'

/** Teacher-facing video upload panel on the topic editor — upload/replace/remove, with a preview of the current video. */
export function VideoPanel({ topicId, videoPath, onChanged }: { topicId: string; videoPath: string | null; onChanged: () => void }) {
  const { t } = useTranslation()
  const { signedUrl, loadingUrl, uploading, error, uploadVideo, removeVideo } = useTopicVideo(topicId, videoPath)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = await uploadVideo(file)
    if (path) onChanged()
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1.5">
          <Upload className="h-4 w-4" aria-hidden="true" />
          {uploading ? t('video.uploading') : videoPath ? t('video.replace') : t('video.upload')}
        </Button>
        {videoPath && (
          <button
            type="button"
            disabled={uploading}
            onClick={async () => {
              const ok = await removeVideo()
              if (ok) onChanged()
            }}
            className="flex items-center gap-1.5 text-sm text-danger transition-colors duration-150 hover:underline disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('video.remove')}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {!loadingUrl && signedUrl && (
        <video controls src={signedUrl} className="w-full max-w-lg rounded-lg" />
      )}
    </div>
  )
}
