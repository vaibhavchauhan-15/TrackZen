import { pgTable, uuid, text, timestamp, pgEnum, real, integer, boolean, date, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Enums
export const planTypeEnum = pgEnum('plan_type', ['exam', 'work', 'course', 'custom'])
export const planStatusEnum = pgEnum('plan_status', ['active', 'completed', 'paused'])
export const topicStatusEnum = pgEnum('topic_status', ['not_started', 'in_progress', 'completed'])
export const habitFrequencyEnum = pgEnum('habit_frequency', ['daily', 'weekly', 'monthly'])
export const habitLogStatusEnum = pgEnum('habit_log_status', ['done', 'missed', 'skipped'])
export const streakTypeEnum = pgEnum('streak_type', ['global', 'plan', 'habit'])

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
  priority: integer('priority').default(3).notNull(),
  weightage: real('weightage'),
  scheduledDate: date('scheduled_date'),
  orderIndex: integer('order_index').default(0).notNull(),
  status: topicStatusEnum('status').default('not_started').notNull(),
  notes: text('notes'),
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
  category: text('category').default('Custom').notNull(),
  frequency: habitFrequencyEnum('frequency').default('daily').notNull(),
  targetDays: integer('target_days').array(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  plans: many(plans),
  habits: many(habits),
  streaks: many(streaks),
  dailyProgress: many(dailyProgress),
  habitLogs: many(habitLogs),
}))

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, {
    fields: [plans.userId],
    references: [users.id],
  }),
  topics: many(topics),
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
