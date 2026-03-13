import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomInt } from "crypto";
import QRCode from "qrcode";

// POST: Generate admin access code
export async function POST(request: Request) {
	try {
		const { createdById, purpose, guestName, validityMinutes, usageType, itemDetails, itemImageUrl } = await request.json();
		// usageLimit from the request is ignored; admin codes are always single-use.
		if (!createdById || !purpose || !validityMinutes || !usageType) {
			return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
		}

		// Generate 6-digit code
		const code = String(randomInt(0, 1000000)).padStart(6, "0");
		const now = new Date();
		const inviteEnd = new Date(now.getTime() + validityMinutes * 60000);

		// Check if createdById exists
		const user = await prisma.user.findUnique({ where: { id: createdById } });
		if (!user) {
			return NextResponse.json({ error: "createdById does not match any user." }, { status: 400 });
		}

		// Generate QR code as data URL
		const qrCodeUrl = await QRCode.toDataURL(code);

		const accessCode = await prisma.accessCode.create({
			data: {
				code,
				createdById,
				type: "ADMIN", // Mark as admin code
				inviteStart: now,
				inviteEnd,
				// Admin codes are always single-use
				usageLimit: 1,
				usageCount: 0,
				entryCount: 0,
				exitCount: 0,
				usageType,
				status: "ACTIVE",
				adminApprovalStatus: "APPROVED",
				qrCodeUrl,
				purpose,
				itemDetails: itemDetails || null,
				itemImageUrl: itemImageUrl || null,
			},
		});

		// Optionally: log purpose/guestName in audit or metadata
		await prisma.auditLog.create({
			data: {
				userId: createdById,
				action: "GENERATE_ADMIN_CODE",
				metadata: JSON.stringify({ purpose, guestName, code }),
			},
		});

		return NextResponse.json({ success: true, accessCode });
	} catch (err) {
		// Log the error for debugging
		console.error("/api/admin/generate-code error:", err);
		return NextResponse.json({ error: "Server error.", details: String(err) }, { status: 500 });
	}
}
