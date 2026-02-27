import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { notifyAdmins } from "@/lib/adminNotifications";

// POST /api/admin/profile-update-requests/[id]/approve
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession();
    if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

    const request = await prisma.profileUpdateRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    // Notify all admins about this action
    // await notifyAdmins(`${session.user?.fullName || session.user?.email} approved profile update request ${id}`);
    return NextResponse.json({ success: true, request });
  } catch (e) {
    return NextResponse.json({ error: "Failed to approve request" }, { status: 400 });
  }
}
