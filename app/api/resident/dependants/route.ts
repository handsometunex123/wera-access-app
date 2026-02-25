
// GET: List dependants for main resident
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mainResidentId = user.id;
  const dependants = await prisma.user.findMany({
    where: { mainResidentId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      relationship: true,
      profileImage: true,
      canManageCodes: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ dependants });
}
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";


// POST: Add dependant
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mainResidentId = user.id;
  const form = await request.formData();
  const fullName = form.get("fullName") as string;
  const email = form.get("email") as string;
  const phone = form.get("phone") as string;
  const relationship = form.get("relationship") as string;
  // Handle photo upload if present
  let profileImageUrl = "";
  const photo = form.get("photo");
  if (photo && typeof photo === "object" && "arrayBuffer" in photo) {
    try {
      profileImageUrl = await uploadImage(photo as File);
    } catch (err) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
  }
  if (!fullName || !email || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  // Check if email already exists
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  // Create dependant (status PENDING, role DEPENDANT)
  const dependant = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      address: "", // Will be set to main resident's address after approval
      role: "DEPENDANT",
      status: "PENDING",
      mainResident: { connect: { id: mainResidentId } },
      password: "", // Set after approval/onboarding
      estateUniqueId: "", // Set after approval
      profileImage: profileImageUrl,
      relationship
    },
  });
  return NextResponse.json({ success: true, dependant });
}

// DELETE: Remove dependant
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mainResidentId = user.id;
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing dependant id" }, { status: 400 });
  // Only allow removing dependants belonging to this main resident
  const dep = await prisma.user.findUnique({ where: { id } });
  if (!dep || dep.mainResidentId !== mainResidentId) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
