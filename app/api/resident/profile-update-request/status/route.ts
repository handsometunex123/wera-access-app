import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET() {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const existing = await prisma.profileUpdateRequest.findFirst({ where: { userId, status: "PENDING" } });
    return NextResponse.json({ pending: !!existing });
  } catch (err) {
    console.error("Failed to check pending profile update request", err);
    return NextResponse.json({ error: "Failed to check pending status" }, { status: 500 });
  }
}
