import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/profile-update-requests/[id]/reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const request = await prisma.profileUpdateRequest.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    // Optionally, add audit logging here
    return NextResponse.json({ success: true, request });
  } catch (e) {
    return NextResponse.json({ error: "Failed to reject request" }, { status: 400 });
  }
}
