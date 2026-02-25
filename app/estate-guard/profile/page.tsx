"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/estate-guard/get-user");
        const data = await res.json();

        if (res.ok) {
          console.log("User data fetched successfully:", data);
          setUser(data);
          setFullName(data.fullName);
          setEmail(data.email);
          setPhone(data.phone || "");
          setProfileImage(data.profileImage || "/avatar-placeholder.svg");
        } else {
          console.error("Failed to fetch user data:", data);
          router.push("/estate-guard/dashboard");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/estate-guard/dashboard");
      }
    };

    fetchUser();
  }, [router]);

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

    try {
      const res = await fetch("/api/estate-guard/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, profileImage }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Profile updated successfully!");
      } else {
        console.error("Profile update failed", data.error);
      }
    } catch (error) {
      console.error("Error updating profile", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex md:items-center justify-center pt-14 bg-gray-50">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white">
        <h1 className="text-2xl font-bold text-emerald-700 mb-6 text-center">Update Profile</h1>
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-40 h-40 group">
              <Image
                src={profileImage}
                alt="Profile Image"
                width={160}
                height={160}
                className="w-40 h-40 rounded-full border-4 border-gray-300 object-cover shadow-md"
              />
              <label
                htmlFor="file-upload"
                className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-gray-900 transition flex items-center justify-center"
                title="Edit profile picture"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
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
                className="absolute inset-0 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <span className="text-white text-sm">Click to edit</span>
              </div>
            </div>
          </div>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm hover:shadow-md transition"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm hover:shadow-md transition"
            required
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm hover:shadow-md transition"
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white font-bold py-2 rounded-lg shadow hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 transition"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}