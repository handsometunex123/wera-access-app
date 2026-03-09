import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyAdmins } from "@/lib/adminNotifications";

// POST /api/resident/payment-requests/[id]/upload-proof
// Body: { paymentProofUrl: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "MAIN_RESIDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const paymentProofUrl = (body as { paymentProofUrl?: string }).paymentProofUrl;

  if (!paymentProofUrl) {
    return NextResponse.json({ error: "paymentProofUrl is required" }, { status: 400 });
  }

  // Ensure the payment request belongs to the logged-in resident
  const existing = await prisma.paymentRequest.findFirst({
    where: { id, userId },
    include: {
      user: {
        select: { fullName: true, email: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  }

  try {
    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        paymentProofUrl,
      },
    });

    // Notify admins that a resident has uploaded payment proof
    try {
      const residentLabel =
        existing.user?.fullName || existing.user?.email || "A resident";
      const amountLabel = typeof existing.amount === "number" ? existing.amount.toFixed(2) : "";
      const detailsSnippet = existing.details ? ` - ${existing.details}` : "";
      const note = `${residentLabel} uploaded payment proof for a payment request of ₦${amountLabel}${detailsSnippet}.`;
      await notifyAdmins(note);
    } catch (notifyError) {
      console.error("Failed to notify admins about payment proof upload", notifyError);
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Error saving payment proof:", error);
    return NextResponse.json({ error: "Failed to save payment proof" }, { status: 500 });
  }
}
