export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "wera-access-app/profile-images",
    transformation: [
      { width: 600, height: 600, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" }
    ]
  });
  return uploadResult.secure_url;
}
