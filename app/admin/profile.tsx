"use client";
import React, { useState, useEffect, useRef } from "react";
import { useNotify } from "../../components/useNotify";
import Image from "next/image";



export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: "", phone: "", profileImage: "" });
  const [initialForm, setInitialForm] = useState({ fullName: "", phone: "", profileImage: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        const loaded = {
          fullName: data.profile.fullName || "",
          phone: data.profile.phone || "",
          profileImage: data.profile.profileImage || ""
        };
        setForm(loaded);
        setInitialForm(loaded);
      })
      .catch(() => notify("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, [notify]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    //
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) notify(data.error || "Failed to update profile", "error");
      else {
        notify("Profile updated successfully", "success");
        // setProfile(data.profile); // removed unused
      }
    } catch {
      notify("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  
  if (loading) return <div className="p-8">Loading...</div>;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Use Cloudinary config from NEXT_PUBLIC_ env (injected at build time)
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || '';
      if (!cloudName || !uploadPreset) {
        notify(
          "Cloudinary config missing. Please set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in your .env.local and restart the dev server.",
          "error"
        );
        setUploading(false);
        return;
      }
      formData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");
      setForm(f => ({ ...f, profileImage: data.secure_url }));
    } catch {
      notify("Image upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  // Check if form is dirty (changed from initial)
  const isDirty =
    form.fullName !== initialForm.fullName ||
    form.phone !== initialForm.phone ||
    form.profileImage !== initialForm.profileImage;

  return (
    <div className="bg-white p-8">
      <div className="max-w-lg mx-auto bg-white rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Admin Profile</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Full Name</label>
            <input className="border rounded px-3 py-2 w-full text-gray-900" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Phone</label>
            <input className="border rounded px-3 py-2 w-full text-gray-900" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Profile Image</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group flex flex-col items-center justify-center">
                <div
                  className={`h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 transition-all duration-200 ${uploading ? 'opacity-60' : 'hover:border-emerald-700 cursor-pointer'}`}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload profile image"
                  style={{ outline: 'none' }}
                >
                  {uploading ? (
                    <svg className="animate-spin h-8 w-8 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  ) : form.profileImage ? (
                    <Image src={form.profileImage} alt="Profile preview" className="h-20 w-20 rounded-full object-cover" width={80} height={80} />
                  ) : (
                    <svg className="h-8 w-8 text-gray-400 group-hover:text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    disabled={uploading}
                  />
                  {form.profileImage && !uploading && (
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-50"
                      onClick={e => {
                        e.stopPropagation();
                        setForm(f => ({ ...f, profileImage: "" }));
                      }}
                      aria-label="Remove image"
                    >
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  {/* Success checkmark removed; use toast for feedback */}
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs text-emerald-700 font-semibold hover:underline focus:underline"
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {form.profileImage ? "Change Image" : "Upload Image"}
                </button>
              </div>
              <div className="flex-1">
                {/* Upload errors now use toast notifications */}
                <div className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 2MB.</div>
              </div>
            </div>
          </div>
          <button type="submit" className="bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-900 transition" disabled={loading || uploading || !isDirty}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
          {/* All errors and success now use toast notifications */}
        </form>
      </div>
    </div>
  );
}
