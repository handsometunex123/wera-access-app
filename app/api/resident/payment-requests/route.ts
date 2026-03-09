import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "MAIN_RESIDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: { userId: session.user.id },
      include: {
        admin: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(paymentRequests);
  } catch (error) {
    console.error("Error fetching payment requests:", error);
    return NextResponse.json({ error: "Failed to fetch payment requests" }, { status: 500 });
  }
}