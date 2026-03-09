"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  invites: Invite[];
  accessCodes: AccessCode[];
}

interface Invite {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface AccessCode {
  id: string;
  code: string;
  status: string;
  inviteStart: string;
  inviteEnd: string;
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      await Promise.resolve();

      if (!id || id === "undefined") {
        if (!cancelled) {
          setError("Invalid or missing user id.");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/admin/users/${id}`);
        const data = await res.json();
        if (!cancelled) {
          if (data.error) setError(data.error);
          else setUser(data.user);
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const [timeline, setTimeline] = useState<{ id: string; action: string; createdAt: string; metadata?: string }[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [timelineError, setTimelineError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadTimeline = async () => {
      await Promise.resolve();

      if (!id || id === "undefined") {
        if (!cancelled) {
          setTimelineError("Invalid or missing user id.");
          setTimelineLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/admin/users/${id}/timeline`);
        const data = await res.json();
        if (!cancelled) {
          if (data.error) setTimelineError(data.error);
          else setTimeline(data.logs);
        }
      } catch {
        if (!cancelled) setTimelineError("Network error");
      } finally {
        if (!cancelled) setTimelineLoading(false);
      }
    };

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!user) return <div className="p-8">Not found.</div>;

  return (
    <div className="min-h-screen flex justify-center bg-gray-50">
      <div className="w-full p-8 rounded-2xl shadow-lg bg-white">
        <button className="mb-4 text-emerald-700 underline" onClick={() => router.back()}>&larr; Back</button>
        <h1 className="text-2xl font-bold text-emerald-700 mb-4">User Details</h1>
        <div className="mb-4">
          <div className="font-semibold">Name:</div>
          <div>{user.fullName}</div>
          <div className="font-semibold mt-2">Email:</div>
          <div>{user.email}</div>
          <div className="font-semibold mt-2">Phone:</div>
          <div>{user.phone}</div>
          <div className="font-semibold mt-2">Role:</div>
          <div>{user.role}</div>
          <div className="font-semibold mt-2">Status:</div>
          <div>{user.status}</div>
          <div className="font-semibold mt-2">Address:</div>
          <div>{user.address}</div>
          <div className="font-semibold mt-2">Created At:</div>
          <div>{new Date(user.createdAt).toLocaleString()}</div>
          <div className="font-semibold mt-2">Updated At:</div>
          <div>{new Date(user.updatedAt).toLocaleString()}</div>
        </div>
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-2">Invites</h2>
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1">Status</th>
                <th className="p-1">Created</th>
                <th className="p-1">Expires</th>
              </tr>
            </thead>
            <tbody>
              {user.invites.map(invite => (
                <tr key={invite.id} className="border-b">
                  <td className="p-1">{invite.status}</td>
                  <td className="p-1">{new Date(invite.createdAt).toLocaleString()}</td>
                  <td className="p-1">{new Date(invite.expiresAt).toLocaleString()}</td>
                </tr>
              ))}
              {user.invites.length === 0 && (
                <tr><td colSpan={3} className="text-center p-2">No invites.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-2">Access Codes</h2>
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-1">Code</th>
                <th className="p-1">Status</th>
                <th className="p-1">Valid From</th>
                <th className="p-1">Valid To</th>
              </tr>
            </thead>
            <tbody>
              {user.accessCodes.map(code => (
                <tr key={code.id} className="border-b">
                  <td className="p-1 font-mono">{code.code}</td>
                  <td className="p-1">{code.status}</td>
                  <td className="p-1">{new Date(code.inviteStart).toLocaleString()}</td>
                  <td className="p-1">{new Date(code.inviteEnd).toLocaleString()}</td>
                </tr>
              ))}
              {user.accessCodes.length === 0 && (
                <tr><td colSpan={4} className="text-center p-2">No codes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div>
          <h2 className="font-bold text-lg mb-2">Activity Timeline</h2>
          {timelineLoading && <div>Loading timeline...</div>}
          {timelineError && <div className="text-red-600 mb-2">{timelineError}</div>}
          <ul className="border-l-2 border-emerald-400 pl-4">
            {timeline.map(log => (
              <li key={log.id} className="mb-4 relative">
                <span className="absolute left-[-18px] top-1 w-3 h-3 bg-emerald-400 rounded-full"></span>
                <div className="font-semibold text-sm">{log.action}</div>
                <div className="text-xs text-emerald-900 font-semibold">{new Date(log.createdAt).toLocaleString()}</div>
                {log.metadata && <div className="text-xs text-emerald-800 mt-1 font-semibold">{log.metadata}</div>}
              </li>
            ))}
            {timeline.length === 0 && !timelineLoading && (
              <li className="text-emerald-800 font-semibold">No activity found.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
