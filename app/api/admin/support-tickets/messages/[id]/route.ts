import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// PATCH /api/admin/support-tickets/messages/[id]
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const messageId = params.id;

  const body = await req.json().catch(() => ({}));
  const newMessage = (body?.message as string | undefined)?.trim();
  if (!newMessage) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const session = await getServerSession();
  const user = (session?.user as { id?: string; role?: string }) || {};
  if (!user.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await prisma.supportTicketMessage.findUnique({
      where: { id: messageId },
      include: {
        ticket: {
          include: {
            user: true,
            messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    if (!existing || !existing.ticket) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.userId !== user.id) {
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
        user: true,
        messages: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
    });

    if (!updatedTicket) {
      return NextResponse.json({ error: "Ticket not found after update" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (err) {
    console.error("Failed to edit support ticket message (admin)", err);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 400 });
  }
}
