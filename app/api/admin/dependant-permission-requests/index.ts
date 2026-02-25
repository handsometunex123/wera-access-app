import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all dependant permission requests (admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const requests = await prisma.dependantPermissionRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dependant: { select: { id: true, fullName: true, email: true } },
      mainResident: { select: { id: true, fullName: true, email: true } },
    },
  });
  return NextResponse.json({ requests });
}
