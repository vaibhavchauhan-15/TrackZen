import { pgTable, uuid, text, timestamp, pgEnum, real, integer, boolean, date, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const planTypeEnum = pgEnum('plan_type', ['exam', 'work', 'course', 'custom'])
export const planStatusEnum = pgEnum('plan_status', ['active', 'completed', 'paused'])
export const topicStatusEnum = pgEnum('topic_status', ['not_started', 'in_progress', 'completed'])
export const habitFrequencyEnum = pgEnum('habit_frequency', ['daily', 'weekly', 'monthly'])
export const habitLogStatusEnum = pgEnum('habit_log_status', ['done', 'missed', 'skipped'])
export const streakTypeEnum = pgEnum('streak_type', ['global', 'plan', 'habit'])
export const topicPriorityEnum = pgEnum('topic_priority', ['highest', 'high', 'medium', 'low'])
export const revisionStageEnum = pgEnum('revision_stage', ['first', 'second', 'third'])
export const mockTestStatusEnum = pgEnum('mock_test_status', ['scheduled', 'completed', 'analysed'])

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settings: jsonb('settings').$type<{
    theme?: string
    notifications?: boolean
    timezone?: string
  }>().default({}),
})

// Plans table
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  type: planTypeEnum('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  dailyHours: real('daily_hours'),
  totalEstimatedHours: real('total_estimated_hours').default(0).notNull(),
  color: text('color').default('#7C3AED').notNull(),
  isAiGenerated: boolean('is_ai_generated').default(false).notNull(),
  status: planStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Topics table
export const topics = pgTable('topics', {
  id: uuid('id').primaryKey().defaultRandom(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  parentId: uuid('parent_id'),
  title: text('title').notNull(),
  estimatedHours: real('estimated_hours').default(0).notNull(),
  priority: topicPriorityEnum('priority').default('medium').notNull(),
  weightage: real('weightage'),
  scheduledDate: date('scheduled_date'),
  orderIndex: integer('order_index').default(0).notNull(),
  status: topicStatusEnum('status').default('not_started').notNull(),
  notes: text('notes'),
  isWeakArea: boolean('is_weak_area').default(false).notNull(),
})

// Daily progress table
export const dailyProgress = pgTable('daily_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  hoursSpent: real('hours_spent').default(0).notNull(),
  completionPct: integer('completion_pct').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Habits table
export const habits = pgTable('habits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Custom').notNull(),
  frequency: habitFrequencyEnum('frequency').default('daily').notNull(),
  targetDays: integer('target_days').array(),
  timeSlot: text('time_slot'),
  priority: integer('priority').default(3).notNull(),
  color: text('color').default('#7C3AED').notNull(),
  icon: text('icon').default('target').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Habit logs table
export const habitLogs = pgTable('habit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  habitId: uuid('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  status: habitLogStatusEnum('status').notNull(),
  note: text('note'),
})

// Streaks table
export const streaks = pgTable('streaks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: streakTypeEnum('type').notNull(),
  refId: uuid('ref_id'),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActiveDate: date('last_active_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Daily Study Logs table
export const dailyStudyLogs = pgTable('daily_study_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  plannedHours: real('planned_hours').default(0).notNull(),
  actualHours: real('actual_hours').default(0).notNull(),
  topicsCompleted: integer('topics_completed').default(0).notNull(),
  revisionDone: boolean('revision_done').default(false).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Mock Tests table
export const mockTests = pgTable('mock_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  testName: text('test_name').notNull(),
  testDate: date('test_date').notNull(),
  status: mockTestStatusEnum('status').default('scheduled').notNull(),
  totalMarks: integer('total_marks'),
  scoredMarks: integer('scored_marks'),
  accuracy: real('accuracy'),
  timeTaken: integer('time_taken'), // in minutes
  sections: jsonb('sections').$type<Array<{
    name: string
    totalQuestions: number
    correctAnswers: number
    wrongAnswers: number
    unattempted: number
    accuracy: number
  }>>(),
  analysisNotes: text('analysis_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Revision Tracking table
export const revisionTracking = pgTable('revision_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  stage: revisionStageEnum('stage').notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  completedDate: date('completed_date'),
  confidenceLevel: integer('confidence_level'), // 1-5
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Mistake Notebook table
export const mistakeNotebook = pgTable('mistake_notebook', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }),
  mockTestId: uuid('mock_test_id').references(() => mockTests.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  yourAnswer: text('your_answer'),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  category: text('category'), // e.g., "Calculation Error", "Concept Unclear", "Time Pressure"
  isResolved: boolean('is_resolved').default(false).notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  lastReviewDate: date('last_review_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Weekly Reviews table
export const weeklyReviews = pgTable('weekly_reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }).notNull(),
  weekStartDate: date('week_start_date').notNull(),
  weekEndDate: date('week_end_date').notNull(),
  plannedHours: real('planned_hours').notNull(),
  actualHours: real('actual_hours').notNull(),
  topicsPlanned: integer('topics_planned').notNull(),
  topicsCompleted: integer('topics_completed').notNull(),
  mockTestsTaken: integer('mock_tests_taken').default(0).notNull(),
  averageAccuracy: real('average_accuracy'),
  weakAreas: text('weak_areas').array(),
  achievements: text('achievements').array(),
  adjustments: text('adjustments'),
  reflection: text('reflection'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  plans: many(plans),
  habits: many(habits),
  streaks: many(streaks),
  dailyProgress: many(dailyProgress),
  habitLogs: many(habitLogs),
  dailyStudyLogs: many(dailyStudyLogs),
  mockTests: many(mockTests),
  revisionTracking: many(revisionTracking),
  mistakeNotebook: many(mistakeNotebook),
  weeklyReviews: many(weeklyReviews),
}))

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.id],
  }),
  topics: many(topics),
  dailyStudyLogs: many(dailyStudyLogs),
  mockTests: many(mockTests),
  weeklyReviews: many(weeklyReviews),
}))

export const topicsRelations = relations(topics, ({ one, many }) => ({
  plan: one(plans, {
    fields: [topics.planId],
    references: [plans.id],
  }),
  parent: one(topics, {
    fields: [topics.parentId],
    references: [topics.id],
  }),
  subtopics: many(topics),
  dailyProgress: many(dailyProgress),
  revisionTracking: many(revisionTracking),
  mistakeNotebook: many(mistakeNotebook),
}))

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  logs: many(habitLogs),
}))

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitLogs.userId],
    references: [users.id],
  }),
}))

export const dailyProgressRelations = relations(dailyProgress, ({ one }) => ({
  user: one(users, {
    fields: [dailyProgress.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [dailyProgress.topicId],
    references: [topics.id],
  }),
}))

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}))

export const dailyStudyLogsRelations = relations(dailyStudyLogs, ({ one }) => ({
  user: one(users, {
    fields: [dailyStudyLogs.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [dailyStudyLogs.planId],
    references: [plans.id],
  }),
}))

export const mockTestsRelations = relations(mockTests, ({ one, many }) => ({
  user: one(users, {
    fields: [mockTests.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [mockTests.planId],
    references: [plans.id],
  }),
  mistakes: many(mistakeNotebook),
}))

export const revisionTrackingRelations = relations(revisionTracking, ({ one }) => ({
  user: one(users, {
    fields: [revisionTracking.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [revisionTracking.topicId],
    references: [topics.id],
  }),
}))

export const mistakeNotebookRelations = relations(mistakeNotebook, ({ one }) => ({
  user: one(users, {
    fields: [mistakeNotebook.userId],
    references: [users.id],
  }),
  topic: one(topics, {
    fields: [mistakeNotebook.topicId],
    references: [topics.id],
  }),
  mockTest: one(mockTests, {
    fields: [mistakeNotebook.mockTestId],
    references: [mockTests.id],
  }),
}))

export const weeklyReviewsRelations = relations(weeklyReviews, ({ one }) => ({
  user: one(users, {
    fields: [weeklyReviews.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [weeklyReviews.planId],
    references: [plans.id],
  }),
}))
