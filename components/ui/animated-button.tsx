"use client"

import * as React from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  href?: string
  variant?: 'primary' | 'secondary'
  size?: 'default' | 'lg'
  className?: string
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, href, variant = 'primary', size = 'default', className, disabled, ...props }, ref) => {
    const buttonContent = (
      <>
        {/* Background container */}
        <span className="animated-btn-bg">
          <span className="animated-btn-bg-layers">
            <span className={cn(
              "animated-btn-bg-layer animated-btn-bg-layer-1",
              variant === 'primary' ? "bg-accent-orange" : "bg-bg-elevated"
            )} />
            <span className={cn(
              "animated-btn-bg-layer animated-btn-bg-layer-2",
              variant === 'primary' ? "bg-accent-cyan" : "bg-border"
            )} />
            <span className={cn(
              "animated-btn-bg-layer animated-btn-bg-layer-3",
              variant === 'primary' ? "bg-accent-purple" : "bg-bg-surface"
            )} />
          </span>
        </span>
        
        {/* Text content */}
        <span className="animated-btn-inner">
          <span className="animated-btn-inner-static">{children}</span>
          <span className="animated-btn-inner-hover">{children}</span>
        </span>
      </>
    )

    const buttonClasses = cn(
      "animated-btn",
      variant === 'primary' && "animated-btn-primary",
      variant === 'secondary' && "animated-btn-secondary",
      size === 'lg' && "animated-btn-lg",
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    )

    if (href) {
      return (
        <Link href={href} className={buttonClasses}>
          {buttonContent}
        </Link>
      )
    }

    return (
      <button ref={ref} className={buttonClasses} disabled={disabled} {...props}>
        {buttonContent}
      </button>
    )
  }
)

AnimatedButton.displayName = 'AnimatedButton'

export { AnimatedButton }
