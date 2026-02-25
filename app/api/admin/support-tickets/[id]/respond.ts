import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/admin/support-tickets/[id]/respond
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { response } = await req.json();
  if (!response) {
    return NextResponse.json({ error: "Response message required" }, { status: 400 });
  }
  // Get user ID from next-auth session
  const session = await getServerSession(authOptions);
  // Use email as user identifier, then fetch userId from DB
  const userEmail = session?.user?.email;
  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized: missing user email" }, { status: 401 });
  }
  const user = await prisma.user.findFirst({ where: { email: userEmail } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userId = user.id;
  try {
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
    return NextResponse.json({ success: true, ticket });
  } catch {
    return NextResponse.json({ error: "Failed to respond to ticket" }, { status: 400 });
  }
}
