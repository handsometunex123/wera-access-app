import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Approve or reject a dependant permission request (admin only)
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = await request.json();
  if (!params.id || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  // Update request status
  const req = await prisma.dependantPermissionRequest.update({
    where: { id: params.id },
    data: { status: action },
  });
  // If approved, update dependant's canManageCodes flag (add this field to User if not present)
  if (action === "APPROVED") {
    await prisma.user.update({ where: { id: req.dependantId }, data: { canManageCodes: true } });
  }
  if (action === "REJECTED") {
    await prisma.user.update({ where: { id: req.dependantId }, data: { canManageCodes: false } });
  }
  return NextResponse.json({ success: true });
}
