export interface PlanSummary {
  id: string
  title: string
  type: 'exam' | 'work' | 'course' | 'custom'
  status: 'active' | 'completed' | 'paused'
  startDate: string
  endDate?: string | null
  completedTopics: number
  totalTopics: number
  totalEstimatedHours: number
  color?: string
}

export interface PlanStats {
  totalPlans: number
  activePlans: number
  completedPlans: number
  totalHours: number
}
