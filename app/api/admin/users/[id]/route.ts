import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/users/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await the params promise

  const session = await getServerSession();
  if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        invites: true,
        accessCodes: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 400 });
  }
}

// Ensure the file is treated as an API route by keeping only the GET handler
// Removed any unnecessary exports or code that might confuse Next.js
