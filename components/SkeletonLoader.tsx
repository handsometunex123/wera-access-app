import React from "react";

export default function SkeletonLoader({ className = "", count = 1, variant = "card" }) {
  // variant: "card" | "line" | "block"
  return (
    <div className={className + " animate-pulse"}>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === "line") {
          return (
            <div
              key={i}
              className="h-3 w-24 rounded bg-emerald-100 mb-2 last:mb-0"
            />
          );
        }
        if (variant === "block") {
          return (
            <div
              key={i}
              className="h-10 rounded-lg bg-emerald-50 mb-2 last:mb-0"
            />
          );
        }
        // Default: card
        return (
          <div
            key={i}
            className="rounded-xl border border-emerald-100 bg-white/80 p-4 shadow-sm mb-3 last:mb-0"
          >
            <div className="h-3 w-24 rounded bg-emerald-100 mb-3" />
            <div className="h-6 w-14 rounded bg-emerald-200" />
          </div>
        );
      })}
    </div>
  );
}
