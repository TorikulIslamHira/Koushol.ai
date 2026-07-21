import { useEffect, useRef, type ReactNode } from 'react'
import { annotate } from 'rough-notation'
import type { RoughAnnotationType } from 'rough-notation/lib/model'

interface HighlighterProps {
  children: ReactNode
  action?: RoughAnnotationType
  color?: string
  strokeWidth?: number
  animationDuration?: number
  iterations?: number
  padding?: number
  multiline?: boolean
}

/**
 * Draws a hand-drawn-style annotation (underline, highlight, circle, box, etc. — see
 * rough-notation's RoughAnnotationType) around its children, animated in once on mount.
 * Generic — no business logic, safe to reuse anywhere. Default color is Koushol's brand
 * gold at low opacity (see `src/styles/globals.css`'s `@theme` block), since `highlight`
 * draws behind the text and a solid brand-green would fight with the text color used
 * everywhere else on the site.
 */
export function Highlighter({
  children,
  action = 'highlight',
  color = 'rgba(212, 160, 23, 0.35)',
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const annotation = annotate(element, {
      type: action,
      color,
      strokeWidth,
      animationDuration,
      iterations,
      padding,
      multiline,
    })
    annotation.show()
    return () => {
      annotation.remove()
    }
  }, [action, color, strokeWidth, animationDuration, iterations, padding, multiline])

  return (
    <span ref={elementRef} className="relative inline-block bg-transparent">
      {children}
    </span>
  )
}
