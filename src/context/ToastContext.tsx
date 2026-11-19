"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  notify: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 5500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((item) => {
          const styles =
            item.tone === "success"
              ? "border-emerald-200 bg-white text-slate-900 shadow-lg shadow-emerald-900/5"
              : item.tone === "error"
                ? "border-rose-200 bg-white text-slate-900 shadow-lg shadow-rose-900/5"
                : item.tone === "warning"
                  ? "border-amber-200 bg-white text-slate-900 shadow-lg shadow-amber-900/5"
                  : "border-blue-200 bg-white text-slate-900 shadow-lg shadow-blue-900/5";

          const Icon =
            item.tone === "success"
              ? CheckCircle2
              : item.tone === "error"
                ? XCircle
                : item.tone === "warning"
                  ? AlertTriangle
                  : Info;

          const iconColor =
            item.tone === "success"
              ? "text-emerald-600"
              : item.tone === "error"
                ? "text-rose-600"
                : item.tone === "warning"
                  ? "text-amber-500"
                  : "text-[#002D72]";

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 transition-all ${styles}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return ctx;
}
