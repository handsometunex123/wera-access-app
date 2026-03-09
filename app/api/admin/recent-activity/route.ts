import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/recent-activity
// Returns the latest check-in/out events for the admin dashboard side panel.
export async function GET() {
  const session = await getServerSession();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.codeScanLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      code: {
        include: {
          createdBy: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
  });

  const activity = logs.map((log) => {
    const residentName = log.code?.createdBy?.fullName || "Unknown resident";
    const residentId = log.code?.createdBy?.id || null;
    const method = log.accessMethod || "ACCESS_CODE";
    let accessLabel = "Access Code";
    if (method === "ACCESS_CARD") accessLabel = "Access Card";
    if (method === "FINGERPRINT") accessLabel = "Fingerprint";

    const msg = (log.message || "").toLowerCase();
    const isCheckout = msg.includes("checked out") || msg.includes("checked-out") || msg.includes("checked_out");
    const verb = isCheckout ? "checked out" : "checked in";

    return {
      id: log.id,
      residentId,
      residentName,
      accessMethod: method,
      accessLabel,
      verb,
      createdAt: log.createdAt,
    };
  });

  return NextResponse.json({ activity });
}
