import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDependantApprovalEmail } from "@/lib/email";

// POST /api/admin/dependants/[id]/resend-password-setup
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  // Find the dependant
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "DEPENDANT" || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Dependant not found or not approved" }, { status: 404 });
  }
  // Delete any existing reset tokens for this user
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  // Create a new reset token
  const { randomUUID } = await import("crypto");
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });
  // Send the reset link
  const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;
  await sendDependantApprovalEmail({
    to: user.email,
    resetLink,
  });
  return NextResponse.json({ success: true });
}
