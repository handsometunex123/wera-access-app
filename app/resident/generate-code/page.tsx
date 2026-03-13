"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowDownTrayIcon, ShareIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { KeyIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import ResidentBackToDashboard from "@/components/ResidentBackToDashboard";

function useDatepickerStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .react-datepicker__input-container input {
        background: #f8fafc;
        border: 1.5px solid #10b981;
        border-radius: 0.5rem;
        padding: 0.75rem 1rem;
        font-size: 1rem;
        font-weight: 500;
        color: #065f46;
        transition: border 0.2s;
      }
      .react-datepicker__input-container input:focus {
        outline: none;
        border-color: #059669;
        box-shadow: 0 0 0 2px #a7f3d0;
      }
      .react-datepicker-popper {
        min-width: unset !important;
        width: unset !important;
        max-width: unset !important;
      }
      .react-datepicker-popper.datepicker-popper-width {
        min-width: 0 !important;
        width: 100% !important;
        max-width: none !important;
        left: 0 !important;
        right: 0 !important;
      }
      .react-datepicker {
        border-radius: 1rem;
        box-shadow: 0 8px 32px rgba(16,185,129,0.12);
        border: none;
        font-family: inherit;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
      }
      .react-datepicker__header {
        // background: #10b981;
        // border-top-left-radius: 1rem;
        // border-top-right-radius: 1rem;
        // color: #fff;
        // border-bottom: none;
        // padding-top: 1rem;
        display: none;
      }
      .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
        color: #fff;
        font-weight: 700;
      }
      .react-datepicker__day, .react-datepicker__time-list-item {
        border-radius: 0.5rem;
        padding: 1rem;
        transition: background 0.2s, color 0.2s;
      }
      .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected, .react-datepicker__time-list-item--selected {
        background: #10b981;
        color: #fff;
      }
      .react-datepicker__day:hover, .react-datepicker__time-list-item:hover {
        background: #a7f3d0;
        color: #065f46;
      }
      .react-datepicker__triangle {
        display: none;
      }
      .react-datepicker__time-container {
        border-radius: 1rem;
        background: #f8fafc;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
      }
      .react-datepicker__time-list {
        border-radius: 1rem;
        background: #f8fafc;
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
      }
      .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
        width: 100% !important;
      }
      .react-datepicker-wrapper {
        width: 100% !important;
      }
       .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
            white-space: nowrap;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
            background-color: #047857 !important;
        }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
}
import Image from "next/image";

function useCrispyInputStyles() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .crispy-input, .crispy-select {
        background: #ffffff;
        border: 1px solid #d1fae5;
        border-radius: 9999px;
        padding: 0.55rem 0.9rem;
        font-size: 0.78rem;
        font-weight: 500;
        color: #064e3b;
        transition: border 0.2s, box-shadow 0.2s, background 0.2s;
        box-shadow: 0 1px 2px 0 rgba(16,185,129,0.06);
      }
      .crispy-input:focus, .crispy-select:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 2px #a7f3d0;
        background: #f0fdf4;
      }
      .crispy-input[disabled], .crispy-select[disabled] {
        background: #f1f5f9;
        color: #94a3b8;
        border-color: #e5e7eb;
        cursor: not-allowed;
      }
      .crispy-input::-webkit-input-placeholder, .crispy-select::-webkit-input-placeholder {
        color: #94a3b8;
        opacity: 1;
      }
      .crispy-input:-ms-input-placeholder, .crispy-select:-ms-input-placeholder {
        color: #94a3b8;
        opacity: 1;
      }
      .crispy-input::placeholder, .crispy-select::placeholder {
        color: #94a3b8;
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
}

export default function ResidentGenerateCodePage() {
  useDatepickerStyles();
  useCrispyInputStyles();
  const [form, setForm] = useState({
    inviteTime: new Date() as Date | null,
    validity: 60,
    usageType: "ENTRY_AND_EXIT",
    forWhom: "MYSELF",
    numPeople: 1,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | ( {
      code: string;
      qr: string;
      validFrom?: string;
      validTo?: string;
      usageType?: string;
      usageLimit?: number;
      type?: string;
      status?: string;
      guestCheckedIn?: string;
      guestCheckedOut?: string;
    })
    | null
  >(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({ });
  const [showResultModal, setShowResultModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    // Validation
    const errors: { [key: string]: string } = {};
    if (!form.inviteTime) errors.inviteTime = "Invite time is required.";
    if (!form.validity) errors.validity = "Code validity is required.";
    if (!form.usageType) errors.usageType = "Usage type is required.";
    if (!form.forWhom) errors.forWhom = "Who is this invite for? is required.";
    if (form.forWhom === "OTHER" && (!form.numPeople || form.numPeople < 1)) {
      errors.numPeople = "Number of people is required and must be at least 1.";
    }
    // Enforce max limit of 4 for numPeople
    if (form.numPeople > 4) {
      errors.numPeople = "Number of people cannot exceed 4.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        ...form,
        inviteTime: form.inviteTime ? form.inviteTime.toISOString() : "",
      };
      const res = await fetch("/api/resident/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to generate code");
      else {
        setResult(data);
        setShowResultModal(true);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [popperWidth, setPopperWidth] = useState<number | undefined>(undefined);
  const popperClass = "datepicker-popper-width";

  useEffect(() => {
    function updateWidth() {
      if (inputWrapperRef.current) {
        setPopperWidth(inputWrapperRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (popperWidth) {
      let styleTag = document.getElementById("datepicker-popper-width-style") as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "datepicker-popper-width-style";
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `.${popperClass} { width: ${popperWidth}px !important; min-width: ${popperWidth}px !important; max-width: ${popperWidth}px !important; }`;
    }
  }, [popperWidth]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <ResidentBackToDashboard />
        <p className="hidden text-[11px] text-emerald-700 md:inline">Create a fresh guest access code in seconds.</p>
      </div>
      <div className="w-full rounded-2xl border border-emerald-100 bg-white/95 shadow-sm p-4 md:p-6 flex flex-col gap-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <KeyIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-semibold text-emerald-950 tracking-tight">Generate guest code</h1>
            <p className="text-[11px] text-emerald-700">Create a short-lived access code for your visitors.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3 shadow-sm sm:p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Code details</h2>
            <p className="text-[11px] text-emerald-700">Pick a time window and how your guest can use the code.</p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="block text-[11px] font-medium text-emerald-900">Invite time</label>
          <div className="relative w-full" ref={inputWrapperRef}>
            <DatePicker
              selected={form.inviteTime}
              onChange={(date: Date | null) => setForm(f => ({ ...f, inviteTime: date }))}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={1}
              timeCaption=""
              dateFormat="h:mm aa"
              className="crispy-input w-full"
              placeholderText="Select time (e.g. 03:37 PM)"
              required
              popperPlacement="bottom-start"
              showPopperArrow={false}
              timeFormat="h:mm aa"
              popperClassName={popperClass}
            />
          </div>
          <label className="block text-[11px] font-medium text-emerald-900">Code validity</label>
          <select
            className="crispy-select w-full"
            value={form.validity}
            onChange={e => setForm(f => ({ ...f, validity: Number(e.target.value) }))}
            required
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={180}>3 hours</option>
            <option value={240}>4 hours</option>
            <option value={300}>5 hours</option>
            <option value={360}>6 hours</option>
            <option value={420}>7 hours</option>
            <option value={480}>8 hours</option>
            <option value={540}>9 hours</option>
            <option value={600}>10 hours</option>
            <option value={660}>11 hours</option>
            <option value={720}>12 hours</option>
            <option value={780}>13 hours</option>
            <option value={840}>14 hours</option>
            <option value={900}>15 hours</option>
            <option value={960}>16 hours</option>
          </select>
          {fieldErrors.validity && <div className="text-red-600 text-sm mt-1">{fieldErrors.validity}</div>}
          <label className="block text-[11px] font-medium text-emerald-900">Usage type</label>
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, usageType: "ENTRY_AND_EXIT" }))}
              className={
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                (form.usageType === "ENTRY_AND_EXIT"
                  ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                  : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
              }
            >
              Entry & exit
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, usageType: "ENTRY_ONLY" }))}
              className={
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                (form.usageType === "ENTRY_ONLY"
                  ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                  : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
              }
            >
              One time entry
            </button>
          </div>
          {fieldErrors.usageType && <div className="text-red-600 text-sm mt-1">{fieldErrors.usageType}</div>}
          <label className="block text-[11px] font-medium text-emerald-900">Who is this invite for?</label>
          <div className="flex flex-wrap gap-2 mb-1">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, forWhom: "MYSELF" }))}
              className={
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                (form.forWhom === "MYSELF"
                  ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                  : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
              }
            >
              Myself
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, forWhom: "OTHER" }))}
              className={
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition " +
                (form.forWhom === "OTHER"
                  ? "border-emerald-300 bg-emerald-700 text-emerald-50"
                  : "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100")
              }
            >
              Someone else
            </button>
          </div>
          {fieldErrors.forWhom && <div className="text-red-600 text-sm mt-1">{fieldErrors.forWhom}</div>}
          {form.forWhom === "OTHER" && (
            <div>
              <label className="block text-[11px] font-medium text-emerald-900">Number of people</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numPeople: Math.max(1, f.numPeople - 1) }))}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-emerald-800 text-sm font-bold"
                  aria-label="Decrease number of people"
                >
                  -
                </button>
                <div className="min-w-[3rem] rounded-full border border-emerald-100 bg-white px-4 py-1 text-center text-[13px] font-semibold text-emerald-900">
                  {form.numPeople}
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numPeople: Math.min(4, f.numPeople + 1) }))}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-emerald-800 text-sm font-bold"
                  aria-label="Increase number of people"
                >
                  +
                </button>
              </div>
              {fieldErrors.numPeople && <div className="text-red-600 text-sm mt-1">{fieldErrors.numPeople}</div>}
            </div>
          )}

          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-emerald-700">Codes can be scanned by estate guards during the selected window.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[13px] font-semibold text-emerald-50 shadow-sm transition hover:bg-emerald-800 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate code"}
            </button>
          </div>
          {error && <div className="mt-3 text-[10px] font-medium text-rose-700">{error}</div>}
        </form>
        </div>

        {showResultModal && result && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 px-4">
            <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white/95 p-4 shadow-2xl sm:p-5">
              <button
                type="button"
                onClick={() => setShowResultModal(false)}
                className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                aria-label="Close generated code details"
              >
                ×
              </button>
              <div className="mb-3 pr-6">
                <h2 className="text-sm font-semibold text-emerald-950 tracking-tight">Generated code</h2>
                <p className="text-[11px] text-emerald-700">
                  Share this code or QR with your guest or estate security.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-50 bg-emerald-50/40 px-3 py-3 sm:px-4">
                <div className="mb-3 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Scan QR</span>
                  <Image
                    src={result.qr}
                    alt="QR Code"
                    width={160}
                    height={160}
                    className="object-contain border rounded-lg bg-white"
                    priority
                    unoptimized
                  />
                  <div className="rounded-full bg-white px-3 py-1 font-mono text-[13px] font-semibold text-emerald-900 border border-emerald-100 break-all text-center">
                    {result.code}
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap justify-center gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100"
                    onClick={async () => {
                      await navigator.clipboard.writeText(result.code);
                      toast.success("Code copied to clipboard!");
                    }}
                    type="button"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" /> Copy
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-[12px] font-semibold text-sky-800 shadow-sm hover:bg-sky-100"
                    onClick={async () => {
                      if (navigator.share) {
                        await navigator.share({ title: "Access Code", text: result.code });
                      } else {
                        await navigator.clipboard.writeText(result.code);
                        toast.success("Code copied to clipboard!");
                      }
                    }}
                    type="button"
                  >
                    <ShareIcon className="w-4 h-4" /> Share
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
                    onClick={async () => {
                      if (navigator.canShare && window.Blob && result.qr.startsWith('data:image')) {
                        try {
                          const res = await fetch(result.qr);
                          const blob = await res.blob();
                          const file = new File([blob], 'access-qr.png', { type: blob.type });
                          if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ files: [file], title: 'Access QR Code' });
                            return;
                          }
                        } catch {}
                      }
                      const link = document.createElement('a');
                      link.href = result.qr;
                      link.download = `access-qr.png`;
                      link.click();
                    }}
                    type="button"
                  >
                    <QrCodeIcon className="w-4 h-4" /> Share QR
                  </button>
                </div>
                <div className="grid gap-2 text-[11px] text-emerald-900 sm:grid-cols-2">
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                    <span className="font-semibold">Valid from:</span>
                    <span>{result.validFrom ? new Date(result.validFrom).toLocaleString() : '-'}</span>
                  </div>
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                    <span className="font-semibold">Valid to:</span>
                    <span>{result.validTo ? new Date(result.validTo).toLocaleString() : '-'}</span>
                  </div>
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                    <span className="font-semibold">Expected guests:</span>
                    <span>{result.usageLimit ?? '-'}</span>
                  </div>
                  <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-emerald-100 flex items-center justify-between">
                    <span className="font-semibold">Usage type:</span>
                    <span>{result.usageType ? result.usageType.replace("_", " ") : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}