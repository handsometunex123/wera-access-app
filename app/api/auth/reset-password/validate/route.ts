import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/auth/reset-password/validate
export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 });
  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset) {
    return NextResponse.json({ error: "Token not found or already used" }, { status: 404 });
  }
  if (reset.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }
  return NextResponse.json({ valid: true });
}
