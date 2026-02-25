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
        { user: { is: { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
        { user: { is: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } } },
      ],
    };
  }

  const [requests, total] = await Promise.all([
    prisma.paymentRequest.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.paymentRequest.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}

export async function POST(req: NextRequest) {
  const { userId, amount, description } = await req.json();
  if (!userId || !amount || !description) {
    return NextResponse.json({ error: "userId, amount, and description are required" }, { status: 400 });
  }
  // Get adminId from session
  const session = await getServerSession(authOptions);
  const adminEmail = session?.user?.email;
  if (!adminEmail) {
    return NextResponse.json({ error: "Unauthorized: missing admin email" }, { status: 401 });
  }
  const admin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
  try {
    const request = await prisma.paymentRequest.create({
      data: {
        userId,
        adminId: admin.id,
        amount: Number(amount),
        details: description,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 400 });
  }
}
