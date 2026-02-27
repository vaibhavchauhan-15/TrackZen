'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Glow color in CSS format (default: primary purple)
   */
  glowColor?: string
  /**
   * Glow intensity (0-1, default: 0.6)
   */
  glowIntensity?: number
  /**
   * Glow size in pixels (default: 200)
   */
  glowSize?: number
  /**
   * Whether to disable the glow effect
   */
  disableGlow?: boolean
  /**
   * Additional wrapper class names
   */
  wrapperClassName?: string
}

const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  (
    {
      className,
      children,
      glowColor = 'rgba(124, 58, 237, 0.5)',
      glowIntensity = 0.6,
      glowSize = 200,
      disableGlow = false,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
    const [isHovered, setIsHovered] = React.useState(false)

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (disableGlow || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePosition({ x, y })
    }, [disableGlow])

    const handleMouseEnter = React.useCallback(() => {
      if (!disableGlow) setIsHovered(true)
    }, [disableGlow])

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false)
    }, [])

    // Check for reduced motion preference
    const prefersReducedMotion = React.useMemo(() => {
      if (typeof window === 'undefined') return false
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }, [])

    if (disableGlow || prefersReducedMotion) {
      return (
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className={cn('glow-card-wrapper relative', wrapperClassName)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          '--mouse-x': `${mousePosition.x}px`,
          '--mouse-y': `${mousePosition.y}px`,
          '--glow-color': glowColor,
          '--glow-intensity': glowIntensity,
          '--glow-size': `${glowSize}px`,
        } as React.CSSProperties}
      >
        {/* Glow border effect */}
        <div
          className={cn(
            'glow-card-border pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300',
            isHovered && 'opacity-100'
          )}
          style={{
            background: `radial-gradient(${glowSize}px circle at var(--mouse-x) var(--mouse-y), var(--glow-color), transparent 40%)`,
          }}
        />
        
        {/* Content wrapper */}
        <div
          ref={ref}
          className={cn('glow-card-content relative z-10', className)}
          {...props}
        >
          {children}
        </div>
      </div>
    )
  }
)
GlowCard.displayName = 'GlowCard'

export { GlowCard }
export type { GlowCardProps }
