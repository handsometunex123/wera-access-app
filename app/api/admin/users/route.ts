import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    // Type guard for session.user
    const user = (session && 'user' in session) ? session.user as { role?: string } : undefined;
    if (!user || user.role !== "ADMIN") {
      console.error("Forbidden: No admin session", { session });
      return NextResponse.json({ error: "Forbidden", debug: { session } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    // Only show approved residents by default
    const where = {
      OR: [
        { role: { equals: "MAIN_RESIDENT" as const } },
        { role: { equals: "DEPENDANT" as const } }
      ],
      status: { equals: "APPROVED" as const }
    };
    const [usersRaw, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // For each user, add awaitingSetup for dependants
    const now = new Date();
    const users = await Promise.all(usersRaw.map(async user => {
      const userObj = Object.fromEntries(Object.entries(user).filter(([key]) => key !== "password"));
      if (user.role === "DEPENDANT") {
        const activeToken = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id, expiresAt: { gt: now } },
        });
        return { ...userObj, awaitingSetup: !!activeToken };
      }
      return userObj;
    }));

    return NextResponse.json({ users, total, page, pageSize });
  } catch (err) {
    console.error("API /api/admin/users error", err);
    return NextResponse.json({ error: "Internal Server Error", debug: String(err) }, { status: 500 });
  }
}
