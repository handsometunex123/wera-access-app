import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/users/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await getServerSession();
  if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        invites: true,
        accessCodes: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 400 });
  }
}
