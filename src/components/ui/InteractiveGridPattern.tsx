import { useState, type SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface InteractiveGridPatternProps extends SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  squares?: [number, number]
  squaresClassName?: string
}

/**
 * A grid of squares that lights up under the cursor as it moves across them. Generic — no
 * business logic, safe to reuse anywhere. Not yet themed to Koushol's palette; the default
 * gray tones are a placeholder until that pass.
 */
export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
  ...rest
}: InteractiveGridPatternProps) {
  const [horizontal, vertical] = squares
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null)

  return (
    <svg
      width={width * horizontal}
      height={height * vertical}
      className={cn('absolute inset-0 h-full w-full border border-slate-300/30', className)}
      {...rest}
    >
      {Array.from({ length: horizontal * vertical }).map((_, index) => {
        const x = (index % horizontal) * width
        const y = Math.floor(index / horizontal) * height
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            className={cn(
              'stroke-slate-300/30 transition-all duration-100 ease-in-out [&:not(:hover)]:duration-1000',
              hoveredSquare === index ? 'fill-slate-300/30' : 'fill-transparent',
              squaresClassName,
            )}
            onMouseEnter={() => setHoveredSquare(index)}
            onMouseLeave={() => setHoveredSquare(null)}
          />
        )
      })}
    </svg>
  )
}
