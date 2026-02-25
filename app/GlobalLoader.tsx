"use client";
import React, { useState, useEffect } from "react";

export function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Patch window.fetch to intercept API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      setLoading(true);
      try {
        const response = await originalFetch(...args);
        setLoading(false);
        return response;
      } catch (err) {
        setLoading(false);
        throw err;
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return loading ? (
    <div className="fixed top-0 left-0 w-full z-50">
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-700 to-emerald-400 animate-pulse"></div>
    </div>
  ) : null;
}
