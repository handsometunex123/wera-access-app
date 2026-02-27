import { deleteImage } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const url = await uploadImage(file);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return NextResponse.json({ error: "No publicId provided" }, { status: 400 });
    }
    await deleteImage(publicId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
