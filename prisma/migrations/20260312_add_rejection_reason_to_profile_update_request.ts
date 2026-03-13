// 2026-03-12: Add rejectionReason to ProfileUpdateRequest

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // No data migration needed, just add the column
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
