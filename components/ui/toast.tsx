'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

export const ToastItem = React.forwardRef<HTMLDivElement, ToastProps>(
  function ToastItem({ toast, onClose }, ref) {
    const icons = {
      success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      error: <AlertCircle className="h-5 w-5 text-red-500" />,
      info: <Info className="h-5 w-5 text-blue-500" />,
    }

    const bgColors = {
      success: 'bg-green-500/10 border-green-500/20',
      error: 'bg-red-500/10 border-red-500/20',
      info: 'bg-blue-500/10 border-blue-500/20',
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'flex items-center gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
          bgColors[toast.type]
        )}
      >
        {icons[toast.type]}
        <p className="flex-1 text-sm font-medium text-text-primary">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }
)

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}
