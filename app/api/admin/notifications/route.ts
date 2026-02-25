import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

  let where = undefined;
  if (search) {
    where = {
      OR: [
        { message: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { user: { is: { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
        { user: { is: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
      ],
    };
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.notification.count({ where }),
  ]);

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
  const { userId, message } = await req.json();
  if (!message || (!userId && userId !== null)) {
    return NextResponse.json({ error: "Message and userId required" }, { status: 400 });
  }
  try {
    if (userId === null) {
      // Send to all users
      await prisma.notification.createMany({
        data: (await prisma.user.findMany({ select: { id: true } })).map(u => ({ userId: u.id, message })),
      });
    } else {
      await prisma.notification.create({ data: { userId, message } });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send notification" }, { status: 400 });
  }
}
