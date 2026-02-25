

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const profileImage = formData.get("profileImage") as string | null;

  if (!phone || !address) {
    return NextResponse.json({ error: "Phone and address are required." }, { status: 400 });
  }

  try {
    await prisma.profileUpdateRequest.create({
      data: {
        userId,
        updateType: JSON.stringify({ phone, address, profileImage }),
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit update request." }, { status: 500 });
  }
}
