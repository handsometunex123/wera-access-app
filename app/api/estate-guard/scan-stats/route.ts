import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

async function requireEstateGuard() {
  const session = await getServerSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ESTATE_GUARD") {
    return null;
  }
  return user;
}

export async function GET() {
  const user = await requireEstateGuard();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Fetch the last 50 scan attempts, ordered by most recent
  const scans = await prisma.codeScanLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      guard: true,
      code: true,
    },
  });
  // Map to return code value from code relation
  const mappedScans = scans.map(scan => ({
    id: scan.id,
    status: scan.status,
    createdAt: scan.createdAt,
    guard: scan.guard ? { id: scan.guard.id, fullName: scan.guard.fullName } : null,
    code: scan.code?.code || null,
  }));
  return NextResponse.json({ stats: mappedScans });
  return NextResponse.json({ stats: scans });
}
