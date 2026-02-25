-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resubmissionToken" TEXT,
ADD COLUMN     "resubmissionTokenExpiresAt" TIMESTAMP(3);
