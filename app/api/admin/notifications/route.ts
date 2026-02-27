import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma, Notification } from '@prisma/client';

const ADMIN_MARKER = '__ADMIN_SENT__:';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const PAGE_SIZE = 20;

  // Only fetch notifications that were sent by admins (we mark admin-sent messages)
  let where: Prisma.NotificationWhereInput = { message: { contains: ADMIN_MARKER } };
  if (search) {
    where = {
      AND: [
        { message: { contains: ADMIN_MARKER } },
        {
          OR: [
            { message: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { user: { is: { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
            { user: { is: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
          ],
        },
      ],
    };
  }

  const [notificationsRaw, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
  ]);

  // Strip the admin marker before returning
  const notifications = notificationsRaw.map(n => ({
    ...n,
    message: n.message.startsWith(ADMIN_MARKER) ? n.message.replace(ADMIN_MARKER, '').trim() : n.message,
  }));

  return NextResponse.json({
    notifications,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}

// POST /api/admin/notifications (send notification)
export async function POST(req: NextRequest) {
  const { userId, message, role } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  try {
    const session = await getServerSession(authOptions);
    const isAdminSender = session && (session.user as { role: string }).role !== "ADMIN"
    const storedMessage = isAdminSender ? `${ADMIN_MARKER}${message}` : message;
    if (userId) {
      await prisma.notification.create({ data: { userId, message: storedMessage } });
      return NextResponse.json({ success: true });
    }

    // If a role is provided, send to users with that role. 'ALL' means everyone.
    if (role && role !== 'ALL') {
      const users = await prisma.user.findMany({ where: { role }, select: { id: true } });
      if (users.length === 0) return NextResponse.json({ error: 'No users for role' }, { status: 400 });
      await prisma.notification.createMany({ data: users.map(u => ({ userId: u.id, message: storedMessage })) });
      return NextResponse.json({ success: true });
    }

    // Default: send to all users
    const all = await prisma.user.findMany({ select: { id: true } });
    await prisma.notification.createMany({ data: all.map(u => ({ userId: u.id, message: storedMessage })) });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to send notification', err);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 400 });
  }
}
