import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/dependants/[id]/password-setup-status
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "DEPENDANT" || user.status !== "APPROVED") {
    return NextResponse.json({ error: "Dependant not found or not approved" }, { status: 404 });
  }
  // Check if there is any active (unexpired) password reset token
  const now = new Date();
  const activeToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      expiresAt: { gt: now },
    },
  });
  // If no active token, check if password is still the system-generated one (not changed)
  // For simplicity, assume if no active token, password is set
  return NextResponse.json({
    awaitingSetup: !!activeToken,
    email: user.email,
    fullName: user.fullName,
  });
}
