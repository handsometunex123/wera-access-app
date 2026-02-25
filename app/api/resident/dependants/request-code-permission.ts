import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Resident requests code module access for a dependant
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mainResidentId = user.id;
  const { dependantId, reason } = await request.json();
  if (!dependantId || !reason) {
    return NextResponse.json({ error: "Missing dependantId or reason" }, { status: 400 });
  }
  // Check dependant belongs to main resident
  const dep = await prisma.user.findUnique({ where: { id: dependantId } });
  if (!dep || dep.mainResidentId !== mainResidentId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  // Create a permission request (pending admin approval)
  const req = await prisma.dependantPermissionRequest.create({
    data: {
      dependantId,
      mainResidentId,
      reason,
      status: "PENDING",
      type: "CODE_MODULE",
    },
  });
  return NextResponse.json({ success: true, request: req });
}
