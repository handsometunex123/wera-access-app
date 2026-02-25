import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch all users with role ADMIN
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImage: true,
      },
    });
    return NextResponse.json({ contacts: admins });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load admin contacts." }, { status: 500 });
  }
}
