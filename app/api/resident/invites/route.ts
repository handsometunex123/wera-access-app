import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // TODO: Replace with real session user ID
  const userId = "demo-user-id";
  // Fetch all invites (codes) for this resident, order by most recent
  const invites = await prisma.accessCode.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invites });
}
