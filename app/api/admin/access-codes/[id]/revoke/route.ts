import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/admin/access-codes/[id]/revoke
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  // Unwrap params if it's a Promise (Next.js 14+ dynamic API route behavior)
  const params = 'then' in context.params ? await context.params : context.params;
  const { id } = params;
  try {
    const code = await prisma.accessCode.update({
      where: { id },
      data: { status: "REVOKED" },
    });
    // Optionally, add audit logging here
    return NextResponse.json({ success: true, code });
  } catch {
    return NextResponse.json({ error: "Failed to revoke code" }, { status: 400 });
  }
}
