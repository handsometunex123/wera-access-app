import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List all main residents
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const residents = await prisma.user.findMany({
    where: { role: "MAIN_RESIDENT" },
    select: {
      id: true,
      fullName: true,
      email: true,
      canGenerateAdminCode: true,
    },
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ residents });
}
