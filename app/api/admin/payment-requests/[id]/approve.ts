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

    // Notify the resident that their payment has been marked as paid
    try {
      const amountLabel = typeof request.amount === "number" ? request.amount.toFixed(2) : String(request.amount);
      const detailsSnippet = request.details ? ` - ${request.details}` : "";
      await prisma.notification.create({
        data: {
          userId: request.userId,
          message: `Your payment request of ₦${amountLabel}${detailsSnippet} has been marked as paid by the estate admin.`,
        },
      });
    } catch (notifyError) {
      console.error("Failed to notify resident about payment approval", notifyError);
    }

    return NextResponse.json({ success: true, request });
  } catch {
    return NextResponse.json({ error: "Failed to mark payment as paid" }, { status: 400 });
  }
}
