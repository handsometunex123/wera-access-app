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
		<div className="bg-gray-50 flex flex-col items-center">
			<div className="w-full max-w-md p-8 rounded-2xl bg-white flex flex-col items-center">
				<h1 className="text-2xl font-bold text-emerald-700 mb-4">Invite Resident or Guard</h1>
				<form className="w-full" onSubmit={handleSubmit}>
					<div className="mb-4">
						<label className="block text-emerald-900 font-semibold mb-1" htmlFor="email">Email</label>
						<input
							type="email"
							id="email"
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
							placeholder="Enter email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="mb-6">
						<label className="block text-emerald-900 font-semibold mb-1" htmlFor="role">Role</label>
						<select
							id="role"
							className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200"
							value={role}
							onChange={e => setRole(e.target.value)}
						>
							<option value="MAIN_RESIDENT">Main Resident</option>
							<option value="ESTATE_GUARD">Estate Guard</option>
						</select>
					</div>
					<button
						type="submit"
						className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg shadow hover:bg-emerald-700 transition"
						disabled={loading}
					>
						{loading ? "Sending..." : "Send Invite"}
					</button>
				</form>
				{error && <div className="mt-4 text-red-600 text-sm">{error}</div>}
				{success && <div className="mt-4 text-emerald-600 text-sm">{success}</div>}
			</div>
		</div>
	);
}