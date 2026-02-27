-- Migration: add_entry_exit_counts

-- Add entryCount and exitCount to AccessCode
ALTER TABLE "public"."AccessCode" ADD COLUMN IF NOT EXISTS "entryCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."AccessCode" ADD COLUMN IF NOT EXISTS "exitCount" INTEGER NOT NULL DEFAULT 0;

-- Ensure unique index on User.email exists
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "public"."User"("email");
