import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email"; // Assuming there is an email utility
import { getServerSession } from "@/lib/getServerSession";
import { notifyAdmins } from "@/lib/adminNotifications";

// POST /api/admin/pending-users/[id]/reject
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { rejectionReason } = await req.json();

  if (!rejectionReason) {
    return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
  }

  try {
    const session = await getServerSession();
    // if (!session || (session.user as any)?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    if (!session || !session.user || typeof (session.user as { role?: string }).role !== "string" || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

    // Update the user's status and persist the rejection reason
    const user = await prisma.user.update({
      where: { id },
      data: { status: "REVOKED", rejectionReason },
    });

    // If the user is a main resident, block their dependants
    if (user.role === "MAIN_RESIDENT") {
      await prisma.user.updateMany({
        where: { mainResidentId: id },
        data: { status: "BLOCKED" },
      });
    }

    // Send an email to the user with the rejection reason
    await sendEmail({
      to: user.email,
      subject: "Your Registration Has Been Rejected",
      text: `Dear ${user.fullName}, We regret to inform you that your registration has been rejected for the following reason:

      ${rejectionReason}

      If you have any questions, please contact us.

      Best regards,
      The Team`,
    });

    // Notify admins
    // await notifyAdmins(`${session.user?.fullName || session.user?.email} rejected user ${user.email}: ${rejectionReason}`);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error rejecting user:", error);
    return NextResponse.json({ error: "Failed to reject user" }, { status: 400 });
  }
}
