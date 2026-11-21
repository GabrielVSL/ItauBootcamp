import type { Metadata } from "next";
import { DM_Sans, Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppStatusProvider } from "@/context/AppStatusContext";
import { ToastProvider } from "@/context/ToastContext";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  title: "Bootcamp Itaú • Java & IA",
  description:
    "Portal Super-App (Next.js + BFF) integrando os microsserviços checkout-service e finance-ai-service — Bootcamp Java & IA (Itaú + DIO).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${dmSans.variable} ${inter.variable} ${jakarta.variable}`}
    >
      <body className="min-h-screen bg-[#120f17] text-[#101828] selection:bg-[#FF6200]/25 selection:text-white">
        <ToastProvider>
          <AppStatusProvider>{children}</AppStatusProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
