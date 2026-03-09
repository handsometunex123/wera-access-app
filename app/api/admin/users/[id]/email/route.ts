import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/admin/users/[id]/email
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  const params = "then" in context.params ? await context.params : context.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { subject, text } = await req.json();
  if (!subject || !text) {
    return NextResponse.json({ error: "Subject and text are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await sendEmail({ to: user.email, subject, text });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send email", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
