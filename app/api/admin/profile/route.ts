import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// GET and PATCH /api/admin/profile
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!session || !user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, fullName: true, email: true, phone: true, profileImage: true } });
  if (!profile) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!session || !user || !user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Accept FormData for image upload
  const contentType = req.headers.get("content-type") || "";
  let fullName = "";
  let phone = "";
  let profileImageUrl = undefined;
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    fullName = form.get("fullName")?.toString() || "";
    phone = form.get("phone")?.toString() || "";
    const profileImageFile = form.get("profileImage");
    if (profileImageFile && typeof profileImageFile !== "string") {
      const { uploadImage } = await import("@/lib/cloudinary");
      profileImageUrl = await uploadImage(profileImageFile);
    }
  } else {
    const body = await req.json();
    fullName = body.fullName;
    phone = body.phone;
    profileImageUrl = body.profileImage;
  }
  if (!fullName || !phone) {
    return NextResponse.json({ error: "Full name and phone are required" }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { fullName, phone, profileImage: profileImageUrl },
    select: { id: true, fullName: true, email: true, phone: true, profileImage: true }
  });
  return NextResponse.json({ profile: updated });
}
