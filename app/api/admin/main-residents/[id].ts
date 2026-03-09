import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Update canGenerateAdminCode and optional disabled reason for a main resident
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { canGenerateAdminCode, adminCodeDisabledReason } = await request.json();
  if (typeof canGenerateAdminCode !== "boolean") {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }
  const resident = await prisma.user.update({
    where: { id: params.id, role: "MAIN_RESIDENT" },
    data: {
      canGenerateAdminCode,
      adminCodeDisabledReason: canGenerateAdminCode ? null : adminCodeDisabledReason || null,
    },
  });
  return NextResponse.json({ success: true, fullName: resident.fullName });
}
