import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AudioSegment } from '@/types/database'

/** Plays a chapter's generated TTS segments back-to-back as one continuous listen, advancing to the next segment's data URI when the current one ends. */
export function AudioPlayer({ segments }: { segments: AudioSegment[] }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Changing an <audio> element's `src` attribute alone does not make the browser load the
  // new resource — it must be told to explicitly. Without this, advancing `index` would
  // update the DOM attribute but keep playing (or silently stall on) the previous segment.
  // Deliberately excludes `playing` from deps: this should only re-run when the segment
  // changes, not on every pause/resume (which would re-call .load() and reset position).
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.load()
    if (playing) el.play()
  }, [index])

  if (segments.length === 0) return null

  function handleEnded() {
    if (index < segments.length - 1) {
      setIndex((i) => i + 1)
    } else {
      setPlaying(false)
      setIndex(0)
    }
  }

  function togglePlay() {
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
    } else {
      audioRef.current?.play()
      setPlaying(true)
    }
  }

  const current = segments[index]
  const src = `data:${current.mime_type};base64,${current.audio_base64}`

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
      <Button type="button" variant="secondary" onClick={togglePlay} className="gap-2">
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Play className="h-4 w-4" aria-hidden="true" />
        )}
        {playing ? 'Pause' : 'Listen to this chapter'}
      </Button>
      <span className="text-xs text-slate-400">
        Segment {index + 1} / {segments.length}
      </span>
      <audio
        ref={audioRef}
        src={src}
        onEnded={handleEnded}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="hidden"
      />
    </div>
  )
}
