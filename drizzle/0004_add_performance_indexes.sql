-- Add performance indexes for frequently queried columns

-- Topics table indexes for faster queries
CREATE INDEX IF NOT EXISTS "topics_plan_id_idx" ON "topics"("plan_id");
CREATE INDEX IF NOT EXISTS "topics_parent_id_idx" ON "topics"("parent_id");
CREATE INDEX IF NOT EXISTS "topics_plan_parent_idx" ON "topics"("plan_id", "parent_id");
CREATE INDEX IF NOT EXISTS "topics_status_idx" ON "topics"("status");
CREATE INDEX IF NOT EXISTS "topics_priority_idx" ON "topics"("priority");
CREATE INDEX IF NOT EXISTS "topics_scheduled_date_idx" ON "topics"("scheduled_date");

-- Plans table indexes
CREATE INDEX IF NOT EXISTS "plans_user_id_idx" ON "plans"("user_id");
CREATE INDEX IF NOT EXISTS "plans_user_status_idx" ON "plans"("user_id", "status");

-- Daily progress indexes
CREATE INDEX IF NOT EXISTS "daily_progress_topic_date_idx" ON "daily_progress"("topic_id", "date");
CREATE INDEX IF NOT EXISTS "daily_progress_user_date_idx" ON "daily_progress"("user_id", "date");

-- Habit logs indexes
CREATE INDEX IF NOT EXISTS "habit_logs_habit_date_idx" ON "habit_logs"("habit_id", "date");
CREATE INDEX IF NOT EXISTS "habit_logs_user_date_idx" ON "habit_logs"("user_id", "date");

-- Streaks indexes
CREATE INDEX IF NOT EXISTS "streaks_user_type_idx" ON "streaks"("user_id", "type");
CREATE INDEX IF NOT EXISTS "streaks_ref_id_idx" ON "streaks"("ref_id");
