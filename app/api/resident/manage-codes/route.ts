import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "@/lib/getServerSession";

export async function GET() {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const createdById = userId;
  // Fetch all codes for this resident, not deleted, order by most recent
  const codes = await prisma.accessCode.findMany({
    where: { createdById },
    orderBy: { createdAt: "desc" },
  });
  // Generate QR for each code
  const codesWithQr = await Promise.all(
    codes.map(async code => ({
      ...code,
      qr: await QRCode.toDataURL(`CODE:${code.code}`, { width: 96 }),
    }))
  );
  return NextResponse.json({ codes: codesWithQr });
}

export async function POST(req: Request) {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Code ID is required" }, { status: 400 });

  try {
    const code = await prisma.accessCode.findUnique({ where: { id } });
    if (!code) return NextResponse.json({ error: "Code not found" }, { status: 404 });

    if (code.createdById !== userId) {
      return NextResponse.json({ error: "You are not authorized to revoke this code" }, { status: 403 });
    }

    await prisma.accessCode.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ message: "Code revoked successfully" });
  } catch (error) {
    console.error("Error revoking code:", error);
    return NextResponse.json({ error: "An error occurred while revoking the code" }, { status: 500 });
  }
}
