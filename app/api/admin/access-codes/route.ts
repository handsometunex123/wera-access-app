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

  const where = search
    ? {
        OR: [
          { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [total, codes] = await Promise.all([
    prisma.accessCode.count({ where }),
    prisma.accessCode.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    codes,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// POST /api/admin/access-codes/[id]/revoke
// This handler is for /api/admin/access-codes/[id]/revoke, not the list endpoint
export async function POST() {
  return NextResponse.json({ error: "Use /api/admin/access-codes/[id]/revoke for revoking." }, { status: 405 });
}
