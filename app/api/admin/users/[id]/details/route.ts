import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

// GET /api/admin/users/[id]/details
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> } | { params: { id: string } },
) {
  // Unwrap params if it's a Promise (Next.js 14+ dynamic API route behavior)
  const { id } = "then" in context.params ? await context.params : context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing user id" }, { status: 400 });
  }

  const session = await getServerSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  if (!session || userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        mainResident: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            status: true,
          },
        },
        dependants: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const safeUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      estateUniqueId: user.estateUniqueId,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      address: user.address,
      relationship: user.relationship,
      createdAt: user.createdAt,
      mainResident: user.mainResident,
      dependants: user.dependants,
    };

    // Build household user ids (main + dependants) to inspect access activity
    const householdIds = new Set<string>();
    householdIds.add(user.id);

    if (user.role === "MAIN_RESIDENT") {
      user.dependants.forEach((d) => householdIds.add(d.id));
    } else if (user.role === "DEPENDANT" && user.mainResidentId) {
      householdIds.add(user.mainResidentId);
      const main = await prisma.user.findUnique({
        where: { id: user.mainResidentId },
        include: { dependants: { select: { id: true } } },
      });
      if (main) {
        main.dependants.forEach((d) => householdIds.add(d.id));
      }
    }

    const householdIdArray = Array.from(householdIds);

    const logs = await prisma.codeScanLog.findMany({
      where: {
        code: {
          createdById: { in: householdIdArray },
        },
      },
      include: {
        code: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        resident: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const accessCards: {
      id: string;
      code: string;
      status: string;
      usageType: string;
      lastUsedAt: string;
      lastUsedBy?: { id: string; fullName: string | null };
    }[] = [];

    const fingerprintLogs = logs.filter((l) => l.accessMethod === "FINGERPRINT");
    const fingerprintSummary = {
      hasActivity: fingerprintLogs.length > 0,
      lastUsedAt: fingerprintLogs[0]?.createdAt?.toISOString() ?? null,
      totalScans: fingerprintLogs.length,
    };

    const activity = logs.map((log) => {
      const method = log.accessMethod || "ACCESS_CODE";
      let accessLabel = "Access Code";
      if (method === "ACCESS_CARD") accessLabel = "Access Card";
      if (method === "FINGERPRINT") accessLabel = "Fingerprint";

      const msg = (log.message || "").toLowerCase();
      const isCheckout = msg.includes("checked out") || msg.includes("checked-out") || msg.includes("checked_out");
      const verb = isCheckout ? "checked out" : "checked in";

      const residentName =
        log.code?.createdBy?.fullName ||
        log.resident?.fullName ||
        safeUser.fullName;

      return {
        id: log.id,
        residentName,
        accessMethod: method,
        accessLabel,
        verb,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      user: safeUser,
      accessCards,
      fingerprintSummary,
      activity,
    });
  } catch (err) {
    console.error("/api/admin/users/[id]/details error", err);
    return NextResponse.json({ error: "Failed to load user details" }, { status: 500 });
  }
}
