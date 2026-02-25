import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, code } = await req.json();
  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.verificationCode !== code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 401 });
  }

  // Clear the verification code and allow login
  await prisma.user.update({ where: { email }, data: { verificationCode: null } });

  return NextResponse.json({ message: "Code verified successfully" });
}