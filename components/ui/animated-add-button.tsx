'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AnimatedAddButtonProps {
  /** Button text to display */
  text: string
  /** Optional link href - if provided, button acts as a link */
  href?: string
  /** Click handler - used when no href is provided */
  onClick?: () => void
  /** Additional CSS classes */
  className?: string
  /** Button size variant */
  size?: 'sm' | 'default'
}

export function AnimatedAddButton({
  text,
  href,
  onClick,
  className,
  size = 'default',
}: AnimatedAddButtonProps) {
  // Calculate dynamic widths based on size
  const isSmall = size === 'sm'
  const buttonWidth = isSmall ? 145 : 160
  const buttonHeight = isSmall ? 36 : 40
  const iconWidth = isSmall ? 36 : 39
  const svgSize = isSmall ? 16 : 20
  const boxShadowSize = isSmall ? '3px 3px' : '4px 4px'

  const buttonElement = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'animated-add-btn group/addBtn',
        isSmall && 'animated-add-btn--sm',
        className
      )}
      style={{
        // CSS Variables for dynamic values
        '--btn-width': `${buttonWidth}px`,
        '--btn-height': `${buttonHeight}px`,
        '--icon-width': `${iconWidth}px`,
        '--icon-translate': `${buttonWidth - iconWidth - 2}px`,
        '--text-translate': `${(buttonWidth - iconWidth) / 2 - 30}px`,
        '--svg-size': `${svgSize}px`,
        '--box-shadow': boxShadowSize,
      } as React.CSSProperties}
    >
      {/* Button Text */}
      <span className="animated-add-btn__text">{text}</span>

      {/* Icon Container */}
      <span className="animated-add-btn__icon">
        <svg
          className="animated-add-btn__svg"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {buttonElement}
      </Link>
    )
  }

  return buttonElement
}

export default AnimatedAddButton
