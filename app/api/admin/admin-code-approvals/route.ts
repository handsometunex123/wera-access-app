import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminApprovalStatus, Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email";

// GET /api/admin/admin-code-approvals?status=PENDING&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = (searchParams.get("status") || "PENDING").toUpperCase() as keyof typeof AdminApprovalStatus;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;
  const search = searchParams.get("search")?.trim() || "";

  const approvalStatus = AdminApprovalStatus[statusParam] ?? AdminApprovalStatus.PENDING;

  const where: Prisma.AccessCodeWhereInput = {
    type: "ADMIN",
    adminApprovalStatus: approvalStatus,
    createdBy: {
      is: {
        role: {
          not: "ADMIN",
        },
      },
    },
  };

  if (search) {
    where.OR = [
      { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { purpose: { contains: search, mode: Prisma.QueryMode.insensitive } },
      {
        createdBy: {
          fullName: { contains: search, mode: Prisma.QueryMode.insensitive },
        },
      },
    ];
  }

  const [total, codes] = await Promise.all([
    prisma.accessCode.count({ where }),
    prisma.accessCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            address: true
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    codes,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

// PATCH /api/admin/admin-code-approvals
// Body: { codeId: string; action: "approve" | "reject"; rejectionReason?: string }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { codeId, action, rejectionReason } = await req.json();
  if (!codeId || !action) {
    return NextResponse.json({ error: "Missing codeId or action" }, { status: 400 });
  }

  const accessCode = await prisma.accessCode.findUnique({
    where: { id: codeId },
    include: { createdBy: true },
  });

  if (!accessCode || accessCode.type !== "ADMIN") {
    return NextResponse.json({ error: "Admin code not found" }, { status: 404 });
  }

  if (accessCode.createdBy?.role === "ADMIN") {
    return NextResponse.json({ error: "Admin-generated code does not require admin approval" }, { status: 400 });
  }

  if (accessCode.adminApprovalStatus !== AdminApprovalStatus.PENDING) {
    return NextResponse.json({ error: "This admin code has already been processed" }, { status: 409 });
  }

  let newStatus: AdminApprovalStatus;
  let rejection: string | null = null;

  if (action === "approve") {
    newStatus = AdminApprovalStatus.APPROVED;
  } else if (action === "reject") {
    newStatus = AdminApprovalStatus.REJECTED;
    rejection = (rejectionReason || "").trim() || null;
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await prisma.accessCode.update({
    where: { id: codeId },
    data: {
      adminApprovalStatus: newStatus,
      adminApprovalById: user.id,
      adminApprovalAt: new Date(),
      adminRejectionReason: rejection,
    },
    include: { createdBy: true },
  });

  // Notify the resident about the decision
  try {
    const residentId = updated.createdById;
    if (residentId) {
      const baseMessage =
        updated.adminApprovalStatus === AdminApprovalStatus.APPROVED
          ? `Your admin access code ${updated.code} has been approved by the estate admin.`
          : `Your admin access code ${updated.code} has been rejected by the estate admin.`;
      const fullMessage =
        updated.adminApprovalStatus === AdminApprovalStatus.REJECTED && updated.adminRejectionReason
          ? `${baseMessage} Reason: ${updated.adminRejectionReason}`
          : baseMessage;
      await prisma.notification.create({
        data: {
          userId: residentId,
          message: fullMessage,
        },
      });

      if (updated.createdBy?.email) {
        const subject =
          updated.adminApprovalStatus === AdminApprovalStatus.APPROVED
            ? "Your admin code request was approved"
            : "Your admin code request was rejected";

        const text =
          updated.adminApprovalStatus === AdminApprovalStatus.APPROVED
            ? `Hi ${updated.createdBy.fullName || "Resident"},\n\nYour admin access code request (${updated.code}) has been approved and is now active for use.\n\nRegards,\nEstate Admin`
            : `Hi ${updated.createdBy.fullName || "Resident"},\n\nYour admin access code request (${updated.code}) has been rejected.${updated.adminRejectionReason ? `\nReason: ${updated.adminRejectionReason}` : ""}\n\nRegards,\nEstate Admin`;

        await sendEmail({
          to: updated.createdBy.email,
          subject,
          text,
        });
      }
    }
  } catch (err) {
    console.error("Failed to notify resident about admin code decision", err);
  }

  return NextResponse.json({ success: true, accessCode: updated });
}
