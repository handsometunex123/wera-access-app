import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";
import { getServerSession } from "@/lib/getServerSession";
import { sendEmail } from "@/lib/email";
import { notifyAdmins } from "@/lib/adminNotifications";
import { supabaseClient } from "@/lib/supabaseClient";

// POST: Generate admin access code by main resident
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "MAIN_RESIDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { purpose, guestName, validityMinutes, usageType, itemDetails, itemImageUrl } = await req.json();
    const self = await prisma.user.findUnique({ where: { id: user.id } });
    if (!self) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!self.canGenerateAdminCode) {
      return NextResponse.json(
        {
          error: "Admin code generation has been disabled for your account.",
          reason: self.adminCodeDisabledReason || null,
        },
        { status: 403 }
      );
    }
    if (!purpose || !validityMinutes) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Allow resident-generated admin codes to be single-use with a configurable usageType.
    // Default to ENTRY_ONLY if an unsupported or missing usageType is provided.
    const effectiveUsageType = usageType === "ENTRY_AND_EXIT" ? "ENTRY_AND_EXIT" : "ENTRY_ONLY";
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
    // For resident-generated admin codes, enforce single-use behavior (one scan only)
    const limitedUsageLimit = 1;

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
			usageType: effectiveUsageType,
        status: "ACTIVE",
        qrCodeUrl,
        purpose,
        itemDetails: itemDetails || null,
        itemImageUrl: itemImageUrl || null,
        adminApprovalStatus: "PENDING",
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "GENERATE_ADMIN_CODE",
        metadata: JSON.stringify({ purpose, guestName, code }),
      },
    });

    // Notify admins by email about the new approval request
    try {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true, fullName: true } });
      const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_BASE_URL || "http://localhost:3000";
      const reviewLink = `${baseUrl}/admin/admin-code-approvals/${accessCode.id}`;
      const approveLink = `${baseUrl}/admin/admin-code-approvals/${accessCode.id}?intent=approve`;
      const rejectLink = `${baseUrl}/admin/admin-code-approvals/${accessCode.id}?intent=reject`;
      const textBody = [
        `New admin code approval request from ${self.fullName} (${self.email}).`,
        `Purpose: ${purpose}`,
        guestName ? `Guest/Luggage: ${guestName}` : "",
        itemDetails ? `Item details: ${itemDetails}` : "",
        "",
        `Code: ${accessCode.code}`,
        `Valid from: ${accessCode.inviteStart.toISOString()}`,
        `Valid to: ${accessCode.inviteEnd.toISOString()}`,
        "",
        `Review in app: ${reviewLink}`,
        `Approve: ${approveLink}`,
        `Reject: ${rejectLink}`,
      ]
        .filter(Boolean)
        .join("\n");

      await Promise.all(
        admins
          .filter(a => !!a.email)
          .map(a =>
            sendEmail({
              to: a.email!,
              subject: "New admin code approval request",
              text: textBody,
            })
          )
      );
    } catch (err) {
      console.error("Failed to send admin code approval emails", err);
    }

    // Also create in-app notifications for admins so a toast can surface new requests
    try {
      const message = `New admin code approval request from ${self.fullName} (${self.email}) for purpose: ${purpose}.`;
      await notifyAdmins(message);

      if (supabaseClient) {
        void supabaseClient
          .channel("admin-notifications")
          .send({ type: "broadcast", event: "admin_code_request", payload: { message } });
      }
    } catch (err) {
      console.error("Failed to create admin notifications for admin code request", err);
    }
    return NextResponse.json({ success: true, accessCode });
  } catch (err) {
    console.error("/api/resident/generate-admin-code error:", err);
    return NextResponse.json({ error: "Server error.", details: String(err) }, { status: 500 });
  }
}
