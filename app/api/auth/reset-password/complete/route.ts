import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    console.log('Received reset password request');
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    const reset = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } });
    if (!reset) {
      return NextResponse.json({ error: "Reset token not found" }, { status: 400 });
    }
    if (reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset token expired" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: reset.userId }, data: { password: hashedPassword } });
    await prisma.passwordResetToken.delete({ where: { id: reset.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/auth/reset-password/complete error:", error);
    return NextResponse.json({ error: (error as { message: string })?.message || "Internal server error" }, { status: 500 });
  }
}
