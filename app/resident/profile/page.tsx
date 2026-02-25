"use client";
import React, { useEffect, useState, useRef } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

interface Dependant {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  estateUniqueId: string;
}

interface ResidentProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  role: string;
  estateUniqueId: string;
  dependants?: Dependant[];
}

export default function ResidentProfilePage() {
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<{ phone: string; address: string; profileImage: string | File }>({ phone: "", address: "", profileImage: "" });
  const [initialForm, setInitialForm] = useState<{ phone: string; address: string; profileImage: string }>({ phone: "", address: "", profileImage: "" });
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/resident/profile");
      const data = await res.json();
      setProfile(data.profile);
      const loaded = {
        phone: data.profile.phone || "",
        address: data.profile.address || "",
        profileImage: data.profile.profileImage || "",
      };
      setForm(loaded);
      setInitialForm(loaded);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Simulate pending update request (should be fetched from API in real app)
  // setPending(true) if a request is pending

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, profileImage: file }));
      const reader = new FileReader();
      reader.onload = ev => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleEdit() {
    setEdit(true);
    setSuccess("");
  }

  function handleCancel() {
    setEdit(false);
    setSuccess("");
    if (profile) {
      setForm({
        phone: profile.phone || "",
        address: profile.address || "",
        profileImage: profile.profileImage || "",
      });
      setPhotoPreview(undefined);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setSuccess("");
    setError("");
    try {
      const formData = new FormData();
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      if (fileInputRef.current?.files?.[0]) {
        formData.append("profileImage", fileInputRef.current.files[0]);
      }
      // Send to profile update request endpoint
      const res = await fetch("/api/resident/profile-update-request", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit update request");
      setSuccess("Profile update request sent for admin approval.");
      setEdit(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit update request");
    }
    setPending(false);
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-800">{error}</div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-100 via-white to-emerald-50 py-10 px-2">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 relative border border-emerald-100">
        {/* Back Button */}
        <div className="absolute left-6 top-6">
          <Link href="/resident/dashboard" className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold text-sm px-3 py-1 rounded-lg border border-emerald-100 bg-white shadow-sm transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
        </div>
        {/* Simple Profile Header */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <div className="flex items-center gap-2 mb-1 mt-2">
            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2" fill="#fff" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2"/>
            </svg>
            <span className="text-emerald-800 font-semibold text-base">Profile verified</span>
          </div>
          <div className="text-gray-500 text-xs mt-1">Changes to your profile require admin approval.</div>
        </div>
        {/* Profile Image */}
        <div className="flex flex-col items-center gap-3 mb-8 mt-10">
          <div className="relative group">
            <Image
              src={photoPreview || profile.profileImage || "/avatar-placeholder.svg"}
              alt="Profile"
              width={128}
              height={128}
              className="h-32 w-32 rounded-full object-cover border-4 border-emerald-300 shadow-xl bg-gray-100 transition-transform group-hover:scale-105"
            />
            {edit && (
              <button
                type="button"
                className="absolute bottom-2 right-2 bg-white/90 rounded-full p-2 shadow group-hover:bg-emerald-100 border border-emerald-400 hover:scale-110 transition"
                onClick={() => fileInputRef.current?.click()}
                title="Change photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25V19.5a2.25 2.25 0 01-2.25 2.25h-10.5A2.25 2.25 0 014.5 19.5v-10.5A2.25 2.25 0 016.75 6.75h5.25" />
                </svg>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </button>
            )}
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 tracking-tight drop-shadow-sm">{profile.fullName}</div>
          <div className="text-xs text-gray-400 font-mono">{profile.estateUniqueId}</div>
        </div>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="mb-2 text-base text-gray-700 flex items-center gap-2">
            <span className="font-semibold">Email:</span>
            <span className="text-gray-800">{profile.email}</span>
          </div>
          <div className="mb-2 text-base text-gray-700 flex items-center gap-2">
            <span className="font-semibold">Phone:</span>
            {edit ? (
              <input
                type="tel"
                className="border border-emerald-200 rounded-lg px-4 py-2 w-full text-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
                disabled={pending}
              />
            ) : (
              <span className="text-gray-800">{profile.phone}</span>
            )}
          </div>
          <div className="mb-2 text-base text-gray-700 flex items-center gap-2">
            <span className="font-semibold">Address:</span>
            {edit ? (
              <input
                type="text"
                className="border border-emerald-200 rounded-lg px-4 py-2 w-full text-gray-900 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                required
                disabled={pending}
              />
            ) : (
              <span className="text-gray-800">{profile.address}</span>
            )}
          </div>
          <div className="mb-2 text-base text-gray-700"><span className="font-semibold">Role:</span> {profile.role === "MAIN_RESIDENT" ? "Main Resident" : profile.role === "DEPENDANT" ? "Dependant" : profile.role}</div>
          {profile.role === "MAIN_RESIDENT" && profile.dependants && profile.dependants.length > 0 && (
            <div className="mb-4">
              <div className="font-semibold text-emerald-800 mb-1 flex items-center justify-between">
                <span>Dependants</span>
                <Link href="/resident/dependants" className="text-xs text-emerald-700 underline font-semibold hover:text-emerald-900 transition">Manage Dependants</Link>
              </div>
              <ul className="divide-y divide-emerald-100 rounded-xl border border-emerald-100 bg-emerald-50/40">
                {profile.dependants.map(dep => (
                  <li key={dep.id} className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-100/60 transition rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{dep.fullName}</div>
                      <div className="text-xs text-gray-500">{dep.estateUniqueId}</div>
                    </div>
                    <div className="text-xs text-gray-400">{dep.email}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {success && <div className="text-green-700 text-center font-semibold mt-2">{success}</div>}
          {error && <div className="text-red-700 text-center font-semibold mt-2">{error}</div>}
          <div className="flex flex-col gap-2 mt-8">
            {edit ? (
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={
                    `bg-emerald-600 text-white font-bold py-2 rounded-xl shadow transition flex-1 ` +
                    ((pending || (form.phone === initialForm.phone && form.address === initialForm.address && (typeof form.profileImage === "string" ? form.profileImage === initialForm.profileImage : false) && !photoPreview))
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-emerald-700")
                  }
                  disabled={
                    pending ||
                    (
                      form.phone === initialForm.phone &&
                      form.address === initialForm.address &&
                      (typeof form.profileImage === "string" ? form.profileImage === initialForm.profileImage : false) &&
                      !photoPreview
                    )
                  }
                >
                  {pending ? "Submitting..." : "Submit Update Request"}
                </button>
                <button type="button" className="bg-gray-100 text-gray-800 font-bold py-2 rounded-xl shadow hover:bg-gray-200 transition flex-1" onClick={handleCancel} disabled={pending}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow transition" onClick={handleEdit} disabled={pending}>Edit Profile</button>
            )}
            <button
              type="button"
              className="bg-gray-100 text-gray-800 font-bold py-2 rounded-xl shadow hover:bg-gray-200 transition"
              onClick={() => signOut({ callbackUrl: "/auth" })}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

