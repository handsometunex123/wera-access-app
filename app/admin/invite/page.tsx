"use client";
import React, { useState } from "react";

export default function AdminInvitePage({ onInviteSent }: { onInviteSent?: () => void }) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState("MAIN_RESIDENT");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setSuccess("");
		setError("");
		try {
			const res = await fetch("/api/admin/invite", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, role }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || "Failed to send invite");
			} else {
				setSuccess(`Invite sent! Expires: ${new Date(data.expiresAt).toLocaleString()}`);
				setEmail("");
				if (onInviteSent) onInviteSent();
			}
		} catch {
			setError("Network error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="flex flex-col gap-3 text-[11px]" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-1">
				<label className="text-[11px] font-medium text-emerald-900" htmlFor="email">Email</label>
				<input
					type="email"
					id="email"
					className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm placeholder:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
					placeholder="Enter resident email"
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
				/>
			</div>
			<div className="flex flex-col gap-1">
				<label className="text-[11px] font-medium text-emerald-900" htmlFor="role">Role</label>
				<select
					id="role"
					className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2 text-[12px] text-emerald-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
					value={role}
					onChange={e => setRole(e.target.value)}
				>
					<option value="MAIN_RESIDENT">Main resident</option>
					<option value="ESTATE_GUARD">Estate guard</option>
				</select>
			</div>
			<div className="mt-1 flex justify-end">
				<button
					type="submit"
					className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-[12px] font-semibold text-emerald-50 shadow-sm hover:bg-emerald-800 disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "Sending..." : "Send invite"}
				</button>
			</div>
			{error && <div className="mt-1 text-[10px] font-medium text-rose-700">{error}</div>}
			{success && <div className="mt-1 text-[10px] font-medium text-emerald-700">{success}</div>}
		</form>
	);
}