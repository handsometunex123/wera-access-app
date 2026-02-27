import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDependantApprovalEmail } from "@/lib/email";
import { getServerSession } from "@/lib/getServerSession";

// POST /api/admin/pending-users/[id]/approve
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const session = await getServerSession();
    // if (!session || (session.user as any)?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
    // Fetch user first
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // If dependant, check main resident status and set estateUniqueId/address at approval
    let updatedUser;
    if (user.role === "DEPENDANT" && user.mainResidentId) {
      const mainResident = await prisma.user.findUnique({ where: { id: user.mainResidentId } });
      if (!mainResident || mainResident.status !== "APPROVED") {
        return NextResponse.json({ error: "Cannot approve dependant before main resident is approved." }, { status: 400 });
      }
      // Generate estateUniqueId and set address from main resident
      const { randomUUID } = await import("crypto");
      const estateUniqueId = `WERA/DP/${randomUUID().slice(0, 8)}`;
      updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "APPROVED",
          estateUniqueId,
          address: mainResident.address || "",
        },
      });
      // Generate a secure, expiring password reset token and send reset link
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
      await prisma.passwordResetToken.create({
        data: {
          userId: updatedUser.id,
          token,
          expiresAt,
        },
      });
      const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
      await sendDependantApprovalEmail({
        to: updatedUser.email,
        resetLink,
      });
    } else {
      // Approve user (non-dependant)
      updatedUser = await prisma.user.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    }
    // Notify admins
    // await notifyAdmins(`${session.user?.fullName || session.user?.email} approved user ${updatedUser.email}`);
    return NextResponse.json({ success: true, user: updatedUser });
  } catch {
    return NextResponse.json({ error: "Failed to approve user" }, { status: 400 });
  }
}
