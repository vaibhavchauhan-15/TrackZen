import { db } from './db'
import { plans, topics } from './db/schema'
import { eq } from 'drizzle-orm'

interface Topic {
  id?: string
  title: string
  estimatedHours: number
  priority: number
  weightage?: number
  scheduledDate?: string
  orderIndex: number
  subtopics?: Topic[]
}

export async function schedulePlan(
  planId: string,
  startDate: Date,
  endDate: Date | null,
  dailyHours: number | null,
  topicsList: Topic[]
) {
  // Calculate total hours
  const totalHours = calculateTotalHours(topicsList)

  // Date-bounded mode
  if (endDate) {
    const availableDays = calculateAvailableDays(startDate, endDate)
    const hoursPerDay = totalHours / availableDays

    let currentDate = new Date(startDate)
    let remainingDailyHours = hoursPerDay
    let topicIndex = 0
    const sortedTopics = sortTopicsByPriority(topicsList)

    const scheduledTopics: Topic[] = []

    for (const topic of sortedTopics) {
      const topicWithSchedule = { ...topic }
      let remainingHours = topic.estimatedHours

      while (remainingHours > 0) {
        if (remainingDailyHours >= remainingHours) {
          topicWithSchedule.scheduledDate = currentDate.toISOString().split('T')[0]
          remainingDailyHours -= remainingHours
          remainingHours = 0
        } else {
          remainingHours -= remainingDailyHours
          currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
          remainingDailyHours = hoursPerDay
        }
      }

      scheduledTopics.push(topicWithSchedule)
    }

    return scheduledTopics
  }

  // Open-ended mode
  if (dailyHours) {
    const daysNeeded = Math.ceil(totalHours / dailyHours)
    const estimatedEndDate = new Date(startDate)
    estimatedEndDate.setDate(estimatedEndDate.getDate() + daysNeeded)

    return {
      daysNeeded,
      estimatedEndDate,
      topics: topicsList,
    }
  }

  return topicsList
}

function calculateTotalHours(topics: Topic[]): number {
  return topics.reduce((total, topic) => {
    const topicHours = topic.estimatedHours
    const subtopicHours = topic.subtopics
      ? calculateTotalHours(topic.subtopics)
      : 0
    return total + topicHours + subtopicHours
  }, 0)
}

function calculateAvailableDays(startDate: Date, endDate: Date): number {
  const diff = endDate.getTime() - startDate.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

function sortTopicsByPriority(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => a.priority - b.priority)
}

export async function reschedulePlan(planId: string) {
  // Get plan and topics
  const plan = await db.select().from(plans).where(eq(plans.id, planId)).limit(1)
  const planTopics = await db.select().from(topics).where(eq(topics.planId, planId))

  if (plan.length === 0) return null

  // Get incomplete topics
  const incompleteTopics = planTopics.filter(
    (t) => t.status !== 'completed'
  )

  // Reschedule from today
  const today = new Date()
  const endDate = plan[0].endDate ? new Date(plan[0].endDate) : null

  if (endDate) {
    const rescheduled = await schedulePlan(
      planId,
      today,
      endDate,
      plan[0].dailyHours,
      incompleteTopics as any
    )

    // Update topics in database
    for (const topic of rescheduled as Topic[]) {
      if (topic.id && topic.scheduledDate) {
        await db
          .update(topics)
          .set({ scheduledDate: topic.scheduledDate })
          .where(eq(topics.id, topic.id))
      }
    }
  }

  return true
}
