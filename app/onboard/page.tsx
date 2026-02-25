"use client";


import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isInviteValid } from "./onboardApi";
import NextImage from "next/image";
import imageCompression from "browser-image-compression";
import { Suspense } from "react";

// Prisma Invite model type for onboarding
type MinimalUser = {
  id: string;
  email: string;
  fullName: string;
};
type Invite = {
  id: string;
  userId?: string | null;
  email: string;
  role: "ADMIN" | "MAIN_RESIDENT" | "DEPENDANT" | "ESTATE_GUARD";
  status: string;
  createdAt: string;
  expiresAt: string;
  user?: MinimalUser;
};


type Dependant = {
  fullName: string;
  email: string;
  phone: string;
  relationship: string;
  photo: File | null;
};

type FormState = {
  fullName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  profileImage: File | null;
  address: string;
};

import { useRef } from "react";
// import Image from "next/image";

export default function OnboardPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardPage />
    </Suspense>
  );
}

function OnboardPage() {
  const searchParams = useSearchParams();
  const invite = searchParams?.get("invite") || undefined;
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<Invite | null>(null);
  const [inviteError, setInviteError] = useState<string>("");
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profileImage: null,
    address: "",
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Dependants state
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [depForm, setDepForm] = useState<Dependant>({ fullName: "", email: "", phone: "", relationship: "", photo: null });
  const [formError, setFormError] = useState<string>("");
  const [addingDep, setAddingDep] = useState<boolean>(false);
  const [editingDepIdx, setEditingDepIdx] = useState<number | null>(null);
  const depFileInputRef = useRef<HTMLInputElement>(null);

  // Add state for preview and upload progress
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // const [uploadProgress, setUploadProgress] = useState<number>(0);
  // const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  // const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(null);

  // Add state for dependant image preview
  const [depPreviewUrl, setDepPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      setLoading(true);
      setInviteError("");
      setInviteData(null);
      if (!invite) {
        setInviteError("Missing invite ID.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/onboard/invite?id=${invite}`);
        if (!res.ok) throw new Error("Invite not found");
        const data = await res.json();
        const valid = isInviteValid(data.invite);
        if (!valid.valid) {
          setInviteError(valid.reason || "Invalid invite");
        } else {
          setInviteData(data.invite);
        }
      } catch (e) {
        setInviteError(e instanceof Error ? e.message : "Failed to fetch invite");
      }
      setLoading(false);
    }
    fetchInvite();
  }, [invite]);

  // Remove Upload Image button and trigger upload on image selection
  // async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
  //   setUploadError("");
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   // Restrict file type
  //   const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  //   if (!allowedTypes.includes(file.type)) {
  //     setUploadError("Invalid file type. Only JPG, PNG, GIF, or WebP allowed.");
  //     return;
  //   }
  //   // Compress image if needed
  //   let compressedFile = file;
  //   const maxSize = 2 * 1024 * 1024; // 2MB
  //   if (file.size > maxSize) {
  //     try {
  //       compressedFile = await imageCompression(file, {
  //         maxSizeMB: 2,
  //         maxWidthOrHeight: 1024,
  //         useWebWorker: true,
  //       });
  //       if (compressedFile.size > maxSize) {
  //         setUploadError("Image could not be compressed below 2MB. Please choose a smaller image.");
  //         return;
  //       }
  //     } catch (err) {
  //       setUploadError("Image compression failed. Please try another image.");
  //       return;
  //     }
  //   }
  //   setForm((f) => ({ ...f, profileImage: compressedFile }));
  //   // Show preview
  //   const reader = new FileReader();
  //   reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
  //   reader.readAsDataURL(compressedFile);
  //   // Upload immediately
  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append("file", compressedFile);
  //     if (uploadedPublicId) formData.append("publicId", uploadedPublicId);
  //     await new Promise<void>((resolve, reject) => {
  //       const xhr = new XMLHttpRequest();
  //       xhr.open("POST", "/api/upload-image");
  //       xhr.upload.onprogress = (event) => {
  //         if (event.lengthComputable) {
  //           setUploadProgress(Math.round((event.loaded / event.total) * 100));
  //         }
  //       };
  //       xhr.onload = () => {
  //         if (xhr.status === 200) {
  //           const data = JSON.parse(xhr.responseText);
  //           setUploadedUrl(data.url);
  //           setUploadedPublicId(data.publicId || null);
  //           setForm((f) => ({ ...f, profileImage: data.url }));
  //           setUploading(false);
  //           resolve();
  //         } else {
  //           setUploadError("Upload failed");
  //           setUploading(false);
  //           reject();
  //         }
  //       };
  //       xhr.onerror = () => {
  //         setUploadError("Upload failed");
  //         setUploading(false);
  //         reject();
  //       };
  //       xhr.send(formData);
  //     });
  //   } catch {
  //     setUploadError("Image upload failed. Please try again.");
  //     setUploading(false);
  //   }
  // }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f: FormState) => ({ ...f, [name]: value }));
  }

  function handleDepChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, files } = e.target as HTMLInputElement & HTMLSelectElement;
    setDepForm((f: Dependant) => ({ ...f, [name]: files ? files[0] : value }));
  }

  // Added a separate method for dependant image upload
  async function handleDepImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restrict file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      console.error("Invalid file type. Only JPG, PNG, GIF, or WebP allowed.");
      return;
    }

    // Restrict file size
    const maxSize = 2 * 1024 * 1024; // 2MB
    let compressedFile = file;
    if (file.size > maxSize) {
      try {
        compressedFile = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        if (compressedFile.size > maxSize) {
          console.error("Image could not be compressed below 2MB. Please choose a smaller image.");
          return;
        }
      } catch (err) {
        console.error("Image compression failed. Please try another image.", err);
        return;
      }
    }

    // Generate preview URL
    const reader = new FileReader();
    reader.onload = (ev) => setDepPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(compressedFile);

    // Update dependant form
    setDepForm((f) => ({ ...f, photo: compressedFile }));
  }
  function addDependant() {
    setFormError("");
    if (!depForm.fullName || !depForm.email || !depForm.relationship) {
      setFormError("Full name, email, and relationship are required.");
      return;
    }
    setDependants((deps: Dependant[]) => [...deps, depForm]);
    setDepForm({ fullName: "", email: "", phone: "", relationship: "", photo: null });
    setAddingDep(false);
  }

  function editDependant(idx: number) {
    setDepForm(dependants[idx]);
    setEditingDepIdx(idx);
    setAddingDep(true);
  }

  function saveDependant() {
    setFormError("");
    if (!depForm.fullName || !depForm.email || !depForm.relationship) {
      setFormError("Full name, email, and relationship are required.");
      return;
    }
    if (editingDepIdx === null) return;
    setDependants(deps => deps.map((d, i) => i === editingDepIdx ? depForm : d));
    setDepForm({ fullName: "", email: "", phone: "", relationship: "", photo: null });
    setEditingDepIdx(null);
    setAddingDep(false);
  }
  function removeDependant(idx: number) {
    setDependants((deps: Dependant[]) => deps.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    setSubmitError("");
    // Validation: Residents require address, guards do not
    if (inviteData?.role === "ESTATE_GUARD") {
      if (!form.fullName || !form.phone || !form.password || !form.confirmPassword) {
        setFormError("Full name, phone, password, and confirm password are required.");
        setSubmitting(false);
        return;
      }
    } else {
      if (!form.fullName || !form.phone || !form.address || !form.password || !form.confirmPassword) {
        setFormError("Full name, phone, address, password, and confirm password are required.");
        setSubmitting(false);
        return;
      }
    }
    try {
      const formData = new FormData();

      // Append main form fields
      formData.append("fullName", form.fullName);
      formData.append("phone", form.phone);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      formData.append("address", form.address);
      formData.append("email", inviteData?.email || "");
      formData.append("inviteId", invite || "");
      if (form.profileImage) {
        formData.append("profileImage", form.profileImage);
      }

      // Append dependants
      dependants.forEach((dep, index) => {
        formData.append(`dependants[${index}][fullName]`, dep.fullName);
        formData.append(`dependants[${index}][email]`, dep.email);
        formData.append(`dependants[${index}][phone]`, dep.phone);
        formData.append(`dependants[${index}][relationship]`, dep.relationship);
        if (dep.photo) {
          formData.append(`dependants[${index}][profileImage]`, dep.photo);
        }
      });

      const res = await fetch("/api/resident/onboarding", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form");
      }
      setSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  // Moved the inline file input handler logic to a separate method
  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Restrict file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Compress image if needed
    let compressedFile = file;
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      })
        .then((compressed) => {
          compressedFile = compressed;
          if (compressedFile.size > maxSize) {
            setFormError("Image could not be compressed below 2MB. Please choose a smaller image.");
            return;
          }
          setForm((f) => ({ ...f, profileImage: compressedFile }));
          const reader = new FileReader();
          reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
          reader.readAsDataURL(compressedFile);
        })
        .catch(() => {
          setFormError("Image compression failed. Please try another image.");
        });
    } else {
      setForm((f) => ({ ...f, profileImage: compressedFile }));
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(compressedFile);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-emerald-700 font-semibold animate-pulse">Loading onboarding...</div>
      </div>
    );
  }
  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full p-8 rounded-xl shadow-lg bg-white text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Onboarding Error</h1>
          <p className="mb-2 text-gray-700">{inviteError}</p>
        </div>
      </div>
    );
  }
  if (!inviteData) return null;
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full p-8 rounded-xl shadow-lg bg-white text-center">
          <h1 className="text-2xl font-bold mb-4 text-emerald-700">Registration Submitted!</h1>
          <p className="mb-4 text-gray-700">Your request is pending approval by the estate admin. You will receive an email if your registration is approved or rejected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
      <div className="max-w-lg w-full p-8 rounded-2xl shadow-xl bg-white">
        <h2 className="text-2xl font-bold text-emerald-700 mb-4 text-center">Onboarding</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block font-medium mb-1 text-gray-900">Full Name</label>
            <input name="fullName" className="border rounded px-3 py-2 w-full text-gray-900" value={form.fullName} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Phone</label>
            <input name="phone" className="border rounded px-3 py-2 w-full text-gray-900" value={form.phone} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Profile Image <span className="text-xs text-gray-500 font-normal">(optional)</span></label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group flex flex-col items-center justify-center">
                <div
                  className={`h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 transition-all duration-200 ${loading ? 'opacity-60' : 'hover:border-emerald-700 cursor-pointer'}`}
                  onClick={() => !loading && fileInputRef.current?.click()}
                  tabIndex={0}
                  role="button"
                  aria-label="Upload profile image"
                  style={{ outline: 'none' }}
                >
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    </div>
                  ) : previewUrl ? (
                    <NextImage src={previewUrl} alt="Preview" className="h-20 w-20 rounded-full object-cover" width={80} height={80} />
                  ) : (
                    <svg className="h-8 w-8 text-gray-400 group-hover:text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                    ref={fileInputRef}
                    disabled={loading}
                  />
                  {previewUrl && !loading && (
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-50"
                      onClick={async e => {
                        e.stopPropagation();
                        setPreviewUrl(null);
                        setForm(f => ({ ...f, profileImage: null }));
                      }}
                      aria-label="Remove image"
                    >
                      <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                {/* {formError && <div className="text-red-600 mb-2">{formError}</div>} */}
                <div className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 2MB.</div>
              </div>
            </div>
          </div>
          {/* guardCode field removed */}
          {inviteData.role !== "ESTATE_GUARD" && (
            <div>
              <label className="block font-medium mb-1 text-gray-900">Address</label>
              <input name="address" className="border rounded px-3 py-2 w-full text-gray-900" value={form.address} onChange={handleChange} required />
            </div>
          )}
          <div>
            <label className="block font-medium mb-1 text-gray-900">Password</label>
            <input name="password" type="password" className="border rounded px-3 py-2 w-full text-gray-900" value={form.password} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium mb-1 text-gray-900">Confirm Password</label>
            <input name="confirmPassword" type="password" className="border rounded px-3 py-2 w-full text-gray-900" value={form.confirmPassword} onChange={handleChange} required />
          </div>
          {inviteData.role === "MAIN_RESIDENT" && (
            <div>
              <h3 className="font-semibold text-emerald-700 mb-2">Add Dependants (Optional)</h3>
              {dependants.length > 0 && (
                <ul className="mb-2">
                  {dependants.map((dep, idx) => (
                    <li key={idx} className="flex items-center justify-between bg-emerald-50 rounded px-3 py-2 mb-2 cursor-pointer" onClick={() => editDependant(idx)}>
                      <span>
                        <span className="font-semibold text-emerald-700">{dep.fullName}</span> <span className="text-xs text-gray-500">({dep.email}, {dep.phone}, {dep.relationship})</span>
                      </span>
                      <button type="button" className="text-red-500 text-xs ml-2" onClick={e => { e.stopPropagation(); removeDependant(idx); }}>Remove</button>
                    </li>
                  ))}
                </ul>
              )}
              {addingDep ? (
                <div className="mb-2 border rounded p-3 bg-gray-50">
                  <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                  <input name="fullName" value={depForm.fullName} onChange={handleDepChange} className="w-full px-4 py-2 border rounded-lg mb-2" required />
                  <label className="block text-gray-700 font-medium mb-1">Email</label>
                  <input name="email" value={depForm.email} onChange={handleDepChange} className="w-full px-4 py-2 border rounded-lg mb-2" required />
                  <label className="block text-gray-700 font-medium mb-1">Phone</label>
                  <input name="phone" value={depForm.phone} onChange={handleDepChange} className="w-full px-4 py-2 border rounded-lg mb-2" />
                  <label className="block text-gray-700 font-medium mb-1">Relationship</label>
                  <input name="relationship" value={depForm.relationship} onChange={handleDepChange} className="w-full px-4 py-2 border rounded-lg mb-2" required placeholder="e.g. Spouse, Child, Parent" />
                  <label className="block text-gray-700 font-medium mb-1">Photo <span className="text-xs text-gray-500 font-normal">(optional)</span></label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                    <div className="relative group flex gap-4 items-center justify-center">
                      <div
                        className={`h-20 w-20 rounded-full border-2 border-dashed flex items-center justify-center bg-gray-50 transition-all duration-200 ${loading ? 'opacity-60' : 'hover:border-emerald-700 cursor-pointer'}`}
                        onClick={() => !loading && depFileInputRef.current?.click()}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload dependant photo"
                        style={{ outline: 'none' }}
                      >
                        {loading ? (
                          <div className="flex flex-col items-center">
                            <svg className="animate-spin h-8 w-8 text-emerald-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                          </div>
                        ) : depPreviewUrl ? (
                          <NextImage src={depPreviewUrl} alt="Dependant Preview" className="h-20 w-20 rounded-full object-cover" width={80} height={80} />
                        ) : (
                          <svg className="h-8 w-8 text-gray-400 group-hover:text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDepImageUpload}
                          ref={depFileInputRef}
                          disabled={loading}
                        />
                        {depPreviewUrl && !loading && (
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-red-50"
                            onClick={e => {
                              e.stopPropagation();
                              setDepPreviewUrl(null);
                              setDepForm(f => ({ ...f, photo: null }));
                            }}
                            aria-label="Remove dependant image"
                          >
                            <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {/* <div className="flex-1">
                        {formError && <div className="text-red-600 mb-2">{formError}</div>}
                        <div className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 2MB.</div>
                      </div> */}
                    </div>
                    {/* {formError && <div className="text-red-600 mb-2">{formError}</div>} */}
                    
                  </div>
                  {/* {formError && <div className="text-red-600 mb-2">{formError}</div>} */}
                  <div className="flex justify-between mt-2">
                    <button type="button" className="px-4 py-1 bg-red-100 text-red-700 rounded font-semibold" onClick={() => { setAddingDep(false); setEditingDepIdx(null); setDepForm({ fullName: "", email: "", phone: "", relationship: "", photo: null }); setFormError(""); }}>Cancel</button>
                    {editingDepIdx === null ? (
                      <button type="button" className="px-4 py-1 bg-emerald-600 text-white rounded font-semibold" onClick={addDependant}>Add Dependant</button>
                    ) : (
                      <button type="button" className="px-4 py-1 bg-emerald-600 text-white rounded font-semibold" onClick={saveDependant}>Save</button>
                    )}
                  </div>
                </div>
              ) : (
                <button type="button" className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold mb-2" onClick={() => setAddingDep(true)}>+ Add Dependant</button>
              )}
            </div>
          )}
          {formError && <div className="text-red-600 mb-2">{formError}</div>}
          {submitError && <div className="text-red-600 mb-2">{submitError}</div>}
          <button type="submit" className="bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-900 transition" disabled={loading || submitting}>
            {submitting ? "Submitting..." : "Finish Onboarding"}
          </button>
        </form>
      </div>
    </div>
  );
}
