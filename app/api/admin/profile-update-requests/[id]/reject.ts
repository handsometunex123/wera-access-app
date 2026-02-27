import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { notifyAdmins } from "@/lib/adminNotifications";

// POST /api/admin/profile-update-requests/[id]/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const session = await getServerSession();
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const request = await prisma.profileUpdateRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    // Notify admins
    // await notifyAdmins(`${session.user?.fullName || session.user?.email} rejected profile update request ${id}`);
    return NextResponse.json({ success: true, request });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reject request" }, { status: 400 });
  }
}
