import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "@/lib/getServerSession";

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const { inviteTime, validity, usageType, forWhom, numPeople } = await req.json();
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Validate input
  if (!inviteTime || !validity || !usageType || !forWhom) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (validity < 30 || validity > 960) {
    return NextResponse.json({ error: "Validity must be between 30 and 960 minutes" }, { status: 400 });
  }
  // Generate unique 6-digit code
  let code: string = "";
  let exists = true;
  for (let i = 0; i < 5 && exists; i++) {
    code = generate6DigitCode();
    exists = !!(await prisma.accessCode.findFirst({ where: { code } }));
  }
  if (exists) {
    return NextResponse.json({ error: "Could not generate unique code, try again" }, { status: 500 });
  }
  // Save code to DB
  const now = new Date(inviteTime);
  let usageLimit = forWhom === "OTHER" ? Number(numPeople) || 1 : 1;
  if (usageLimit > 4) usageLimit = 4;
  const accessCode = await prisma.accessCode.create({
    data: {
      code,
      status: "ACTIVE",
      inviteStart: now,
      inviteEnd: new Date(now.getTime() + validity * 60000),
      usageType,
      type: "RESIDENT",
      usageLimit,
      usageCount: 0,
      entryCount: 0,
      exitCount: 0,
      createdById: userId,
    },
  });
  // Generate QR code as data URL
  const qrData = `CODE:${accessCode.code}`;
  const qrImage = await QRCode.toDataURL(qrData, { width: 256 });
  // Persist the QR code URL in the database
  await prisma.accessCode.update({
    where: { id: accessCode.id },
    data: { qrCodeUrl: qrImage },
  });
  return NextResponse.json({
    code: accessCode.code,
    qr: qrImage,
    validFrom: accessCode.inviteStart,
    validTo: accessCode.inviteEnd,
    usageType: accessCode.usageType,
    usageLimit: accessCode.usageLimit,
    type: accessCode.type,
    status: accessCode.status,
  });
}
