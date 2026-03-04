'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

// Simple per-page fade-in. No AnimatePresence / mode="wait" so there is
// never a gap where nothing is rendered (which caused the blank page on revisit).
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}
