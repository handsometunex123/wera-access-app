import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession();
    const user = session?.user as { role?: string } | undefined;
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = "then" in context.params ? await context.params : context.params;
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const requests = await prisma.paymentRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("/api/admin/users/[id]/payment-history error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
