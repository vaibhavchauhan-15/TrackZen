-- Add 'highest' priority level to topic_priority enum
ALTER TYPE topic_priority ADD VALUE IF NOT EXISTS 'highest';

-- Note: PostgreSQL enums cannot have values removed easily, so we're keeping all existing values
-- Current enum will have: 'highest', 'high', 'medium', 'low'
