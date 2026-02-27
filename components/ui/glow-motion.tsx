'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowMotionDivProps extends HTMLMotionProps<'div'> {
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
  disableGlow?: boolean
}

/**
 * A motion.div component with cursor-following glow effect.
 * Use this for elements that need both framer-motion animations and glow effect.
 */
const GlowMotionDiv = React.forwardRef<HTMLDivElement, GlowMotionDivProps>(
  ({ 
    className, 
    onMouseMove, 
    glowColor = 'rgba(124, 58, 237, 0.5)',
    glowSize = 200,
    disableGlow = false,
    style,
    ...props 
  }, ref) => {
    const innerRef = React.useRef<HTMLDivElement | null>(null)
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
    
    // Check for reduced motion preference
    React.useEffect(() => {
      if (typeof window === 'undefined') return
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    const showGlow = !disableGlow && !prefersReducedMotion
    
    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!showGlow || !innerRef.current) return
      const rect = innerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      innerRef.current.style.setProperty('--mouse-x', `${x}px`)
      innerRef.current.style.setProperty('--mouse-y', `${y}px`)
      // Call original onMouseMove if provided
      if (onMouseMove) {
        onMouseMove(e as any)
      }
    }, [showGlow, onMouseMove])

    // Combine refs using callback ref
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref]
    )
    
    return (
      <motion.div
        ref={setRefs}
        className={cn(showGlow && 'glow-interactive', className)}
        onMouseMove={showGlow ? handleMouseMove : onMouseMove}
        style={{
          ...(showGlow ? {
            '--glow-color': glowColor,
            '--glow-size': `${glowSize}px`,
          } as React.CSSProperties : {}),
          ...style,
        }}
        {...props}
      />
    )
  }
)
GlowMotionDiv.displayName = 'GlowMotionDiv'

export { GlowMotionDiv }
export type { GlowMotionDivProps }
