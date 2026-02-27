import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "@/lib/getServerSession";

// POST: Generate admin access code by main resident
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "MAIN_RESIDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { purpose, guestName, validityMinutes, usageType, usageLimit } = await req.json();
    if (!purpose || !validityMinutes || !usageType || !usageLimit) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    // Generate unique 6-digit code
    let code = "";
    let exists = true;
    for (let i = 0; i < 5 && exists; i++) {
      code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
      exists = !!(await prisma.accessCode.findFirst({ where: { code, status: "ACTIVE" } }));
    }
    if (exists) {
      return NextResponse.json({ error: "Could not generate unique code, try again" }, { status: 500 });
    }
    const now = new Date();
    const inviteEnd = new Date(now.getTime() + validityMinutes * 60000);
    const qrCodeUrl = await QRCode.toDataURL(code);
    // Enforce maximum usage limit of 4
    let limitedUsageLimit = Number(usageLimit) || 1;
    if (limitedUsageLimit > 4) limitedUsageLimit = 4;

    const accessCode = await prisma.accessCode.create({
      data: {
        code,
        createdById: user.id,
        type: "ADMIN", // Mark as admin code
        inviteStart: now,
        inviteEnd,
        usageLimit: limitedUsageLimit,
        usageCount: 0,
        entryCount: 0,
        exitCount: 0,
        usageType,
        status: "ACTIVE",
        qrCodeUrl,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "GENERATE_ADMIN_CODE",
        metadata: JSON.stringify({ purpose, guestName, code }),
      },
    });
    return NextResponse.json({ success: true, accessCode });
  } catch (err) {
    console.error("/api/resident/generate-admin-code error:", err);
    return NextResponse.json({ error: "Server error.", details: String(err) }, { status: 500 });
  }
}
