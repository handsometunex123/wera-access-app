import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/payment-requests/[id]/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { rejectReason } = await req.json();
  if (!rejectReason) {
    return NextResponse.json({ error: "Reject reason required" }, { status: 400 });
  }
  try {
    const request = await prisma.paymentRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectReason },
    });
    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json({ error: "Failed to reject payment request" }, { status: 400 });
  }
}
