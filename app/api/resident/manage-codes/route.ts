import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const createdById = userId;
  const url = req.nextUrl;
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get("pageSize") || "10")));
  const skip = (page - 1) * pageSize;

  const [codes, total, residentTotal, adminTotal, residentStatus, adminStatus] = await Promise.all([
    prisma.accessCode.findMany({
      where: { createdById },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.accessCode.count({ where: { createdById } }),
    prisma.accessCode.count({ where: { createdById, NOT: { type: "ADMIN" } } }),
    prisma.accessCode.count({ where: { createdById, type: "ADMIN" } }),
    prisma.accessCode.groupBy({
      by: ["status"],
      where: { createdById, NOT: { type: "ADMIN" } },
      _count: { _all: true },
    }),
    prisma.accessCode.groupBy({
      by: ["status"],
      where: { createdById, type: "ADMIN" },
      _count: { _all: true },
    }),
  ]);

  const codesWithQr = await Promise.all(
    codes.map(async (code) => ({
      ...code,
      qr: await QRCode.toDataURL(`CODE:${code.code}`, { width: 96 }),
    })),
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const residentStatusCounts = residentStatus.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const adminStatusCounts = adminStatus.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  return NextResponse.json({
    codes: codesWithQr,
    total,
    page,
    pageSize,
    totalPages,
    totals: { resident: residentTotal, admin: adminTotal },
    statusCounts: { resident: residentStatusCounts, admin: adminStatusCounts },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Code ID is required" }, { status: 400 });

  try {
    const code = await prisma.accessCode.findUnique({ where: { id } });
    if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 });

    if (code.createdById !== userId) {
      return NextResponse.json({ error: "You are not authorized to revoke this code" }, { status: 403 });
    }

    await prisma.accessCode.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ message: "Code revoked successfully" });
  } catch (error) {
    console.error("Error revoking code:", error);
    return NextResponse.json({ error: "An error occurred while revoking the code" }, { status: 500 });
  }
}
