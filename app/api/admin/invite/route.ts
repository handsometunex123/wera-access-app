import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { addHours } from "date-fns";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, role } = await request.json();
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
    }


    // Check if user already exists
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    // Check if a pending invite already exists for this email
    const pendingInvite = await prisma.invite.findFirst({
      where: {
        email,
        status: "PENDING",
      },
    });
    if (pendingInvite) {
      return NextResponse.json({ error: "A pending invite already exists for this email." }, { status: 409 });
    }

    const invite = await prisma.invite.create({
      data: {
        email,
        role,
        status: "PENDING",
        expiresAt: addHours(new Date(), 48),
      },
    });


    // Send email with invite link (invite.id) and role-specific instructions
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/onboard?invite=${invite.id}`;
    let subject = "You're invited to Westend Estate Access App";
    let html = "";
    if (role === "ESTATE_GUARD") {
      subject = "You're invited to join Westend Estate as an Estate Guard";
      html = `<p>Hello,</p><p>You have been invited to join the Westend Estate Access App as an <b>Estate Guard</b>. Please click the link below to onboard. This link will expire in 48 hours.</p><p><a href="${inviteLink}">${inviteLink}</a></p>`;
    } else {
      subject = "You're invited to join Westend Estate as a Resident";
      html = `<p>Hello,</p><p>You have been invited to join the Westend Estate Access App as a <b>Resident</b>. Please click the link below to onboard. This link will expire in 48 hours.</p><p><a href="${inviteLink}">${inviteLink}</a></p>`;
    }

    // Configure transporter (use environment variables for real SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || "", // set in .env
        pass: process.env.SMTP_PASS || "", // set in .env
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@wera-access.com',
      to: email,
      subject,
      html
    });

    return NextResponse.json({ success: true, inviteId: invite.id, expiresAt: invite.expiresAt });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
