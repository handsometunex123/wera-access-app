import prisma from "./prisma";

const ADMIN_MARKER = '__ADMIN_SENT__:';

export async function notifyAdmins(message: string) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!admins || admins.length === 0) return;
    const stored = `${ADMIN_MARKER}${message}`;
    await prisma.notification.createMany({
      data: admins.map(a => ({ userId: a.id, message: stored })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("notifyAdmins error:", err);
  }
}
