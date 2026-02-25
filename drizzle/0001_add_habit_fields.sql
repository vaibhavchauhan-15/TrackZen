-- Add new columns to habits table
ALTER TABLE "habits" ADD COLUMN "description" text;
ALTER TABLE "habits" ADD COLUMN "time_slot" text;
ALTER TABLE "habits" ADD COLUMN "priority" integer DEFAULT 3 NOT NULL;
