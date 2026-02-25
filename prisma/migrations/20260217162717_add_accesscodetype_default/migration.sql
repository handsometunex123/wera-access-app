-- CreateEnum
CREATE TYPE "AccessCodeType" AS ENUM ('ADMIN', 'RESIDENT');

-- AlterTable
ALTER TABLE "AccessCode" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "AccessCodeType" DEFAULT 'ADMIN';
