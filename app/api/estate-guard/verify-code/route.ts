import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";
import { UsageType, CodeStatus, AccessMethod, AdminApprovalStatus } from "@prisma/client";
import { supabaseClient } from "@/lib/supabaseClient";

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

  // Enforce single-use codes: once marked USED, they can no longer be used
  if (accessCode.status === CodeStatus.USED) {
    return NextResponse.json({ error: "This code has already been used." }, { status: 409 });
  }

  // For admin codes, enforce approval workflow (but still apply usage rules below)
  if (accessCode.type === "ADMIN") {
    if (accessCode.adminApprovalStatus === AdminApprovalStatus.PENDING) {
      return NextResponse.json(
        { error: "This admin code is still pending approval by an administrator." },
        { status: 409 }
      );
    }
    if (accessCode.adminApprovalStatus === AdminApprovalStatus.REJECTED) {
      return NextResponse.json(
        {
          error: "This admin code has been rejected by an administrator.",
          reason: accessCode.adminRejectionReason || null,
        },
        { status: 409 }
      );
    }
    // If approved, fall through to the normal usage logic below so
    // the code is consumed (usage counts, status USED, etc.).
  }

  // For ENTRY_ONLY: treat as single-use and mark as USED on first successful verification
  if (accessCode.usageType === UsageType.ENTRY_ONLY) {
    // Reject if it has ever been used already (defensive; status check above should catch most cases)
    if (accessCode.entryCount > 0) {
      return NextResponse.json({ error: "This code has already been used." }, { status: 409 });
    }

    // increment entryCount and immediately mark as USED
    await prisma.accessCode.updateMany({
      where: { code },
      data: {
        entryCount: { increment: 1 },
        status: CodeStatus.USED,
        usedAt: new Date(),
      },
    });
    const log = await prisma.codeScanLog.create({
      data: {
        status: "SUCCESS",
        message: "Checked in",
        guardId,
        codeId: accessCode.id,
        accessMethod: AccessMethod.ACCESS_CODE,
        residentId: accessCode.createdById,
      },
    });
    if (accessCode.createdById) {
      await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used at the gate.` } });
    }

    const withOwner = await prisma.accessCode.findUnique({
      where: { id: accessCode.id },
      include: { createdBy: true },
    });

    if (supabaseClient && withOwner) {
      const activityPayload = {
        id: log.id,
        residentName: withOwner.createdBy.fullName,
        accessMethod: AccessMethod.ACCESS_CODE,
        accessLabel: "Gate",
        verb: "checked in",
        createdAt: log.createdAt.toISOString(),
      };
      void supabaseClient
        .channel("scan-logs")
        .send({ type: "broadcast", event: "scan_created", payload: activityPayload });
    }

    return NextResponse.json({
      message: "Code verified and guest checked in!",
      isAdminCode: withOwner?.type === "ADMIN",
      codeDetails: withOwner
        ? {
            code: withOwner.code,
            type: withOwner.type,
            qrCodeUrl: withOwner.qrCodeUrl,
            purpose: withOwner.purpose,
            itemDetails: withOwner.itemDetails,
            itemImageUrl: withOwner.itemImageUrl,
            residentName: withOwner.createdBy.fullName,
            residentAddress: withOwner.createdBy.address,
          }
        : null,
    });
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
      if (accessCode.exitCount > 0) {
        return NextResponse.json({ error: "This code has already been used to check out." }, { status: 409 });
      }

      await prisma.accessCode.updateMany({
        where: { code },
        data: {
          exitCount: { increment: 1 },
          status: CodeStatus.USED,
          usedAt: new Date(),
        },
      });
      const log = await prisma.codeScanLog.create({
        data: {
          status: "SUCCESS",
          message: "Checked out",
          guardId,
          codeId: accessCode.id,
          accessMethod: AccessMethod.ACCESS_CODE,
          residentId: accessCode.createdById,
        },
      });
      if (accessCode.createdById) {
        await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used to check out at the gate.` } });
      }

      const withOwner = await prisma.accessCode.findUnique({
        where: { id: accessCode.id },
        include: { createdBy: true },
      });

      if (supabaseClient && withOwner) {
        const activityPayload = {
          id: log.id,
          residentName: withOwner.createdBy.fullName,
          accessMethod: AccessMethod.ACCESS_CODE,
          accessLabel: "Gate",
          verb: "checked out",
          createdAt: log.createdAt.toISOString(),
        };
        void supabaseClient
          .channel("scan-logs")
          .send({ type: "broadcast", event: "scan_created", payload: activityPayload });
      }

      return NextResponse.json({
        message: "Code verified and guest checked out!",
        isAdminCode: withOwner?.type === "ADMIN",
        codeDetails: withOwner
          ? {
              code: withOwner.code,
              type: withOwner.type,
              qrCodeUrl: withOwner.qrCodeUrl,
              purpose: withOwner.purpose,
              itemDetails: withOwner.itemDetails,
              itemImageUrl: withOwner.itemImageUrl,
              residentName: withOwner.createdBy.fullName,
              residentAddress: withOwner.createdBy.address,
            }
          : null,
      });
    }

    // otherwise process check-in (allow a single check-in before checkout)
    if (accessCode.entryCount > 0) {
      return NextResponse.json({ error: "This code has already been used to check in." }, { status: 409 });
    }

    await prisma.accessCode.updateMany({
      where: { code },
      data: {
        entryCount: { increment: 1 },
      },
    });
    const log = await prisma.codeScanLog.create({
      data: {
        status: "SUCCESS",
        message: "Checked in",
        guardId,
        codeId: accessCode.id,
        accessMethod: AccessMethod.ACCESS_CODE,
        residentId: accessCode.createdById,
      },
    });
    if (accessCode.createdById) {
      await prisma.notification.create({ data: { userId: accessCode.createdById, message: `Your access code ${code} was used at the gate.` } });
    }

    const withOwner = await prisma.accessCode.findUnique({
      where: { id: accessCode.id },
      include: { createdBy: true },
    });

    if (supabaseClient && withOwner) {
      const activityPayload = {
        id: log.id,
        residentName: withOwner.createdBy.fullName,
        accessMethod: AccessMethod.ACCESS_CODE,
        accessLabel: "Gate",
        verb: "checked in",
        createdAt: log.createdAt.toISOString(),
      };
      void supabaseClient
        .channel("scan-logs")
        .send({ type: "broadcast", event: "scan_created", payload: activityPayload });
    }

    return NextResponse.json({
      message: "Code verified and guest checked in!",
      isAdminCode: withOwner?.type === "ADMIN",
      codeDetails: withOwner
        ? {
            code: withOwner.code,
            type: withOwner.type,
            qrCodeUrl: withOwner.qrCodeUrl,
            purpose: withOwner.purpose,
            itemDetails: withOwner.itemDetails,
            itemImageUrl: withOwner.itemImageUrl,
            residentName: withOwner.createdBy.fullName,
            residentAddress: withOwner.createdBy.address,
          }
        : null,
    });
  }

  return NextResponse.json({ error: "Unhandled code type" }, { status: 400 });
}
