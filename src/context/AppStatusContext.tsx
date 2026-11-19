"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { HealthResponse } from "@/types/bff";

interface AppStatusContextValue {
  health: HealthResponse | null;
  isChecking: boolean;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  hideBalances: boolean;
  toggleHideBalances: () => void;
  refreshHealth: () => Promise<HealthResponse | null>;
  isBudgetOnline: boolean;
  isCheckoutOnline: boolean;
}

const AppStatusContext = createContext<AppStatusContextValue | null>(null);

export function AppStatusProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);

  const toggleHideBalances = useCallback(() => {
    setHideBalances((prev) => !prev);
  }, []);

  const refreshHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as HealthResponse;
      setHealth(data);
      return data;
    } catch {
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
    const interval = window.setInterval(() => {
      void refreshHealth();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [refreshHealth]);

  const isBudgetOnline = health?.budget.status === "online";
  const isCheckoutOnline = health?.checkout.status === "online";

  const value = useMemo(
    () => ({
      health,
      isChecking,
      demoMode,
      setDemoMode,
      hideBalances,
      toggleHideBalances,
      refreshHealth,
      isBudgetOnline,
      isCheckoutOnline,
    }),
    [
      health,
      isChecking,
      demoMode,
      hideBalances,
      toggleHideBalances,
      refreshHealth,
      isBudgetOnline,
      isCheckoutOnline,
    ],
  );

  return (
    <AppStatusContext.Provider value={value}>
      {children}
    </AppStatusContext.Provider>
  );
}

export function useAppStatus(): AppStatusContextValue {
  const ctx = useContext(AppStatusContext);
  if (!ctx) {
    throw new Error("useAppStatus deve ser usado dentro de AppStatusProvider");
  }
  return ctx;
}
