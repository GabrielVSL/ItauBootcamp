import React from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFloatingCta } from "@/components/landing/LandingFloatingCta";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingEditorialIntro } from "@/components/landing/LandingEditorialIntro";
import { LandingReposShowcase } from "@/components/landing/LandingReposShowcase";
import { LandingBffConclusion } from "@/components/landing/LandingBffConclusion";
import { LandingFooter } from "@/components/landing/LandingFooter";

export function LandingPage() {
  return (
    <div className="font-landing min-h-screen bg-white text-[#141413] selection:bg-[#FF6200]/15 selection:text-[#141413]">
      <LandingNavbar />
      <LandingFloatingCta />
      <LandingHero />

      {/* Corpo editorial sobre grid arquitetônico vertical sutil */}
      <div className="relative bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mx-auto hidden max-w-5xl grid-cols-3 border-x border-[#F0EFEA] sm:grid"
        >
          <div className="border-r border-[#F0EFEA]" />
          <div className="border-r border-[#F0EFEA]" />
          <div />
        </div>

        <main className="relative z-10">
          <LandingEditorialIntro />
          <LandingReposShowcase />
          <LandingBffConclusion />
        </main>
      </div>

      <LandingFooter />
    </div>
  );
}
