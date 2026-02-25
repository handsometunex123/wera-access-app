import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import {uploadImage} from "@/lib/cloudinary";


export async function POST(req: NextRequest) {
  // Parse FormData instead of JSON
  const form = await req.formData();
  const fullName = form.get("fullName")?.toString() || "";
  const address = form.get("address")?.toString() || "";
  const password = form.get("password")?.toString() || "";
  // const confirmPassword = form.get("confirmPassword")?.toString() || ""; // Not used
  const phone = form.get("phone")?.toString() || "";
  const email = form.get("email")?.toString() || "";
  const inviteId = form.get("inviteId")?.toString() || "";
  const profileImageFile = form.get("profileImage");
  let profileImageUrl: string | undefined = undefined;
  if (profileImageFile && typeof profileImageFile !== "string") {
    // Upload to Cloudinary
    profileImageUrl = await uploadImage(profileImageFile);
  }
  // Parse dependants from FormData
  type DependantForm = {
    fullName: string;
    email: string;
    phone?: string;
    relationship: string;
    profileImage?: string;
  };
  const dependants: DependantForm[] = [];
  // Find all dependant indices
  const depIndices = Array.from(form.keys())
    .filter(k => k.startsWith("dependants[") && k.endsWith("]"))
    .map(k => k.match(/^dependants\[(\d+)\]\[(\w+)\]$/))
    .filter(Boolean) as RegExpMatchArray[];
  const depMap: Record<string, Partial<DependantForm>> = {};
  for (const match of depIndices) {
    const idx = match[1];
    const field = match[2] as keyof DependantForm;
    if (!depMap[idx]) depMap[idx] = {};
    depMap[idx][field] = form.get(match[0])?.toString() || "";
  }
  for (const idx in depMap) {
    const d = depMap[idx];
    if (d.fullName && d.email && d.relationship) {
      let depProfileImageUrl: string | undefined = undefined;
      if (d.profileImage && typeof d.profileImage !== "string") {
        try {
          console.log(`Uploading profile image for dependant: ${d.fullName}`);
          depProfileImageUrl = await uploadImage(d.profileImage);
          console.log(`Successfully uploaded profile image for dependant: ${d.fullName}`);
        } catch (error) {
          console.error(`Error uploading profile image for dependant ${d.fullName}:`, error);
        }
      } else if (typeof d.profileImage === "string") {
        console.warn(`Dependant ${d.fullName} has a profile image URL instead of a file. Skipping upload.`);
        depProfileImageUrl = d.profileImage;
      } else {
        console.warn(`No profile image provided for dependant: ${d.fullName}`);
      }
      dependants.push({
        fullName: d.fullName,
        email: d.email,
        phone: d.phone || "",
        relationship: d.relationship,
        profileImage: depProfileImageUrl || undefined,
      });
    }
  }

  // If inviteId is provided, validate invite
  if (inviteId) {
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.status !== "PENDING") {
      return NextResponse.json({ error: "Invalid or already used invite." }, { status: 400 });
    }
    if (new Date(invite.expiresAt) < new Date()) {
      await prisma.invite.update({ where: { id: inviteId }, data: { status: "EXPIRED" } });
      return NextResponse.json({ error: "Invite has expired. Please request a new invite." }, { status: 400 });
    }
  }
  // Fetch invite to determine role
  let inviteRole = undefined;
  if (inviteId) {
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
    inviteRole = invite?.role;
  }
  if (inviteRole === "ESTATE_GUARD") {
    if (!fullName || !password || !phone || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
  } else {
    if (!fullName || !address || !password || !phone || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Passcode must be at least 6 digits" }, { status: 400 });
  }
  // Check if email already exists
  const exists = await prisma.user.findFirst({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  let user;
  if (inviteRole === "ESTATE_GUARD") {
    // Save estate guard user (no address, role ESTATE_GUARD)
    const guardEstateUniqueId = `WERA/GD/${randomUUID().slice(0, 8)}`;
    user = await prisma.user.create({
      data: {
        fullName,
        address: "", // Guards don't have an address
        password: hashedPassword,
        phone,
        email,
        profileImage: profileImageUrl,
        role: "ESTATE_GUARD",
        status: "PENDING",
        estateUniqueId: guardEstateUniqueId,
      },
    });
  } else {
    // Generate unique estateUniqueId for main resident
    const mainEstateUniqueId = `WERA/MN/${randomUUID().slice(0, 8)}`;
    user = await prisma.user.create({
      data: {
        fullName,
        address,
        password: hashedPassword,
        phone,
        email,
        profileImage: profileImageUrl,
        role: "MAIN_RESIDENT",
        status: "PENDING",
        estateUniqueId: mainEstateUniqueId,
        canManageCodes: true,
      },
    });
  }

  // Only create dependants for main residents
  const dependantCredentials: Array<{ email: string; password: string }> = [];
  if (inviteRole !== "ESTATE_GUARD" && dependants && Array.isArray(dependants)) {
    for (const d of dependants) {
      if (d.fullName && d.email && d.relationship) {
        try {
          // Check if dependant email already exists
          const exists = await prisma.user.findFirst({ where: { email: d.email } });
          if (exists) {
            console.warn(`Dependant with email ${d.email} already exists. Skipping.`);
            continue; // Skip if email already registered
          }

          // Generate unique estateUniqueId and password for dependant
          const estateUniqueId = `WERA/DP/${randomUUID().slice(0, 8)}`;
          const dependantPassword = Math.random().toString().slice(2, 8); // 6-digit random password
          const hashedDepPassword = await bcrypt.hash(dependantPassword, 10);

          await prisma.user.create({
            data: {
              fullName: d.fullName,
              email: d.email,
              phone: d.phone || "",
              relationship: d.relationship,
              profileImage: d.profileImage,
              address,
              role: "DEPENDANT",
              status: "PENDING",
              mainResidentId: user.id,
              estateUniqueId,
              password: hashedDepPassword,
            },
          });

          console.log(`Dependant ${d.fullName} (${d.email}) successfully created.`);
          dependantCredentials.push({ email: d.email, password: dependantPassword });
        } catch (error) {
          console.error(`Error creating dependant ${d.fullName} (${d.email}):`, error);
        }
      }
    }
  }
  // Note: When dependants are approved by admin, send their login details (email & password) via notification/email.
  // If inviteId, mark invite as used
  if (inviteId) {
    await prisma.invite.update({ where: { id: inviteId }, data: { status: "USED", userId: user.id } });
  }
  return NextResponse.json({ success: true });
}
