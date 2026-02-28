'use client'

import { FloatingAddButton } from '@/components/ui/floating-add-button'
import { AnimatedAddButton } from '@/components/ui/animated-add-button'

export function AddPlanFAB() {
  return <FloatingAddButton href="/planner/new" title="Add New Plan" />
}

interface AddPlanButtonProps {
  className?: string
  size?: 'sm' | 'default'
}

export function AddPlanButton({ className, size = 'default' }: AddPlanButtonProps) {
  return (
    <AnimatedAddButton href="/planner/new" text="New Plan" size={size} className={className} />
  )
}
