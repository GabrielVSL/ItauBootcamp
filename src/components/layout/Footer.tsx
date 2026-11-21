import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#EAE9E4] bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-[12.5px] text-[#7A7872] sm:flex-row sm:px-6 lg:px-8">
        <p>Projeto pessoal de portfólio • Não oficial do Itaú Unibanco S.A.</p>
        <div className="flex items-center gap-5 font-medium text-[#57554F]">
          <Link href="/" className="transition hover:text-[#141413]">
            Apresentação
          </Link>
          <Link href="/architecture" className="transition hover:text-[#141413]">
            Arquitetura
          </Link>
        </div>
      </div>
    </footer>
  );
}
