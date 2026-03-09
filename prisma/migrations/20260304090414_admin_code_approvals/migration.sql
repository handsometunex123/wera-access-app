-- CreateEnum
CREATE TYPE "AdminApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccessMethod" AS ENUM ('ACCESS_CARD', 'FINGERPRINT', 'ACCESS_CODE');

-- AlterTable
ALTER TABLE "AccessCode" ADD COLUMN     "adminApprovalAt" TIMESTAMP(3),
ADD COLUMN     "adminApprovalById" TEXT,
ADD COLUMN     "adminApprovalStatus" "AdminApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "adminRejectionReason" TEXT,
ADD COLUMN     "itemDetails" TEXT,
ADD COLUMN     "itemImageUrl" TEXT,
ADD COLUMN     "purpose" TEXT;

-- AlterTable
ALTER TABLE "CodeScanLog" ADD COLUMN     "accessMethod" "AccessMethod" DEFAULT 'ACCESS_CODE',
ADD COLUMN     "residentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminCodeDisabledReason" TEXT;

-- AddForeignKey
ALTER TABLE "CodeScanLog" ADD CONSTRAINT "CodeScanLog_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
