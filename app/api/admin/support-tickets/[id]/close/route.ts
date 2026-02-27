import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/support-tickets/[id]/close
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const { id } = params;
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: { status: "CLOSED" },
    });
    return NextResponse.json({ success: true, ticket });
  } catch (e) {
    return NextResponse.json({ error: "Failed to close ticket" }, { status: 400 });
  }
}