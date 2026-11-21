import React from "react";
import { Header } from "@/components/layout/Header";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { Footer } from "@/components/layout/Footer";
import { FloatingAiConsultant } from "@/components/layout/FloatingAiConsultant";

export default function AppShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-landing flex min-h-screen flex-col bg-white text-[#141413] selection:bg-[#FF6200]/15 selection:text-[#141413]">
      <Header />
      <DemoBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-16">
        {children}
      </main>
      <Footer />
      <FloatingAiConsultant />
    </div>
  );
}
