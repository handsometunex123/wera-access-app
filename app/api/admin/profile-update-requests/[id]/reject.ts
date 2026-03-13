import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { notifyAdmins } from "@/lib/adminNotifications";

// POST /api/admin/profile-update-requests/[id]/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession();
    if (!session || (session.user)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rejectionReason = "";
    try {
      const body = await req.json();
      rejectionReason = body.rejectionReason?.trim() || "";
    } catch {
      // fallback if body is not JSON
      rejectionReason = "";
    }
    if (!rejectionReason) {
      return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });
    }

    const request = await prisma.profileUpdateRequest.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason },
    });
    // Notify admins
    // await notifyAdmins(`${session.user?.fullName || session.user?.email} rejected profile update request ${id}`);
    return NextResponse.json({ success: true, request });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reject request" }, { status: 400 });
  }
}
