import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// This endpoint is a placeholder for enforcing single-device login for residents.
// On login, generate a session token and store it in the user record. On each request, check the token matches.
// If a new login occurs, invalidate previous tokens (force logout on other devices).

export async function POST(req: NextRequest) {
  const { userId, sessionToken } = await req.json();
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "Missing userId or sessionToken" }, { status: 400 });
  }
  // Save the new session token for the user, invalidating previous sessions
  await prisma.user.update({
    where: { id: userId },
    data: { sessionToken },
  });
  return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const sessionToken = req.nextUrl.searchParams.get("sessionToken");
  if (!userId || !sessionToken) {
    return NextResponse.json({ error: "Missing userId or sessionToken" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.sessionToken !== sessionToken) {
    return NextResponse.json({ valid: false });
  }
  return NextResponse.json({ valid: true });
}
