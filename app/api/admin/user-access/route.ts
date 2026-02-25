import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/admin/user-access
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (!session || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { userId, action } = await request.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });

  // Prevent admin from acting on themselves
  if (userId === (session.user as { id: string }).id) {
    return NextResponse.json({ error: "Admins cannot perform this action on themselves" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const newStatus = action === "disable" ? "DISABLED" : action === "revoke" ? "REVOKED" : null;
  if (!newStatus) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  // If main resident, cascade to dependants
  if (user.role === "MAIN_RESIDENT") {
    await prisma.user.updateMany({
      where: { mainResidentId: userId },
      data: { status: { set: newStatus } },
    });
  }

  await prisma.user.update({ where: { id: userId }, data: { status: { set: newStatus } } });
  return NextResponse.json({ success: true, message: `User ${action}d successfully` });
}
