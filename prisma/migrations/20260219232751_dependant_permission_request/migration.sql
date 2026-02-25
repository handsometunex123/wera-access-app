-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canManageCodes" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DependantPermissionRequest" (
    "id" TEXT NOT NULL,
    "dependantId" TEXT NOT NULL,
    "mainResidentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DependantPermissionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DependantPermissionRequest" ADD CONSTRAINT "DependantPermissionRequest_dependantId_fkey" FOREIGN KEY ("dependantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DependantPermissionRequest" ADD CONSTRAINT "DependantPermissionRequest_mainResidentId_fkey" FOREIGN KEY ("mainResidentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
