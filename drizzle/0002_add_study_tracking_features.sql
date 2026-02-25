-- Add new enums for study tracking
DO $$ BEGIN
 CREATE TYPE "topic_priority" AS ENUM('high', 'medium', 'low');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "revision_stage" AS ENUM('first', 'second', 'third');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "mock_test_status" AS ENUM('scheduled', 'completed', 'analysed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Modify topics table to add new priority type and weak area flag
ALTER TABLE "topics" ADD COLUMN "priority_new" "topic_priority" DEFAULT 'medium' NOT NULL;
ALTER TABLE "topics" ADD COLUMN "is_weak_area" boolean DEFAULT false NOT NULL;

-- Update existing priority values
UPDATE "topics" SET "priority_new" = 
  CASE 
    WHEN "priority" = 1 THEN 'high'::topic_priority
    WHEN "priority" = 2 THEN 'medium'::topic_priority
    ELSE 'low'::topic_priority
  END;

-- Drop old priority column and rename new one
ALTER TABLE "topics" DROP COLUMN "priority";
ALTER TABLE "topics" RENAME COLUMN "priority_new" TO "priority";

-- Create Daily Study Logs table
CREATE TABLE IF NOT EXISTS "daily_study_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"date" date NOT NULL,
	"planned_hours" real DEFAULT 0 NOT NULL,
	"actual_hours" real DEFAULT 0 NOT NULL,
	"topics_completed" integer DEFAULT 0 NOT NULL,
	"revision_done" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create Mock Tests table
CREATE TABLE IF NOT EXISTS "mock_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"test_name" text NOT NULL,
	"test_date" date NOT NULL,
	"status" "mock_test_status" DEFAULT 'scheduled' NOT NULL,
	"total_marks" integer,
	"scored_marks" integer,
	"accuracy" real,
	"time_taken" integer,
	"sections" jsonb,
	"analysis_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create Revision Tracking table
CREATE TABLE IF NOT EXISTS "revision_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"stage" "revision_stage" NOT NULL,
	"scheduled_date" date NOT NULL,
	"completed_date" date,
	"confidence_level" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create Mistake Notebook table
CREATE TABLE IF NOT EXISTS "mistake_notebook" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid,
	"mock_test_id" uuid,
	"question" text NOT NULL,
	"your_answer" text,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"category" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"last_review_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create Weekly Reviews table
CREATE TABLE IF NOT EXISTS "weekly_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"week_start_date" date NOT NULL,
	"week_end_date" date NOT NULL,
	"planned_hours" real NOT NULL,
	"actual_hours" real NOT NULL,
	"topics_planned" integer NOT NULL,
	"topics_completed" integer NOT NULL,
	"mock_tests_taken" integer DEFAULT 0 NOT NULL,
	"average_accuracy" real,
	"weak_areas" text[],
	"achievements" text[],
	"adjustments" text,
	"reflection" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "daily_study_logs" ADD CONSTRAINT "daily_study_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "daily_study_logs" ADD CONSTRAINT "daily_study_logs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "revision_tracking" ADD CONSTRAINT "revision_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "revision_tracking" ADD CONSTRAINT "revision_tracking_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mistake_notebook" ADD CONSTRAINT "mistake_notebook_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mistake_notebook" ADD CONSTRAINT "mistake_notebook_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "mistake_notebook" ADD CONSTRAINT "mistake_notebook_mock_test_id_mock_tests_id_fk" FOREIGN KEY ("mock_test_id") REFERENCES "mock_tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "daily_study_logs_user_date_idx" ON "daily_study_logs"("user_id", "date");
CREATE INDEX IF NOT EXISTS "daily_study_logs_plan_date_idx" ON "daily_study_logs"("plan_id", "date");
CREATE INDEX IF NOT EXISTS "mock_tests_user_plan_idx" ON "mock_tests"("user_id", "plan_id");
CREATE INDEX IF NOT EXISTS "mock_tests_test_date_idx" ON "mock_tests"("test_date");
CREATE INDEX IF NOT EXISTS "revision_tracking_topic_stage_idx" ON "revision_tracking"("topic_id", "stage");
CREATE INDEX IF NOT EXISTS "revision_tracking_scheduled_date_idx" ON "revision_tracking"("scheduled_date");
CREATE INDEX IF NOT EXISTS "mistake_notebook_user_idx" ON "mistake_notebook"("user_id");
CREATE INDEX IF NOT EXISTS "mistake_notebook_resolved_idx" ON "mistake_notebook"("is_resolved");
CREATE INDEX IF NOT EXISTS "weekly_reviews_plan_week_idx" ON "weekly_reviews"("plan_id", "week_start_date");
