import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(req: NextRequest) {
  // Use real session user ID
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const { subject, message } = await req.json();
  // Use real session user ID
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
  }
  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description: message, // Use message as initial description
      status: "OPEN",
      userId,
      messages: {
        create: {
          message,
          userId,
        },
      },
    },
    include: {
      messages: true,
    },
  });
  return NextResponse.json({ ticket });
}
