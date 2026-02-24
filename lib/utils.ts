import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getStreakColor(days: number): string {
  if (days === 0) return '#6B7280' // gray
  if (days <= 2) return '#EF4444' // red
  if (days <= 6) return '#F97316' // orange
  if (days <= 13) return '#EAB308' // yellow/gold
  if (days <= 29) return '#8B5CF6' // purple
  if (days <= 59) return '#06B6D4' // cyan
  if (days <= 99) return '#F59E0B' // gold gradient
  return '#F59E0B' // rainbow for 100+
}

export function getStreakTitle(days: number): string {
  if (days === 0) return 'No Streak'
  if (days <= 2) return 'Getting Started'
  if (days <= 6) return 'On a Roll'
  if (days <= 13) return 'One Week Strong'
  if (days <= 29) return 'Two Weeks Warrior'
  if (days <= 59) return 'Month Master'
  if (days <= 99) return 'Unstoppable'
  return 'Legend'
}

export function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const today = new Date()
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

export function calculateCompletionPercentage(
  completed: number,
  total: number
): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}
