/*
  Warnings:

  - Added the required column `adminId` to the `PaymentRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentRequest` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `PaymentRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN     "adminId" TEXT NOT NULL,
ADD COLUMN     "details" TEXT,
ADD COLUMN     "notificationRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
