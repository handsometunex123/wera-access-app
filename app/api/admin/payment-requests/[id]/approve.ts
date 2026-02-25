import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/payment-requests/[id]/approve
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const request = await prisma.paymentRequest.update({
      where: { id },
      data: { status: "PAID", rejectReason: null },
    });
    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json({ error: "Failed to mark payment as paid" }, { status: 400 });
  }
}
