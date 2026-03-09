import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

type DbMessage = {
  id: string;
  message: string;
  createdAt: Date | string;
  userId: string;
  user?: { role?: string; fullName?: string | null } | null;
};

type DbTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date | string;
  messages: DbMessage[];
};

function serializeTicket(ticket: DbTicket, currentUserId: string) {
  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      message: m.message,
      createdAt: m.createdAt,
      from:
        m.userId === currentUserId
          ? "You"
          : m.user?.role === "ADMIN"
          ? "Estate admin"
          : m.user?.fullName || "Support",
    })),
  };
}

export async function GET() {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rawTickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const tickets = rawTickets.map((t) => serializeTicket(t, userId));
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const { subject, message } = await req.json();
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message required" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      description: message,
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
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({ ticket: serializeTicket(ticket, userId) });
}
