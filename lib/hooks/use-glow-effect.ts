'use client'

import { useCallback, useRef, useState, useEffect } from 'react'

interface UseGlowEffectOptions {
  /**
   * Whether the glow effect is disabled
   */
  disabled?: boolean
  /**
   * Glow color in CSS format
   */
  glowColor?: string
  /**
   * Size of the glow in pixels
   */
  glowSize?: number
}

interface GlowEffectReturn {
  /**
   * Ref to attach to the element
   */
  ref: React.RefObject<HTMLElement | null>
  /**
   * Props to spread on the element for mouse tracking
   */
  glowProps: {
    onMouseMove: (e: React.MouseEvent) => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    style: React.CSSProperties
    'data-glow': boolean
  }
  /**
   * Whether the element is currently hovered
   */
  isHovered: boolean
}

/**
 * Hook to add cursor-following glow effect to any element
 */
export function useGlowEffect(options: UseGlowEffectOptions = {}): GlowEffectReturn {
  const { 
    disabled = false,
    glowColor = 'rgba(124, 58, 237, 0.5)',
    glowSize = 200
  } = options

  const ref = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: '50%', y: '50%' })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (disabled || prefersReducedMotion || !ref.current) return
    
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x: `${x}px`, y: `${y}px` })
  }, [disabled, prefersReducedMotion])

  const handleMouseEnter = useCallback(() => {
    if (!disabled && !prefersReducedMotion) {
      setIsHovered(true)
    }
  }, [disabled, prefersReducedMotion])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  const shouldDisable = disabled || prefersReducedMotion

  return {
    ref,
    glowProps: {
      onMouseMove: handleMouseMove,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      style: shouldDisable ? {} : {
        '--mouse-x': mousePos.x,
        '--mouse-y': mousePos.y,
        '--glow-color': glowColor,
        '--glow-size': `${glowSize}px`,
      } as React.CSSProperties,
      'data-glow': !shouldDisable,
    },
    isHovered,
  }
}

/**
 * Higher-order function to add glow effect inline
 * Returns event handlers and styles to spread on an element
 */
export function createGlowHandlers(
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseGlowEffectOptions = {}
) {
  const { 
    glowColor = 'rgba(124, 58, 237, 0.5)',
    glowSize = 200
  } = options

  return {
    onMouseMove: (e: React.MouseEvent) => {
      if (!elementRef.current) return
      const rect = elementRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      elementRef.current.style.setProperty('--mouse-x', `${x}px`)
      elementRef.current.style.setProperty('--mouse-y', `${y}px`)
      elementRef.current.style.setProperty('--glow-color', glowColor)
      elementRef.current.style.setProperty('--glow-size', `${glowSize}px`)
    },
  }
}
