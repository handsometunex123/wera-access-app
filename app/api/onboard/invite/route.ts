import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const inviteId = req.nextUrl.searchParams.get("id");
  if (!inviteId) {
    return NextResponse.json({ error: "Missing invite id" }, { status: 400 });
  }
  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  return NextResponse.json({ invite });
}
