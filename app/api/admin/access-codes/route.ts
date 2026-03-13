// export { GET, POST } from "../access-codes";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/admin/access-codes?page=1&search=foo
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;
  const search = searchParams.get("search")?.trim() || "";
  const codeType = (searchParams.get("codeType") || "ALL").toUpperCase();
  const validStatuses = ["ACTIVE", "USED", "EXPIRED", "REVOKED", "CHECKED_OUT"] as const;
  type AccessCodeStatusFilter = (typeof validStatuses)[number];
  const rawStatus = (searchParams.get("status") || "ALL").toUpperCase();
  const statusFilter: AccessCodeStatusFilter | null = (validStatuses as readonly string[]).includes(rawStatus)
    ? (rawStatus as AccessCodeStatusFilter)
    : null;

  const baseWhere: Prisma.AccessCodeWhereInput = {
    ...(codeType === "ADMIN"
      ? { type: "ADMIN" }
      : codeType === "RESIDENT" || codeType === "NORMAL"
      ? { type: "RESIDENT" }
      : {}),
    ...(search
      ? {
          OR: [
            { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
            {
              createdBy: {
                is: {
                  OR: [
                    { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };

  const where: Prisma.AccessCodeWhereInput = {
    ...baseWhere,
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [total, codes, groupedStatuses] = await Promise.all([
    prisma.accessCode.count({ where }),
    prisma.accessCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    }),
    prisma.accessCode.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: {
        _all: true,
      },
    }),
  ]);

  const statusCounts = validStatuses.reduce<Record<string, number>>((acc, currentStatus) => {
    acc[currentStatus] = 0;
    return acc;
  }, {});

  for (const row of groupedStatuses) {
    statusCounts[row.status] = row._count._all;
  }

  const totalUnfiltered = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  return NextResponse.json({
    codes,
    total,
    totalUnfiltered,
    statusCounts,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// POST /api/admin/access-codes/[id]/revoke
// This handler is for /api/admin/access-codes/[id]/revoke, not the list endpoint
export async function POST() {
  return NextResponse.json({ error: "Use /api/admin/access-codes/[id]/revoke for revoking." }, { status: 405 });
}
