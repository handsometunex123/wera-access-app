import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { notifyAdmins } from "@/lib/adminNotifications";

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

// POST /api/resident/support-tickets/[id]/respond
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = params.id;

  const body = await req.json().catch(() => ({}));
  const message = (body?.message as string | undefined)?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, subject: true },
    });

    if (!ticket || ticket.userId !== userId) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        userId,
        message,
      },
    });

    const updated = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "Ticket not found after update" }, { status: 404 });
    }

    // Notify admins that a resident replied to a support ticket
    try {
      const actor =
        (session?.user as { fullName?: string | null; email?: string | null })
          ?.fullName ||
        (session?.user as { email?: string | null })?.email ||
        "A resident";
      const subjectLabel = ticket.subject ? `"${ticket.subject}"` : `#${ticket.id}`;
      const note = `${actor} replied to support ticket ${subjectLabel}.`;
      await notifyAdmins(note);
    } catch (notifyError) {
      console.error("Failed to notify admins about resident support ticket reply", notifyError);
    }

    return NextResponse.json({
      success: true,
      ticket: serializeTicket(updated, userId),
    });
  } catch (err) {
    console.error("Failed to respond to ticket", err);
    return NextResponse.json({ error: "Failed to respond to ticket" }, { status: 400 });
  }
}
