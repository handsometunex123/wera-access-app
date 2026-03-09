import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

async function expireAccessCodes() {
  const now = new Date();
  const expired = await prisma.accessCode.updateMany({
    where: {
      inviteEnd: { lt: now },
      status: 'ACTIVE',
    },
    data: { status: 'EXPIRED' },
  });
  if (expired.count > 0) {
    console.log(`[${new Date().toISOString()}] Expired ${expired.count} access codes.`);
  }
}

async function expireInvites() {
  const now = new Date();
  const expired = await prisma.invite.updateMany({
    where: {
      expiresAt: { lt: now },
      NOT: { status: 'EXPIRED' },
    },
    data: { status: 'EXPIRED' },
  });
  if (expired.count > 0) {
    console.log(`[${new Date().toISOString()}] Expired ${expired.count} invites.`);
  }
}

async function runExpirationJob() {
  try {
    await expireAccessCodes();
    await expireInvites();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Cron job failed:`, err);
  }
}

// Run once at startup
runExpirationJob();

// Schedule to run every hour
cron.schedule('0 * * * *', runExpirationJob);

// Keep process alive if run as a worker
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
