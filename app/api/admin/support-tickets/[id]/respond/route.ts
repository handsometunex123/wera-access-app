import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// POST /api/admin/support-tickets/[id]/respond
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Next.js expects params to be a Promise
  const params = await context.params;
  const id = params.id;

  const body = await req.json().catch(() => ({}));
  const response = body?.response as string | undefined;
  if (!response) {
    return NextResponse.json({ error: "Response message required" }, { status: 400 });
  }
  // Get user ID from next-auth session
  const session = await getServerSession();
  // Use email as user identifier, then fetch userId from DB
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized: missing user email" }, { status: 401 });
  }
  if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
//   if ((session.user as any)?.role !== 'ADMIN') {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
  const user = await prisma.user.findFirst({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = user.id;
  try {
    if (!id) {
      console.error("Ticket id is missing for respond request");
      return NextResponse.json({ error: "Ticket id missing" }, { status: 400 });
    }

    await prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        userId,
        message: response,
      },
    });
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: true,
        messages: { include: { user: true }, orderBy: { createdAt: "asc" } }
      }
    });
    // Notify admins about this response
    try {
      const actor = session.user?.email || session.user?.name || 'admin';
      const note = `${actor} responded to support ticket ${id}`;
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
      if (admins.length) {
        await prisma.notification.createMany({ data: admins.map(a => ({ userId: a.id, message: note })), skipDuplicates: true });
      }
    } catch (err) {
      console.error('Failed to notify admins about support ticket response', err);
    }
    return NextResponse.json({ success: true, ticket });
  } catch (err) {
    console.error("Failed to respond to ticket", err);
    return NextResponse.json({ error: "Failed to respond to ticket" }, { status: 400 });
  }
}