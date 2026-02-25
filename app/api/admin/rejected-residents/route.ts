import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (!session || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const PAGE_SIZE = 10;

  try {
    const [residents, total] = await Promise.all([
      prisma.user.findMany({
        where: { rejectionReason: { not: null }, role: "MAIN_RESIDENT" },
        select: {
          id: true,
          fullName: true,
          email: true,
          rejectionReason: true,
          dependants: {
            select: {
              id: true,
              fullName: true,
              email: true,
              rejectionReason: true,
            },
          },
        },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.user.count({ where: { rejectionReason: { not: null }, role: "MAIN_RESIDENT" } }),
    ]);

    return NextResponse.json({
      residents: residents.map((resident) => ({
        ...resident,
        dependants: resident.dependants,
      })),
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (error) {
    console.error("Failed to fetch rejected residents", error);
    return NextResponse.json({ error: "Failed to fetch rejected residents" }, { status: 500 });
  }
}