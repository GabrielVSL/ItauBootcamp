import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppStatusProvider } from "@/context/AppStatusContext";
import { ToastProvider } from "@/context/ToastContext";
import { Header } from "@/components/layout/Header";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Super-App • Bootcamp Itaú + DIO | Shop GoF & Smart Budget AI",
  description:
    "Portal Super-App (Next.js + BFF) unificando Smart Budget Spring AI e Checkout API Design Patterns — Projeto de Portfólio do Bootcamp Java & IA (Itaú + DIO).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#FBF9F6] text-[#101828] selection:bg-[#FF6200]/20 selection:text-[#101828]">
        <ToastProvider>
          <AppStatusProvider>
            <Header />
            <DemoBanner />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-7 sm:px-6 lg:px-8 lg:pb-12">
              {children}
            </main>
            <Footer />
          </AppStatusProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
