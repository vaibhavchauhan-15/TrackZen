-- Comprehensive Performance Indexes Migration
-- Run this migration to ensure all critical queries are optimized

-- =====================================================
-- HABITS & HABIT LOGS
-- =====================================================

-- Habits: Filter by user and active status (most common query)
CREATE INDEX IF NOT EXISTS "habits_user_active_idx" ON "habits"("user_id", "is_active");

-- Habit logs: Composite for date range queries
CREATE INDEX IF NOT EXISTS "habit_logs_user_habit_date_idx" ON "habit_logs"("user_id", "habit_id", "date");

-- =====================================================
-- DAILY STUDY LOGS
-- =====================================================

-- Study logs: User + Plan + Date (analytics queries)
CREATE INDEX IF NOT EXISTS "daily_study_logs_user_plan_date_idx" ON "daily_study_logs"("user_id", "plan_id", "date");

-- Study logs: Plan + Date range (weekly/monthly stats)
CREATE INDEX IF NOT EXISTS "daily_study_logs_plan_date_idx" ON "daily_study_logs"("plan_id", "date");

-- =====================================================
-- MOCK TESTS
-- =====================================================

-- Mock tests: User + Plan for filtering
CREATE INDEX IF NOT EXISTS "mock_tests_user_plan_idx" ON "mock_tests"("user_id", "plan_id");

-- Mock tests: Status for filtering
CREATE INDEX IF NOT EXISTS "mock_tests_user_status_idx" ON "mock_tests"("user_id", "status");

-- Mock tests: Date for ordering
CREATE INDEX IF NOT EXISTS "mock_tests_plan_date_idx" ON "mock_tests"("plan_id", "test_date");

-- =====================================================
-- REVISION TRACKING
-- =====================================================

-- Revisions: User + due date queries
CREATE INDEX IF NOT EXISTS "revision_tracking_user_date_idx" ON "revision_tracking"("user_id", "scheduled_date");

-- Revisions: Topic for related queries
CREATE INDEX IF NOT EXISTS "revision_tracking_topic_idx" ON "revision_tracking"("topic_id");

-- Revisions: Pending revisions (completedDate IS NULL)
CREATE INDEX IF NOT EXISTS "revision_tracking_pending_idx" ON "revision_tracking"("user_id", "scheduled_date") WHERE "completed_date" IS NULL;

-- =====================================================
-- MISTAKE NOTEBOOK
-- =====================================================

-- Mistakes: User + unresolved
CREATE INDEX IF NOT EXISTS "mistake_notebook_user_resolved_idx" ON "mistake_notebook"("user_id", "is_resolved");

-- Mistakes: Category filtering
CREATE INDEX IF NOT EXISTS "mistake_notebook_user_category_idx" ON "mistake_notebook"("user_id", "category");

-- =====================================================
-- WEEKLY REVIEWS
-- =====================================================

-- Weekly reviews: Plan + Date
CREATE INDEX IF NOT EXISTS "weekly_reviews_plan_date_idx" ON "weekly_reviews"("plan_id", "week_start_date");

-- =====================================================
-- TOPICS (Additional)
-- =====================================================

-- Topics: Plan + Status (for progress calculation)
CREATE INDEX IF NOT EXISTS "topics_plan_status_idx" ON "topics"("plan_id", "status");

-- Topics: Scheduled date + status (for today's tasks)
CREATE INDEX IF NOT EXISTS "topics_scheduled_status_idx" ON "topics"("scheduled_date", "status");

-- =====================================================
-- USERS (for fast email lookup)
-- =====================================================

-- Users email already has unique constraint, but ensure index exists
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- =====================================================
-- Analyze tables after index creation
-- =====================================================
-- Note: Run ANALYZE on these tables after migration for optimal query planning
-- ANALYZE users;
-- ANALYZE plans;
-- ANALYZE topics;
-- ANALYZE habits;
-- ANALYZE habit_logs;
-- ANALYZE streaks;
-- ANALYZE daily_study_logs;
-- ANALYZE mock_tests;
-- ANALYZE revision_tracking;
-- ANALYZE mistake_notebook;
-- ANALYZE weekly_reviews;
