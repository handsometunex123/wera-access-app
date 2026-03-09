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

// PATCH /api/resident/support-tickets/messages/[id]
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const messageId = params.id;

  const body = await req.json().catch(() => ({}));
  const newMessage = (body?.message as string | undefined)?.trim();
  if (!newMessage) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.supportTicketMessage.findUnique({
      where: { id: messageId },
      include: {
        ticket: {
          include: {
            messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!existing || !existing.ticket || existing.userId !== userId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Ensure ticket belongs to this resident
    if (existing.ticket.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const createdAt = new Date(existing.createdAt);
    if (Date.now() - createdAt.getTime() > 60_000) {
      return NextResponse.json({ error: "Edit window has expired" }, { status: 400 });
    }

    await prisma.supportTicketMessage.update({
      where: { id: messageId },
      data: { message: newMessage },
    });

    const updatedTicket = await prisma.supportTicket.findUnique({
      where: { id: existing.ticketId },
      include: {
        messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!updatedTicket) {
      return NextResponse.json({ error: "Ticket not found after update" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: serializeTicket(updatedTicket as unknown as DbTicket, userId) });
  } catch (err) {
    console.error("Failed to edit support ticket message", err);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 400 });
  }
}
