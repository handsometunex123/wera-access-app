-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "rejectionReason" TEXT;
