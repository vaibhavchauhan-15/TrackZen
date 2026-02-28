'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FloatingAddButtonProps {
  onClick?: () => void
  href?: string
  title?: string
  className?: string
}

export function FloatingAddButton({
  onClick,
  href,
  title = 'Add New',
  className,
}: FloatingAddButtonProps) {
  const buttonContent = (
    <motion.button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'group cursor-pointer outline-none',
        'fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40',
        className
      )}
      whileHover={{ rotate: 90 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <svg
        className="w-12 h-12 sm:w-14 sm:h-14"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.4))',
        }}
      >
        {/* Outer circle - purple stroke with cyan fill on hover */}
        <path
          className={cn(
            'stroke-accent-purple fill-transparent',
            'group-hover:fill-accent-cyan',
            'group-active:fill-accent-cyan/80 group-active:duration-0',
            'transition-all duration-300'
          )}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
        />
        {/* Plus sign - white color */}
        <path
          className="stroke-white"
          strokeWidth="1.5"
          strokeLinecap="round"
          d="M8 12H16"
        />
        <path
          className="stroke-white"
          strokeWidth="1.5"
          strokeLinecap="round"
          d="M12 16V8"
        />
      </svg>
    </motion.button>
  )

  if (href) {
    return <Link href={href}>{buttonContent}</Link>
  }

  return buttonContent
}
