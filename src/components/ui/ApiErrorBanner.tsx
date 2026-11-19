"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";
import type { NormalizedApiError } from "@/types/bff";

interface ApiErrorBannerProps {
  error: NormalizedApiError | null;
  onDismiss?: () => void;
  className?: string;
}

export function ApiErrorBanner({
  error,
  onDismiss,
  className = "",
}: ApiErrorBannerProps) {
  if (!error) return null;

  const isWarning = error.status === 502 || error.status === 503;
  const containerStyles = isWarning
    ? "border-amber-200 bg-amber-50/90 text-amber-950"
    : "border-rose-200 bg-rose-50/90 text-rose-950";

  const badgeStyles = isWarning
    ? "bg-amber-200/80 text-amber-900"
    : "bg-rose-200/80 text-rose-900";

  return (
    <div
      role="alert"
      className={`rounded-xl border p-4 text-sm ${containerStyles} ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${badgeStyles}`}
            >
              HTTP {error.status}
            </span>
            <span className="inline-flex items-center rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {error.service === "budget" ? "Smart Budget" : "Checkout API"}
            </span>
            <h4 className="font-semibold">{error.title}</h4>
          </div>
          <p className="mt-1.5 leading-relaxed opacity-90">{error.message}</p>
          {error.details.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs opacity-90">
              {error.details.map((detail, index) => (
                <li key={`${detail}-${index}`}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
