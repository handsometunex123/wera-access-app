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
  const user = searchParams.get('user') || '';
  const action = searchParams.get('action') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const PAGE_SIZE = 20;

  const where: Prisma.AuditLogWhereInput = {};
  if (user) {
    where.user = { is: { OR: [
      { fullName: { contains: user, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: user, mode: Prisma.QueryMode.insensitive } },
    ] } };
  }
  if (action) {
    where.action = { contains: action, mode: Prisma.QueryMode.insensitive };
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
