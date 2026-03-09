import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/scan-stats?range=day|week
// Returns recent code scan logs for admin analytics; frontend aggregates by time bucket and access method.
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl;
  const range = (url.searchParams.get("range") || "week").toLowerCase();

  const now = new Date();
  // For analytics, always fetch up to the last 30 days; frontend can slice by range.
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const scans = await prisma.codeScanLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
    include: {
      code: {
        select: {
          type: true,
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
  });

  const mapped = scans.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    status: s.status,
    message: s.message,
    accessMethod: s.accessMethod || "ACCESS_CODE",
    codeType: s.code?.type || null,
    resident: s.code?.createdBy
      ? { id: s.code.createdBy.id, fullName: s.code.createdBy.fullName }
      : null,
  }));

  return NextResponse.json({ range, scans: mapped });
}
