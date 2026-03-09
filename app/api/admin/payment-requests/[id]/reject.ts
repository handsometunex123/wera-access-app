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

    // Notify the resident that their payment request was rejected
    try {
      const amountLabel = typeof request.amount === "number" ? request.amount.toFixed(2) : String(request.amount);
      const detailsSnippet = request.details ? ` - ${request.details}` : "";
      await prisma.notification.create({
        data: {
          userId: request.userId,
          message: `Your payment request of ₦${amountLabel}${detailsSnippet} was rejected by the estate admin: ${rejectReason}`,
        },
      });
    } catch (notifyError) {
      console.error("Failed to notify resident about payment rejection", notifyError);
    }

    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json({ error: "Failed to reject payment request" }, { status: 400 });
  }
}
