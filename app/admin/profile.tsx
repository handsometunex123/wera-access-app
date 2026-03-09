"use client";
import React, { useState, useEffect, useRef } from "react";
import { useNotify } from "../../components/useNotify";
import Image from "next/image";

type ProfileFormState = { fullName: string; phone: string; profileImage: string };

let cachedProfile: ProfileFormState | null = null;

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(!cachedProfile);
  const [form, setForm] = useState<ProfileFormState>(
    cachedProfile ?? { fullName: "", phone: "", profileImage: "" }
  );
  const [initialForm, setInitialForm] = useState<ProfileFormState>(
    cachedProfile ?? { fullName: "", phone: "", profileImage: "" }
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const notify = useNotify();

  useEffect(() => {
    if (cachedProfile) {
      setForm(cachedProfile);
      setInitialForm(cachedProfile);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const loaded: ProfileFormState = {
          fullName: data.profile.fullName || "",
          phone: data.profile.phone || "",
          profileImage: data.profile.profileImage || "",
        };
        cachedProfile = loaded;
        setForm(loaded);
        setInitialForm(loaded);
      })
      .catch(() => {
        if (cancelled) return;
        notify("Failed to load profile", "error");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
        const updated: ProfileFormState = {
          fullName: data.profile?.fullName ?? form.fullName,
          phone: data.profile?.phone ?? form.phone,
          profileImage: data.profile?.profileImage ?? form.profileImage,
        };
        cachedProfile = updated;
        setForm(updated);
        setInitialForm(updated);
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
    <form className="flex flex-col gap-3 text-[11px]" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-emerald-900">Full name</label>
        <input
          className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-emerald-900">Phone</label>
        <input
          className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-emerald-900">Profile image</label>
        <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-emerald-100 bg-white p-3">
          <div className="relative group flex flex-col items-center justify-center">
            <div
              className={`h-20 w-20 rounded-full border-2 border-dashed border-emerald-200 flex items-center justify-center bg-emerald-50/40 transition-all duration-200 ${uploading ? 'opacity-60' : 'hover:border-emerald-500 cursor-pointer'}`}
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
                <svg className="h-8 w-8 text-emerald-400 group-hover:text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                  className="absolute -top-2 -right-2 bg-white border border-rose-200 rounded-full p-1 shadow hover:bg-rose-50"
                  onClick={e => {
                    e.stopPropagation();
                    setForm(f => ({ ...f, profileImage: "" }));
                  }}
                  aria-label="Remove image"
                >
                  <svg className="h-4 w-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
              onClick={() => !uploading && fileInputRef.current?.click()}
              disabled={uploading}
            >
              {form.profileImage ? "Change image" : "Upload image"}
            </button>
          </div>
          <div className="flex-1">
            <div className="text-[10px] text-emerald-700">JPG, PNG, or GIF. Max 2MB.</div>
          </div>
        </div>
      </div>

      <div className="mt-1 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
          disabled={loading || uploading || !isDirty}
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
