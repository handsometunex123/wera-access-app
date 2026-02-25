import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, Status, Role } from "@prisma/client";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/pending-users?page=1&search=foo
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role")?.trim() || "";

  const validRoles = Object.keys(Role);
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role parameter." }, { status: 400 });
  }

  const where = {
    status: Status.PENDING,
    ...(role ? { role: Role[role as keyof typeof Role] } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        mainResident: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            role: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      mainResident: user.mainResident || null, // Ensure mainResident is null if missing
    })),
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// POST /api/admin/pending-users/resubmit
export async function POST(req: NextRequest) {
  const { resubmissionToken, fullName, email, phone, profileImage } = await req.json();

  // Validate the resubmission token
  const user = await prisma.user.findFirst({
    where: {
      resubmissionToken,
      resubmissionTokenExpiresAt: { gt: new Date() },
      status: Status.REVOKED,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired resubmission token." }, { status: 400 });
  }

  // Update the user's details and set status back to pending
  await prisma.user.update({
    where: { id: user.id },
    data: {
      fullName,
      email,
      phone,
      profileImage,
      status: Status.PENDING,
      resubmissionToken: null,
      resubmissionTokenExpiresAt: null,
    },
  });

  return NextResponse.json({ message: "Resubmission successful. Your details are now pending approval." });
}
