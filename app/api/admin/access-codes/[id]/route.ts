import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/access-codes/[id]
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  // Unwrap params if it's a Promise (Next.js 14+ dynamic API route behavior)
  const params = 'then' in context.params ? await context.params : context.params;
  const { id } = params;
  try {
    const code = await prisma.accessCode.findUnique({ where: { id } });
    if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 });
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Failed to fetch code" }, { status: 400 });
  }
}
