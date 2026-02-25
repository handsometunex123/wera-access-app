import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { UsageType, CodeStatus } from "@prisma/client";

async function requireEstateGuard() {
  const session = await getServerSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ESTATE_GUARD") {
    return null;
  }
  return user;
}

export async function POST(req: NextRequest) {
  const user = await requireEstateGuard();
  if (!user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const guardId: string = user.id;
  const { code } = await req.json();
  if (!code || typeof code !== "string" || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }
  // Find the access code in the database
  const accessCode = await prisma.accessCode.findFirst({ where: { code } });
  if (!accessCode) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  // Check code type and status
  if (accessCode.usageType === UsageType.ENTRY_ONLY && accessCode.status === CodeStatus.USED) {
    return NextResponse.json({ error: "Code is entry-only and has already been used" }, { status: 409 });
  }

  if (accessCode.usageType === UsageType.ENTRY_AND_EXIT && accessCode.status === CodeStatus.USED) {
    // Allow checkout logic here
    await prisma.accessCode.updateMany({
      where: { code },
      data: { status: CodeStatus.CHECKED_OUT, usedAt: new Date() },
    });
    await prisma.codeScanLog.create({
      data: {
        status: "SUCCESS",
        message: "Checked out",
        guardId,
        codeId: accessCode.id,
      },
    });
    if (accessCode.createdById) {
      await prisma.notification.create({
        data: {
          userId: accessCode.createdById,
          message: `Your access code ${code} was used to check out at the gate.`,
        },
      });
    }
    return NextResponse.json({ message: "Code verified and guest checked out!" });
  }

  // Update logic to allow ENTRY_AND_EXIT codes to be used multiple times within the usage limit
  if (accessCode.usageType === UsageType.ENTRY_AND_EXIT) {
    if (accessCode.usageLimit && accessCode.usageCount >= accessCode.usageLimit) {
      return NextResponse.json({ error: "Code usage limit has been reached" }, { status: 409 });
    }

    // Increment usage count after successful use
    await prisma.accessCode.updateMany({
      where: { code },
      data: { usageCount: { increment: 1 } },
    });

    if (accessCode.status === CodeStatus.CHECKED_OUT) {
      return NextResponse.json({ error: "Code has already been used for both entry and exit" }, { status: 409 });
    }
  }

  // Add logic to enforce usage limit
  if (accessCode.usageLimit && accessCode.usageCount >= accessCode.usageLimit) {
    return NextResponse.json({ error: "Code usage limit has been reached" }, { status: 409 });
  }

  // Mark code as used for entry
  await prisma.accessCode.updateMany({
    where: { code },
    data: { status: CodeStatus.USED, usedAt: new Date() },
  });
  // Log successful scan
  await prisma.codeScanLog.create({
    data: {
      status: "SUCCESS",
      message: "Checked in",
      guardId,
      codeId: accessCode.id,
    },
  });
  // Notify resident (notification table)
  if (accessCode.createdById) {
    await prisma.notification.create({
      data: {
        userId: accessCode.createdById,
        message: `Your access code ${code} was used at the gate.`,
      },
    });
  }
  return NextResponse.json({ message: "Code verified and guest checked in!" });
}
