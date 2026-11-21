"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
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
  budgetVersion: number;
  notifyBudgetUpdated: () => void;
  aiConsultantOpen: boolean;
  openAiConsultant: () => void;
  closeAiConsultant: () => void;
}

const AppStatusContext = createContext<AppStatusContextValue | null>(null);

export function AppStatusProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [demoMode, setDemoModeState] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [budgetVersion, setBudgetVersion] = useState(0);
  const [aiConsultantOpen, setAiConsultantOpen] = useState(false);
  const userToggledDemoRef = useRef(false);

  const setDemoMode = useCallback((enabled: boolean) => {
    userToggledDemoRef.current = true;
    setDemoModeState(enabled);
  }, []);

  const toggleHideBalances = useCallback(() => {
    setHideBalances((prev) => !prev);
  }, []);

  const notifyBudgetUpdated = useCallback(() => {
    setBudgetVersion((prev) => prev + 1);
  }, []);

  const openAiConsultant = useCallback(() => {
    setAiConsultantOpen(true);
  }, []);

  const closeAiConsultant = useCallback(() => {
    setAiConsultantOpen(false);
  }, []);

  const refreshHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as HealthResponse;
      setHealth(data);

      // Se ambos os backends Java estiverem offline na 1ª visita, entra em Modo Demo automaticamente
      if (
        !userToggledDemoRef.current &&
        data.budget.status !== "online" &&
        data.checkout.status !== "online"
      ) {
        setDemoModeState(true);
      }

      return data;
    } catch {
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Não faz polling de /api/health na Landing Page (/) para manter entrada leve
  useEffect(() => {
    if (pathname === "/") return undefined;
    void refreshHealth();
    const interval = window.setInterval(() => {
      void refreshHealth();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [pathname, refreshHealth]);

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
      budgetVersion,
      notifyBudgetUpdated,
      aiConsultantOpen,
      openAiConsultant,
      closeAiConsultant,
    }),
    [
      health,
      isChecking,
      demoMode,
      setDemoMode,
      hideBalances,
      toggleHideBalances,
      refreshHealth,
      isBudgetOnline,
      isCheckoutOnline,
      budgetVersion,
      notifyBudgetUpdated,
      aiConsultantOpen,
      openAiConsultant,
      closeAiConsultant,
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
