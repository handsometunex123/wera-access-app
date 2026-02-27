import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendDependantApprovalEmail } from "@/lib/email";

// POST /api/admin/pending-users/[id]/approve
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  console.log({id});
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    // If dependant, send approval email with credentials and reset link
    if (user.role === "DEPENDANT") {
      const resetLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?email=${encodeURIComponent(user.email)}`;
      await sendDependantApprovalEmail({
        to: user.email,
        resetLink,
      });
    }
    // Optionally, add audit logging here
    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to approve user" }, { status: 400 });
  }
}
