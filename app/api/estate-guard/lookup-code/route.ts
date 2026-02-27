import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

async function requireEstateGuard() {
  const session = await getServerSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ESTATE_GUARD") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireEstateGuard();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
  const accessCode = await prisma.accessCode.findFirst({ where: { code } });
  if (!accessCode) return NextResponse.json({ error: "Code not found" }, { status: 404 });
  return NextResponse.json({
    code: accessCode.code,
    usageType: accessCode.usageType,
    usageLimit: accessCode.usageLimit,
    entryCount: accessCode.entryCount,
    exitCount: accessCode.exitCount,
  });
}
