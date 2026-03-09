"use client";

import { Suspense } from "react";
import AdminCodeApprovalsPage from "../admin-code-approvals";

export default function AdminCodeApprovalsRoute() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-emerald-800">Loading admin code approvals...</div>}>
      <AdminCodeApprovalsPage />
    </Suspense>
  );
}
