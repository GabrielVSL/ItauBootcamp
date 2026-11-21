import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArchitectureView } from "@/components/architecture/ArchitectureView";

export default function ArchitecturePage() {
  return (
    <div className="font-landing min-h-screen bg-white text-[#141413] selection:bg-[#FF6200]/15 selection:text-[#141413]">
      <header className="sticky top-0 z-40 border-b border-[#EAE9E4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <Image
              src="/images/itau-logo.png"
              alt="Logo Itaú"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#141413]">
              Arquitetura
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E3DD] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Apresentação</span>
            </Link>
            <Link
              href="/app"
              className="group inline-flex items-center gap-1.5 rounded-full bg-[#FF6200] px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-[#E05200]"
            >
              Acessar Aplicação
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <ArchitectureView />
      </main>
    </div>
  );
}
