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
      read: false,
    };
  });

  const mappedNotifications = notifications.map((n) => ({
    id: n.id,
    title: "General notification",
    subtitle: n.message,
    createdAt: n.createdAt,
    type: "NOTIFICATION",
    read: n.read,
  }));

  const all = [...mappedNotifications, ...mappedScans].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const total = notificationsCount + scansCount;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = all.slice(start, start + pageSize);

  return NextResponse.json({ notifications: pageItems, total, page, pageSize, totalPages });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession();
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, read } = (await req.json()) as { id?: string; read?: unknown };
  if (!id || typeof read !== "boolean") {
    return NextResponse.json({ error: "id and read(boolean) are required" }, { status: 400 });
  }

  // Synthetic IDs for scan notifications don't correspond to a Notification row
  if (id.startsWith("scan-")) {
    return NextResponse.json({ success: true });
  }

  try {
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to update resident notification read state", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 400 });
  }
}
