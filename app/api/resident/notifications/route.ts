import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.id;
  const url = req.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") || "10"));
  const limit = page * pageSize;

  const [notifications, notificationsCount, scans, scansCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.codeScanLog.findMany({
      where: { code: { createdById: userId } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { guard: true, code: true },
    }),
    prisma.codeScanLog.count({ where: { code: { createdById: userId } } }),
  ]);

  const mappedScans = scans.map((scan) => {
    const msg = (scan.message || "").toLowerCase();
    const isCheckout = msg.includes("checked out") || msg.includes("checked-out") || msg.includes("checked_out");
    const title = isCheckout ? "New check out" : "New check in";
    const subtitle = isCheckout
      ? "One of your guests checked out some moments ago."
      : "One of your guests checked in some moments ago.";
    return {
      id: `scan-${scan.id}`,
      title,
      subtitle,
      createdAt: scan.createdAt,
      type: "SCAN",
    };
  });

  const mappedNotifications = notifications.map((n) => ({
    id: n.id,
    title: "General notification",
    subtitle: n.message,
    createdAt: n.createdAt,
    type: "NOTIFICATION",
  }));

  const all = [...mappedNotifications, ...mappedScans].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = notificationsCount + scansCount;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = all.slice(start, start + pageSize);

  return NextResponse.json({ notifications: pageItems, total, page, pageSize, totalPages });
}
