"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowDownTrayIcon, ShareIcon, QrCodeIcon, XMarkIcon } from "@heroicons/react/24/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import Link from "next/link";

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
        background: #f8fafc;
        border: 1.5px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 0.85rem 1.1rem;
        font-size: 1.08rem;
        font-weight: 500;
        color: #1e293b;
        transition: border 0.2s, box-shadow 0.2s;
        box-shadow: 0 1px 2px 0 rgba(16,185,129,0.04);
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
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({ });

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
        setShowDialog(true);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-3 md:p-6">
      <div className="w-full max-w-md mx-auto flex items-center mb-4">
        <Link href="/resident/dashboard" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-medium text-base">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-emerald-900 mb-2 text-center tracking-tight">Generate Access Code</h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="block font-medium text-gray-900">Invite Time</label>
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
          <label className="block font-medium text-gray-900">Code Validity</label>
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
          <label className="block font-medium text-gray-900">Usage Type</label>
          <div className="flex gap-4 mb-2">
            <label
              className={
                "flex items-center cursor-pointer px-3 py-2 rounded-lg border transition font-medium text-base shadow-sm " +
                (form.usageType === "ENTRY_AND_EXIT"
                  ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200"
                  : "border-gray-200 bg-gray-50 text-gray-700")
              }
            >
              <input
                type="radio"
                name="usageType"
                value="ENTRY_AND_EXIT"
                checked={form.usageType === "ENTRY_AND_EXIT"}
                onChange={() => setForm(f => ({ ...f, usageType: "ENTRY_AND_EXIT" }))}
                className="accent-emerald-600 mr-2"
              />
              Entry & Exit
            </label>
            <label
              className={
                "flex items-center cursor-pointer px-3 py-2 rounded-lg border transition font-medium text-base shadow-sm " +
                (form.usageType === "ONE_TIME"
                  ? "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-200"
                  : "border-gray-200 bg-gray-50 text-gray-700")
              }
            >
              <input
                type="radio"
                name="usageType"
                value="ENTRY_ONLY"
                checked={form.usageType === "ENTRY_ONLY"}
                onChange={() => setForm(f => ({ ...f, usageType: "ENTRY_ONLY" }))}
                className="accent-blue-600 mr-2"
              />
              One Time
            </label>
          </div>
          {fieldErrors.usageType && <div className="text-red-600 text-sm mt-1">{fieldErrors.usageType}</div>}
          <label className="block font-medium text-gray-900">Who is this invite for?</label>
          <select
            className="crispy-select w-full"
            value={form.forWhom}
            onChange={e => setForm(f => ({ ...f, forWhom: e.target.value }))}
          >
            <option value="MYSELF">Myself</option>
            <option value="OTHER">Other</option>
          </select>
          {fieldErrors.forWhom && <div className="text-red-600 text-sm mt-1">{fieldErrors.forWhom}</div>}
          {form.forWhom === "OTHER" && (
            <div>
              <label className="block font-medium text-gray-900">Number of People</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numPeople: Math.max(1, f.numPeople - 1) }))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-emerald-800 font-bold"
                  aria-label="Decrease number of people"
                >
                  -
                </button>
                <div className="px-4 py-2 rounded-lg border border-emerald-100 bg-white text-lg font-medium crispy-input">
                  {form.numPeople}
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, numPeople: Math.min(4, f.numPeople + 1) }))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-emerald-800 font-bold"
                  aria-label="Increase number of people"
                >
                  +
                </button>
              </div>
              {fieldErrors.numPeople && <div className="text-red-600 text-sm mt-1">{fieldErrors.numPeople}</div>}
            </div>
          )}
         
          <button
            type="submit"
            className="bg-emerald-700 text-white font-bold py-3 rounded-lg shadow hover:bg-emerald-900 transition text-lg"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Code"}
          </button>
        </form>
        {showDialog && result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
            <div className="bg-white rounded-xl shadow-2xl p-3 md:p-6 w-full max-w-sm md:max-w-md relative flex flex-col items-center animate-fadeIn gap-3">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-emerald-700 transition"
                onClick={() => setShowDialog(false)}
                aria-label="Close dialog"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-lg md:text-xl font-extrabold text-emerald-900 mb-1 md:mb-2 text-center tracking-tight">Access Code Generated</h2>
              <div className="w-40 h-40 mx-auto border-2 border-emerald-100 rounded-lg bg-white flex items-center justify-center overflow-hidden mb-2">
                <Image
                  src={result.qr}
                  alt="QR Code"
                  width={160}
                  height={160}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div className="text-lg md:text-4xl font-mono font-extrabold text-emerald-800 mb-3 tracking-widest break-all select-all text-center" style={{letterSpacing:'0.12em'}}>{result.code}</div>


              <div className="flex gap-4 mb-4">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold shadow text-base"
                  onClick={async () => {
                    await navigator.clipboard.writeText(result.code);
                    toast.success("Code copied to clipboard!");
                  }}
                  type="button"
                >
                  <ArrowDownTrayIcon className="w-6 h-6" /> Copy
                </button>
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold shadow text-base"
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
                  <ShareIcon className="w-6 h-6" /> Share
                </button>
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold shadow text-base"
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
                    // fallback: download
                    const link = document.createElement('a');
                    link.href = result.qr;
                    link.download = `access-qr.png`;
                    link.click();
                  }}
                  type="button"
                >
                  <QrCodeIcon className="w-6 h-6" /> Share QR
                </button>
              </div>
              <div className="w-full bg-gray-50 rounded-2xl p-3 flex flex-col gap-2 text-gray-800 text-base">
                <div className="flex justify-between"><span className="font-semibold">Valid From:</span> <span>{result.validFrom ? new Date(result.validFrom).toLocaleString() : '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Expires On:</span> <span>{result.validTo ? new Date(result.validTo).toLocaleString() : '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Expected Guests:</span> <span>{result.usageLimit ?? '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Guest Checked In:</span> <span>{result.guestCheckedIn ? new Date(result.guestCheckedIn).toLocaleString() : '-'}</span></div>
                <div className="flex justify-between"><span className="font-semibold">Guest Checked Out:</span> <span>{result.guestCheckedOut ? new Date(result.guestCheckedOut).toLocaleString() : '-'}</span></div>
              </div>
              <div className="text-green-700 text-center font-bold mt-2 text-lg">Code generated!</div>
            </div>
          </div>
        )}
        {error && <div className="mt-4 text-red-700 text-center font-semibold">{error}</div>}
      </div>
    </div>
  );
}