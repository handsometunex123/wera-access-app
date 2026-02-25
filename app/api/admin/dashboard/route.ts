import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/dashboard
export async function GET(request: NextRequest) {
  // Session/cookie check for App Router:
  const session = await getServerSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [residentCount, pendingApproval, pendingInvites, activeCodes, recentLogs, recentUsers] = await Promise.all([
    prisma.user.count({ where: { OR: [{ role: "MAIN_RESIDENT" }, { role: "DEPENDANT" }], status: "APPROVED" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "PENDING" } }),
    prisma.invite.count({ where: { status: "PENDING" } }),
    prisma.accessCode.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    residentCount,
    pendingApproval,
    pendingInvites,
    activeCodes,
    recentLogs,
    recentUsers,
  });
}
