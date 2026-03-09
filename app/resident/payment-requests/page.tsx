"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BanknotesIcon, ArrowUpTrayIcon, EyeIcon } from "@heroicons/react/24/outline";

interface AdminInfo {
  fullName: string;
  email: string;
}

interface PaymentRequest {
  id: string;
  amount: number;
  status: "PENDING" | "PAID" | "REJECTED";
  createdAt: string;
  details?: string | null;
  rejectReason?: string | null;
  paymentProofUrl?: string | null;
  admin?: AdminInfo | null;
}

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | "">("");

  const [showProofModal, setShowProofModal] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string>(""); // remote URL after upload
  const [previewImageUrl, setPreviewImageUrl] = useState<string>(""); // local preview before/while upload
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofError, setProofError] = useState<string | "">("");

  const [showViewProofModal, setShowViewProofModal] = useState(false);
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/resident/payment-requests");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load payment requests");
      } else {
        setRequests(data);
      }
    } catch {
      setError("Network error while loading payment requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  function openProofModal(request: PaymentRequest) {
    setActiveRequestId(request.id);
    setProofImageUrl(request.paymentProofUrl || "");
    setProofError("");
    setShowProofModal(true);
  }

  function closeProofModal() {
    setShowProofModal(false);
    setActiveRequestId(null);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    setPreviewImageUrl("");
    setProofImageUrl("");
    setProofError("");
    setUploadingImage(false);
    setSubmittingProof(false);
  }

  function openViewProof(url: string) {
    setViewProofUrl(url);
    setShowViewProofModal(true);
  }

  function closeViewProof() {
    setShowViewProofModal(false);
    setViewProofUrl(null);
  }

  async function handleProofFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Create a local preview immediately
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    const localUrl = URL.createObjectURL(file);
    setPreviewImageUrl(localUrl);
    setUploadingImage(true);
    setProofError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setProofError(data.error || "Failed to upload image");
      } else {
        setProofImageUrl(data.url as string);
      }
    } catch {
      setProofError("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!activeRequestId) return;
    if (!proofImageUrl) {
      setProofError("Please upload a screenshot or photo of your payment first.");
      return;
    }

    setSubmittingProof(true);
    setProofError("");

    try {
      const res = await fetch(`/api/resident/payment-requests/${activeRequestId}/upload-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProofUrl: proofImageUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setProofError(data.error || "Failed to save payment proof");
      } else {
        closeProofModal();
        await loadRequests();
      }
    } catch {
      setProofError("Network error while saving payment proof");
    } finally {
      setSubmittingProof(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <BanknotesIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-emerald-950 tracking-tight sm:text-xl">
              Payment requests
            </h1>
            <p className="text-[11px] text-emerald-700">
              View estate fees raised by admin and upload your payment proof.
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-100 self-start sm:self-auto">
          <span className="text-[10px] uppercase tracking-wide text-emerald-700">Pending</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span>{pendingCount}</span>
        </div>
      </header>

      <section className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">How it works</h2>
            <p className="text-[11px] text-emerald-700">
              When your estate admin raises a payment request, it will appear here. After you pay,
              upload a screenshot or receipt so the admin can mark it as paid.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
        {loading && <div className="text-[11px] text-emerald-800">Loading payment requests...</div>}
        {error && !loading && (
          <div className="mb-2 text-[11px] font-semibold text-rose-700">{error}</div>
        )}

        {!loading && requests.length === 0 && !error && (
          <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-6 text-center text-[11px] text-emerald-800">
            You don&apos;t have any payment requests yet.
          </div>
        )}

        {/* Mobile: stacked cards */}
        {!loading && requests.length > 0 && (
          <div className="space-y-3 md:hidden">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-white/95 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-emerald-700">
                      {req.admin?.fullName || "Estate admin"}
                    </div>
                    <div className="mt-0.5 text-[10px] text-emerald-600">
                      {new Date(req.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-emerald-950">
                      ₦{req.amount.toLocaleString()}
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-800 break-words whitespace-normal">
                      {req.details || "No extra details provided."}
                    </div>
                    {req.rejectReason && (
                      <div className="mt-1 text-[11px] text-rose-700">
                        Rejected: {req.rejectReason}
                      </div>
                    )}
                    {req.paymentProofUrl && (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-100">
                        <ArrowUpTrayIcon className="h-3 w-3" />
                        <span>Proof uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[11px]">
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 font-medium " +
                        (req.status === "PENDING"
                          ? "bg-amber-50 text-amber-800"
                          : req.status === "PAID"
                          ? "bg-emerald-600 text-emerald-50"
                          : "bg-rose-50 text-rose-700")
                      }
                    >
                      {req.status}
                    </span>
                    {req.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => openViewProof(req.paymentProofUrl!)}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 border border-emerald-100"
                      >
                        <EyeIcon className="h-3 w-3" />
                        View proof
                      </button>
                    )}
                    {req.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => openProofModal(req)}
                        className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700"
                      >
                        {req.paymentProofUrl ? "Update proof" : "Upload proof"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop: simple table */}
        {!loading && requests.length > 0 && (
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-emerald-50 bg-white/90">
              <div className="max-h-[480px] overflow-y-auto">
                <table className="min-w-full text-xs text-emerald-950">
                  <thead className="bg-emerald-50/80 text-[11px] uppercase tracking-wide text-emerald-700">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">From</th>
                      <th className="px-4 py-2 text-left font-semibold">Amount</th>
                      <th className="px-4 py-2 text-left font-semibold">Details</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Proof</th>
                      <th className="px-4 py-2 text-left font-semibold">Created</th>
                      <th className="px-4 py-2 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {requests.map((req) => (
                      <tr key={req.id} className="transition hover:bg-emerald-50/60">
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] font-medium text-emerald-800">
                            {req.admin?.fullName || "Estate admin"}
                          </span>
                          {req.admin?.email && (
                            <div className="text-[10px] text-emerald-600">{req.admin.email}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] font-semibold text-emerald-900">
                            ₦{req.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">
                            {req.details || "No extra details provided."}
                          </span>
                          {req.rejectReason && (
                            <div className="mt-0.5 text-[10px] text-rose-700">Rejected: {req.rejectReason}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span
                            className={
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium " +
                              (req.status === "PENDING"
                                ? "bg-amber-50 text-amber-800"
                                : req.status === "PAID"
                                ? "bg-emerald-600 text-emerald-50"
                                : "bg-rose-50 text-rose-700")
                            }
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          {req.paymentProofUrl ? (
                            <button
                              type="button"
                              onClick={() => openViewProof(req.paymentProofUrl!)}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 border border-emerald-100"
                            >
                              <EyeIcon className="h-3 w-3" />
                              View proof
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600">No proof yet</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span className="text-[11px] text-emerald-800">
                            {new Date(req.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right">
                          {req.status === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => openProofModal(req)}
                              className="inline-flex items-center rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-700"
                            >
                              {req.paymentProofUrl ? "Update proof" : "Upload proof"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {showProofModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-5">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={closeProofModal}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Upload payment proof</h2>
              <p className="text-[11px] text-emerald-700">
                Upload a screenshot or clear photo of your transfer receipt or payment confirmation.
              </p>
            </div>
            <form className="space-y-3 text-[11px]" onSubmit={handleSubmitProof}>
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-3 flex flex-col gap-2">
                <p className="text-[11px] font-medium text-emerald-900">Attach image</p>
                <p className="text-[10px] text-emerald-700">
                  You can take a fresh photo or pick from your gallery.
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50">
                    <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                    <span>Take photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50">
                    <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                    <span>Upload from gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {uploadingImage && (
                  <div className="text-[10px] text-emerald-700 mt-0.5">Uploading image...</div>
                )}
                {previewImageUrl && (
                  <div className="mt-2 flex items-center justify-start">
                    <div className="relative h-32 w-32">
                      <Image
                        src={previewImageUrl}
                        alt="Payment proof preview"
                        fill
                        className="rounded-xl border border-emerald-100 shadow-sm object-cover bg-white"
                        unoptimized
                      />
                    </div>
                  </div>
                )}
                {proofImageUrl && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-1 text-[10px] font-medium text-emerald-900 border border-emerald-200">
                    <ArrowUpTrayIcon className="h-3 w-3" />
                    <span>Image ready to submit</span>
                  </div>
                )}
              </div>

              {proofError && (
                <div className="text-[11px] text-rose-700">{proofError}</div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProof}
                  className="rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-60"
                >
                  {submittingProof ? "Saving..." : "Submit proof"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewProofModal && viewProofUrl && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-5">
            <button
              type="button"
              className="absolute right-3 top-3 text-lg text-emerald-900"
              onClick={closeViewProof}
              aria-label="Close dialog"
            >
              &times;
            </button>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Your payment proof</h2>
              <p className="text-[11px] text-emerald-700">
                This is the image you uploaded for this payment request.
              </p>
            </div>
            <div className="relative mx-auto mb-3 h-64 w-full max-w-sm">
              <Image
                src={viewProofUrl}
                alt="Uploaded payment proof"
                fill
                className="rounded-2xl border border-emerald-100 object-contain bg-slate-50"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <a
                href={viewProofUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-800"
              >
                Open in new tab
              </a>
              <button
                type="button"
                onClick={closeViewProof}
                className="rounded-full bg-emerald-700 px-4 py-1.5 text-[11px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
