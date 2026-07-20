import { useTopicVideo } from '@/features/chapters/hooks/useTopicVideo'

/** Student-facing video playback for a topic — resolves a short-lived signed URL (bucket is private) via the same RLS that already gates the topic's content. */
export function TopicVideoPlayer({ topicId, videoPath }: { topicId: string; videoPath: string }) {
  const { signedUrl, loadingUrl } = useTopicVideo(topicId, videoPath)

  if (loadingUrl || !signedUrl) return null

  return <video controls src={signedUrl} className="w-full rounded-lg" />
}
