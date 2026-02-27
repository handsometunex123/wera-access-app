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
  const body = await req.json();
  const code = body.code;
  let action: "CHECK_IN" | "CHECK_OUT" | undefined;
  if (body && typeof body.action === "string" && (body.action === "CHECK_IN" || body.action === "CHECK_OUT")) {
    action = body.action as "CHECK_IN" | "CHECK_OUT";
  } else {
    action = undefined;
  }
  if (!code || typeof code !== "string" || code.length !== 6) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }
  // Find the access code in the database
  const accessCode = await prisma.accessCode.findFirst({ where: { code } });
  if (!accessCode) {
    return NextResponse.json({ error: "Code not found" }, { status: 404 });
  }

  // For ENTRY_ONLY: enforce limit and mark as USED only when fully consumed
  if (accessCode.usageType === UsageType.ENTRY_ONLY) {
    if (accessCode.usageLimit && accessCode.entryCount >= accessCode.usageLimit) {
      return NextResponse.json({ error: "Code usage limit has been reached" }, { status: 409 });
    }
    // increment entryCount
    await prisma.accessCode.updateMany({ where: { code }, data: { entryCount: { increment: 1 } } });
    // after increment, compute if exhausted and set final status
    const newEntryCount = accessCode.entryCount + 1;
    if (accessCode.usageLimit && newEntryCount >= accessCode.usageLimit) {
      await prisma.accessCode.updateMany({ where: { code }, data: { status: CodeStatus.USED, usedAt: new Date() } });
    }
    await prisma.codeScanLog.create({ data: { status: "SUCCESS", message: "Checked in", guardId, codeId: accessCode.id } });
    if (accessCode.createdById) {
      await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used at the gate.` } });
    }
    return NextResponse.json({ message: "Code verified and guest checked in!" });
  }

  // ENTRY_AND_EXIT semantics: allow explicit action from guard (CHECK_IN | CHECK_OUT)
  if (accessCode.usageType === UsageType.ENTRY_AND_EXIT) {
    const doCheckout = action === "CHECK_OUT";
    const doCheckin = action === "CHECK_IN";

    // If no explicit action provided, default to presence calculation
    let performCheckout = doCheckout;
    if (!doCheckout && !doCheckin) {
      performCheckout = accessCode.entryCount > accessCode.exitCount;
    }

    if (performCheckout) {
      // process checkout
      if (accessCode.usageLimit && accessCode.exitCount >= accessCode.usageLimit) {
        return NextResponse.json({ error: "Code exit usage limit has been reached" }, { status: 409 });
      }
      await prisma.accessCode.updateMany({ where: { code }, data: { exitCount: { increment: 1 } } });
      const newExitCount = accessCode.exitCount + 1;
      if (accessCode.usageLimit && accessCode.entryCount >= accessCode.usageLimit && newExitCount >= accessCode.usageLimit) {
        await prisma.accessCode.updateMany({ where: { code }, data: { status: CodeStatus.USED, usedAt: new Date() } });
      }
      await prisma.codeScanLog.create({ data: { status: "SUCCESS", message: "Checked out", guardId, codeId: accessCode.id } });
      if (accessCode.createdById) {
        await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used to check out at the gate.` } });
      }
      return NextResponse.json({ message: "Code verified and guest checked out!" });
    }

    // otherwise process check-in
    if (accessCode.usageLimit && accessCode.entryCount >= accessCode.usageLimit) {
      return NextResponse.json({ error: "Code entry usage limit has been reached" }, { status: 409 });
    }
    await prisma.accessCode.updateMany({ where: { code }, data: { entryCount: { increment: 1 } } });
    const newEntryCount2 = accessCode.entryCount + 1;
    if (accessCode.usageLimit && newEntryCount2 >= accessCode.usageLimit && accessCode.exitCount >= accessCode.usageLimit) {
      await prisma.accessCode.updateMany({ where: { code }, data: { status: CodeStatus.USED, usedAt: new Date() } });
    }
    await prisma.codeScanLog.create({ data: { status: "SUCCESS", message: "Checked in", guardId, codeId: accessCode.id } });
    if (accessCode.createdById) {
      await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used at the gate.` } });
    }
    return NextResponse.json({ message: "Code verified and guest checked in!" });
  }

  return NextResponse.json({ error: "Unhandled code type" }, { status: 400 });
}
