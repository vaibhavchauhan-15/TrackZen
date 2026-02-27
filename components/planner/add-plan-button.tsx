'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function AddPlanFAB() {
  return (
    <Link href="/planner/new">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-accent-purple text-white rounded-2xl flex items-center justify-center shadow-lg z-40 hover:bg-accent-purple/90 transition-colors"
        style={{ boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' }}
      >
        <Plus size={22} className="sm:w-6 sm:h-6" />
      </motion.button>
    </Link>
  )
}

interface AddPlanButtonProps {
  className?: string
}

export function AddPlanButton({ className }: AddPlanButtonProps) {
  return (
    <Link href="/planner/new">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button size="default" className={`bg-accent-purple hover:bg-accent-purple/90 ${className}`}>
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          New Plan
        </Button>
      </motion.div>
    </Link>
  )
}
