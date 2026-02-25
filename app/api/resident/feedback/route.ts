import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  // Use real session user ID
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  await prisma.feedback.create({
    data: {
      userId,
      message,
    },
  });
  return NextResponse.json({ success: true });
}
