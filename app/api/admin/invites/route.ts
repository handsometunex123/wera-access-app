import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

// POST: Send email reminders to all pending invites
export async function POST(request: Request) {
  const { remindAll } = await request.json();
  if (!remindAll) return NextResponse.json({ error: "Missing remindAll flag" }, { status: 400 });

  const pendingInvites = await prisma.invite.findMany({
    where: { status: "PENDING" },
    include: { user: true },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });

  let sent = 0;
  for (const invite of pendingInvites) {
    const inviteLink = `${baseUrl}/onboard?invite=${invite.id}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@wera-access.com',
      to: invite.email,
      subject: "Reminder: Complete your Westend Estate registration",
      html: `<p>Hello,</p><p>This is a reminder to complete your registration. Your invite link is below:</p><p><a href="${inviteLink}">${inviteLink}</a></p>`
    });
    sent++;
  }

  return NextResponse.json({ success: true, message: `Reminders sent to ${sent} residents.` });
}

// GET: List all invites with pagination
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
  const skip = (page - 1) * pageSize;

  const [invites, total] = await Promise.all([
    prisma.invite.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.invite.count(),
  ]);

  return NextResponse.json({ invites, total, page, pageSize });
}

// PATCH: Resend or revoke invite
export async function PATCH(request: Request) {
  const { id, action } = await request.json();
  if (!id || !action) return NextResponse.json({ error: "Missing id or action" }, { status: 400 });

  const invite = await prisma.invite.findUnique({ where: { id }, include: { user: true } });
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 });

  if (action === "revoke") {
    await prisma.invite.update({ where: { id }, data: { status: "REVOKED" } });
    return NextResponse.json({ success: true, message: "Invite revoked" });
  }

  if (action === "resend") {
    // Resend email with type-aware subject and link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    let subject = "You're invited to Westend Estate Access App (Resent)";
    let html = "";
    if (invite.role === "ESTATE_GUARD") {
      subject = "You're invited to join Westend Estate as an Estate Guard";
      html = `<p>Hello,</p><p>You have been invited to join the Westend Estate Access App as an <b>Estate Guard</b>. Please click the link below to onboard. This link will expire in 48 hours.</p><p><a href="${baseUrl}/onboard?invite=${invite.id}&type=guard">${baseUrl}/onboard?invite=${invite.id}&type=guard</a></p>`;
    } else {
      subject = "You're invited to join Westend Estate as a Resident";
      html = `<p>Hello,</p><p>You have been invited to join the Westend Estate Access App as a <b>Resident</b>. Please click the link below to onboard. This link will expire in 48 hours.</p><p><a href="${baseUrl}/onboard?invite=${invite.id}&type=resident">${baseUrl}/onboard?invite=${invite.id}&type=resident</a></p>`;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@wera-access.com',
      to: invite.email,
      subject,
      html,
    });
    return NextResponse.json({ success: true, message: "Invite resent" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
