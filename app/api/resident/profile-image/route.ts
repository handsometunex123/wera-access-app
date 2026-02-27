import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/getServerSession";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("profileImage");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    // uploadImage expects a File-like object (works with web File in Next's request.formData)
    const url = await uploadImage(file as File);
    // update user profileImage
    await prisma.user.update({ where: { id: userId }, data: { profileImage: url } });
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 });
  }
}
