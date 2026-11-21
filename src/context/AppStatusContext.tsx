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
import { useToast } from "@/context/ToastContext";

const WAKE_POLL_INTERVAL_MS = 5000;
const STEADY_POLL_INTERVAL_MS = 30000;
const WAKE_TIMEOUT_SECONDS = 120;

interface AppStatusContextValue {
  health: HealthResponse | null;
  hasCheckedOnce: boolean;
  isChecking: boolean;
  isWakingUp: boolean;
  wakeTimedOut: boolean;
  wakeElapsedSeconds: number;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  hideBalances: boolean;
  toggleHideBalances: () => void;
  refreshHealth: (options?: { wake?: boolean }) => Promise<HealthResponse | null>;
  restartWakeup: () => void;
  isBudgetOnline: boolean;
  isCheckoutOnline: boolean;
  allServicesOnline: boolean;
  budgetVersion: number;
  notifyBudgetUpdated: () => void;
  aiConsultantOpen: boolean;
  openAiConsultant: () => void;
  closeAiConsultant: () => void;
}

const AppStatusContext = createContext<AppStatusContextValue | null>(null);

export function AppStatusProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { notify } = useToast();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [demoMode, setDemoModeState] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [budgetVersion, setBudgetVersion] = useState(0);
  const [aiConsultantOpen, setAiConsultantOpen] = useState(false);
  const [wakeStartedAt, setWakeStartedAt] = useState<number>(() => Date.now());
  const [wakeElapsedSeconds, setWakeElapsedSeconds] = useState(0);

  const inFlightRef = useRef(false);
  const hadOfflineObservationRef = useRef(false);
  const notifiedReadyRef = useRef(false);

  const isBudgetOnline = health?.budget.status === "online";
  const isCheckoutOnline = health?.checkout.status === "online";
  const allServicesOnline = isBudgetOnline && isCheckoutOnline;
  const wakeTimedOut =
    hasCheckedOnce &&
    !allServicesOnline &&
    wakeElapsedSeconds >= WAKE_TIMEOUT_SECONDS;
  const isWakingUp = !allServicesOnline && !wakeTimedOut;

  const setDemoMode = useCallback((enabled: boolean) => {
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

  const refreshHealth = useCallback(
    async (options?: { wake?: boolean }) => {
      if (inFlightRef.current) return null;
      inFlightRef.current = true;
      setIsChecking(true);
      try {
        const url = options?.wake ? "/api/health?wake=1" : "/api/health";
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as HealthResponse;
        setHealth(data);
        setHasCheckedOnce(true);

        const bothUp =
          data.budget.status === "online" && data.checkout.status === "online";

        if (!bothUp) {
          hadOfflineObservationRef.current = true;
          notifiedReadyRef.current = false;
        } else if (
          hadOfflineObservationRef.current &&
          !notifiedReadyRef.current
        ) {
          notifiedReadyRef.current = true;
          setBudgetVersion((prev) => prev + 1);
          if (pathname !== "/") {
            notify({
              tone: "success",
              title: "Servidores prontos",
              description:
                "Os dois microsserviços iniciaram e já estão conectados em tempo real.",
            });
          }
        }

        return data;
      } catch {
        setHasCheckedOnce(true);
        hadOfflineObservationRef.current = true;
        return null;
      } finally {
        inFlightRef.current = false;
        setIsChecking(false);
      }
    },
    [notify, pathname],
  );

  const restartWakeup = useCallback(() => {
    setWakeStartedAt(Date.now());
    setWakeElapsedSeconds(0);
    void refreshHealth({ wake: true });
  }, [refreshHealth]);

  // Cronômetro em segundos enquanto os servidores sob demanda estão acordando
  useEffect(() => {
    if (allServicesOnline) return undefined;
    const tick = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - wakeStartedAt) / 1000);
      setWakeElapsedSeconds(elapsed);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [allServicesOnline, wakeStartedAt]);

  // Acorda os servidores IMEDIATAMENTE já na Landing Page (/) e faz polling inteligente:
  // - Enquanto algum serviço está iniciando (< 120s): checa a cada 5s (inclusive na landing!)
  // - Quando ambos estão online fora da landing: mantém checagem leve a cada 30s
  // - Na landing, assim que ambos ficarem online, para o polling para economizar recursos
  useEffect(() => {
    if (!hasCheckedOnce) {
      void refreshHealth({ wake: true });
    }

    if (allServicesOnline) {
      if (pathname === "/") return undefined;
      const steady = window.setInterval(() => {
        void refreshHealth();
      }, STEADY_POLL_INTERVAL_MS);
      return () => window.clearInterval(steady);
    }

    if (wakeTimedOut) return undefined;

    const wakeInterval = window.setInterval(() => {
      void refreshHealth({ wake: true });
    }, WAKE_POLL_INTERVAL_MS);

    return () => window.clearInterval(wakeInterval);
  }, [allServicesOnline, hasCheckedOnce, pathname, refreshHealth, wakeTimedOut]);

  const value = useMemo(
    () => ({
      health,
      hasCheckedOnce,
      isChecking,
      isWakingUp,
      wakeTimedOut,
      wakeElapsedSeconds,
      demoMode,
      setDemoMode,
      hideBalances,
      toggleHideBalances,
      refreshHealth,
      restartWakeup,
      isBudgetOnline,
      isCheckoutOnline,
      allServicesOnline,
      budgetVersion,
      notifyBudgetUpdated,
      aiConsultantOpen,
      openAiConsultant,
      closeAiConsultant,
    }),
    [
      health,
      hasCheckedOnce,
      isChecking,
      isWakingUp,
      wakeTimedOut,
      wakeElapsedSeconds,
      demoMode,
      setDemoMode,
      hideBalances,
      toggleHideBalances,
      refreshHealth,
      restartWakeup,
      isBudgetOnline,
      isCheckoutOnline,
      allServicesOnline,
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
