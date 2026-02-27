'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Disable the glow effect on this card
   */
  disableGlow?: boolean
  /**
   * Custom glow color (CSS color value)
   */
  glowColor?: string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, disableGlow = false, glowColor = 'rgba(124, 58, 237, 0.5)', ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null)
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

    // Combine refs
    React.useImperativeHandle(ref, () => cardRef.current as HTMLDivElement)

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
      if (!showGlow || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      cardRef.current.style.setProperty('--mouse-x', `${x}px`)
      cardRef.current.style.setProperty('--mouse-y', `${y}px`)
    }, [showGlow])

    return (
      <div
        ref={cardRef}
        className={cn(
          'rounded-lg border border-border bg-bg-surface text-text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
          showGlow && 'glow-interactive',
          className
        )}
        onMouseMove={showGlow ? handleMouseMove : undefined}
        style={showGlow ? {
          '--glow-color': glowColor,
          '--glow-size': '200px',
        } as React.CSSProperties : undefined}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-text-secondary', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
