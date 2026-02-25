import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/users/[id]/timeline
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const logs = await prisma.auditLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ logs });
}
