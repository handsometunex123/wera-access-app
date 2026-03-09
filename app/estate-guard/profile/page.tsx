"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserCircleIcon } from "@heroicons/react/24/outline";

interface User {
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("/avatar-placeholder.svg");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      setInitialLoading(true);
      setError("");
      try {
        const res = await fetch("/api/estate-guard/get-user");
        const data = await res.json();

        if (res.ok) {
          setUser(data);
          setFullName(data.fullName);
          setEmail(data.email);
          setPhone(data.phone || "");
          setProfileImage(data.profileImage || "/avatar-placeholder.svg");
        } else {
          setError("Failed to load profile");
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
        setError("Failed to load profile");
      } finally {
        setInitialLoading(false);
      }
    };

    void fetchUser();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfileImage(data.url); // Assume the API returns the uploaded image URL
      } else {
        console.error("Image upload failed", data.error);
      }
    } catch (error) {
      console.error("Error uploading image", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/estate-guard/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, profileImage }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("Profile updated successfully.");
      } else {
        console.error("Profile update failed", data.error);
        setError("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile", error);
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="p-8 text-[11px] text-emerald-800">Loading profile...</div>;
  }

  if (error && !user) {
    return <div className="p-8 text-[11px] font-semibold text-red-800">{error}</div>;
  }

  if (!user) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/estate-guard/dashboard"
          className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] font-medium text-emerald-900 shadow-sm hover:bg-emerald-50"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
            &larr;
          </span>
          <span>Back to dashboard</span>
        </Link>
        <p className="hidden text-[11px] text-emerald-700 md:inline">
          Review your guard details and keep contact info current.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
              <UserCircleIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Guard profile</h1>
              <p className="text-[11px] text-emerald-700">Keep your contact details up to date.</p>
            </div>
          </div>
          <div className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-800 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Active guard</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mb-4 mt-2">
          <div className="relative group">
            <Image
              src={profileImage}
              alt="Profile Image"
              width={128}
              height={128}
              className="h-32 w-32 rounded-full object-cover border-4 border-emerald-300 shadow-xl bg-gray-100 transition-transform group-hover:scale-105"
            />
            <label
              htmlFor="file-upload"
              className="absolute bottom-2 right-2 bg-white/90 rounded-full p-2 shadow group-hover:bg-emerald-100 border border-emerald-400 hover:scale-110 transition flex items-center justify-center cursor-pointer"
              title="Edit profile picture"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5 text-emerald-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={loading}
            />
            <div
              className="absolute inset-0 bg-black bg-opacity-40 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <span className="text-white text-xs">Click to change photo</span>
            </div>
          </div>
          <div className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">{fullName}</div>
          <div className="text-[11px] text-emerald-700 font-mono">{email}</div>
        </div>

        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
          <div className="text-sm text-gray-700 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-emerald-900">Full name</span>
            <input
              type="text"
              className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[13px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-gray-700 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-emerald-900">Email</span>
            <input
              type="email"
              className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[13px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-gray-700 flex flex-col gap-1">
            <span className="text-[11px] font-medium text-emerald-900">Phone</span>
            <input
              type="tel"
              className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[13px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {success && <div className="text-green-700 text-center font-semibold mt-2 text-xs md:text-sm">{success}</div>}
          {error && <div className="text-red-700 text-center font-semibold mt-1 text-xs md:text-sm">{error}</div>}

          <div className="flex flex-col gap-2 mt-4">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}