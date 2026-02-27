import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET() {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string; role?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      dependants: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({
    profile: {
      ...user,
    },
  });
}
