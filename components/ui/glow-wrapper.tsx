'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlowWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Custom glow color (CSS color value)
   */
  glowColor?: string
  /**
   * Glow size in pixels
   */
  glowSize?: number
  /**
   * Whether to disable the glow effect
   */
  disabled?: boolean
  /**
   * Element tag to render (default: div)
   */
  as?: keyof JSX.IntrinsicElements
}

/**
 * A wrapper component that adds cursor-following glow effect to any element.
 * Use this for non-Card elements that need the glow effect.
 */
const GlowWrapper = React.forwardRef<HTMLDivElement, GlowWrapperProps>(
  ({ 
    className, 
    children, 
    glowColor = 'rgba(124, 58, 237, 0.5)', 
    glowSize = 200,
    disabled = false,
    ...props 
  }, ref) => {
    const wrapperRef = React.useRef<HTMLDivElement>(null)
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

    // Combine refs
    React.useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement)

    // Check for reduced motion preference
    React.useEffect(() => {
      if (typeof window === 'undefined') return
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    const showGlow = !disabled && !prefersReducedMotion

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!showGlow || !wrapperRef.current) return
      const rect = wrapperRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      wrapperRef.current.style.setProperty('--mouse-x', `${x}px`)
      wrapperRef.current.style.setProperty('--mouse-y', `${y}px`)
    }, [showGlow])

    return (
      <div
        ref={wrapperRef}
        className={cn(
          showGlow && 'glow-interactive',
          className
        )}
        onMouseMove={showGlow ? handleMouseMove : undefined}
        style={showGlow ? {
          '--glow-color': glowColor,
          '--glow-size': `${glowSize}px`,
        } as React.CSSProperties : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlowWrapper.displayName = 'GlowWrapper'

export { GlowWrapper }
export type { GlowWrapperProps }
