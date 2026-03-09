import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/dashboard
export async function GET() {
  // Session/cookie check for App Router:
  const session = await getServerSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    residentCount,
    pendingApproval,
    approvedUsersCount,
    rejectedUsersCount,
    disabledUsersCount,
    blockedUsersCount,
    pendingInvites,
    activeCodes,
    recentLogs,
    recentUsers,
    mainResidentCount,
    dependantCount,
    estateGuardCount,
  ] = await Promise.all([
    prisma.user.count({ where: { OR: [{ role: "MAIN_RESIDENT" }, { role: "DEPENDANT" }], status: "APPROVED" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "PENDING" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "APPROVED" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "REVOKED" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "DISABLED" } }),
    prisma.user.count({ where: { OR: [
      { role: "MAIN_RESIDENT" },
      { role: "DEPENDANT" },
      { role: "ESTATE_GUARD" }
    ], status: "BLOCKED" } }),
    prisma.invite.count({ where: { status: "PENDING" } }),
    prisma.accessCode.count({ where: { status: "ACTIVE" } }),
    prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.findMany({
      where: {
        status: "PENDING",
        OR: [
          { role: "MAIN_RESIDENT" },
          { role: "DEPENDANT" },
          { role: "ESTATE_GUARD" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.count({ where: { role: "MAIN_RESIDENT", status: "APPROVED" } }),
    prisma.user.count({ where: { role: "DEPENDANT", status: "APPROVED" } }),
    prisma.user.count({ where: { role: "ESTATE_GUARD", status: "APPROVED" } }),
  ]);

  return NextResponse.json({
    residentCount,
    pendingApproval,
    approvedUsersCount,
    rejectedUsersCount,
    disabledUsersCount,
    blockedUsersCount,
    pendingInvites,
    activeCodes,
    recentLogs,
    recentUsers,
    mainResidentCount,
    dependantCount,
    estateGuardCount,
  });
}
