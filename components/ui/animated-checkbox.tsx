'use client'

import { useRef, useId } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  className?: string
  variant?: 'purple' | 'green'
}

export function AnimatedCheckbox({
  checked,
  onChange,
  disabled = false,
  className,
  variant = 'green',
}: AnimatedCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!disabled) {
      onChange()
    }
  }

  return (
    <div
      className={cn(
        'checkbox-wrapper-12',
        variant === 'green' && 'checkbox-green',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      <div className="cbx">
        <input
          ref={checkboxRef}
          id={id}
          type="checkbox"
          checked={checked}
          onChange={() => {}}
          disabled={disabled}
          className={cn(
            'cursor-pointer transition-all duration-200',
            !checked && (variant === 'green' ? 'hover:border-green-400' : 'hover:border-purple-400')
          )}
        />
        <label htmlFor={id} />
        <svg width="15" height="14" viewBox="0 0 15 14">
          <path d="M2 8.36364L6.23077 12L13 2" />
        </svg>
      </div>
    </div>
  )
}
