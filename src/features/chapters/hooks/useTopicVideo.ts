import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const BUCKET = 'topic-videos'
const MAX_VIDEO_BYTES = 100 * 1024 * 1024 // 100MB — not a security boundary, just a guardrail against accidental huge uploads eating Storage quota.

/**
 * Uploads (teacher) and resolves a signed playback URL (student) for a topic's video.
 * RLS on storage.objects (owner/admin-only insert/update/delete, free-preview/enrolled/
 * owner-admin select) is the real enforcement — see
 * supabase/migrations/20260726000000_topic_video.sql. The bucket is private, so playback
 * always goes through a short-lived signed URL rather than a public one.
 */
export function useTopicVideo(topicId: string, videoPath: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadingUrl, setLoadingUrl] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoPath) {
      setSignedUrl(null)
      setLoadingUrl(false)
      return
    }
    let cancelled = false
    setLoadingUrl(true)
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(videoPath, 3600)
      .then(({ data }) => {
        if (cancelled) return
        setSignedUrl(data?.signedUrl ?? null)
        setLoadingUrl(false)
      })
    return () => {
      cancelled = true
    }
  }, [videoPath])

  const uploadVideo = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('video/')) {
        setError('Please choose a video file.')
        return null
      }
      if (file.size > MAX_VIDEO_BYTES) {
        setError('Video is too large (max 100MB).')
        return null
      }
      setUploading(true)
      setError(null)
      try {
        const path = `${topicId}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false })
        if (uploadError) {
          setError(uploadError.message)
          return null
        }
        // Old file (if any) is orphaned in storage rather than deleted here — acceptable
        // for a teacher-facing re-upload flow; cleanup can be a follow-up if it matters.
        const { error: updateError } = await supabase
          .from('topics')
          .update({ video_path: path })
          .eq('id', topicId)
        if (updateError) {
          setError(updateError.message)
          return null
        }
        return path
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload video.')
        return null
      } finally {
        setUploading(false)
      }
    },
    [topicId],
  )

  const removeVideo = useCallback(async () => {
    if (!videoPath) return false
    setUploading(true)
    setError(null)
    try {
      await supabase.storage.from(BUCKET).remove([videoPath])
      const { error: updateError } = await supabase
        .from('topics')
        .update({ video_path: null })
        .eq('id', topicId)
      if (updateError) {
        setError(updateError.message)
        return false
      }
      return true
    } finally {
      setUploading(false)
    }
  }, [topicId, videoPath])

  return { signedUrl, loadingUrl, uploading, error, uploadVideo, removeVideo }
}
