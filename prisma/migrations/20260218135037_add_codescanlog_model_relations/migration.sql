-- CreateTable
CREATE TABLE "CodeScanLog" (
    "id" TEXT NOT NULL,
    "guardId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeScanLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CodeScanLog" ADD CONSTRAINT "CodeScanLog_guardId_fkey" FOREIGN KEY ("guardId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeScanLog" ADD CONSTRAINT "CodeScanLog_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "AccessCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
