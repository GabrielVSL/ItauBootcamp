"use client";

import React from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Database,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Layers,
  Mic,
  RefreshCw,
  Server,
  ShieldCheck,
  Workflow,
  XCircle,
} from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";
import { GITHUB_BUDGET_REPO, GITHUB_CHECKOUT_REPO } from "@/lib/env";
import { PedraMark } from "@/components/brand/ItauBootcampLogo";

const DECISIONS = [
  {
    icon: Layers,
    title: "Next.js como BFF / API Gateway",
    description:
      "Todas as chamadas do navegador passam pelos Route Handlers (/api/budget/*, /api/checkout/* e /api/bff/*), eliminando problemas de CORS nos microsserviços Java e isolando URLs internas via env vars.",
    tags: ["App Router", "Zero CORS", "Env Config"],
  },
  {
    icon: ShieldCheck,
    title: "Normalização de Erros Multilíngue (EN/PT)",
    description:
      "Smart Budget retorna ApiErrorResponse em inglês ({ error, message, details }) enquanto a Checkout API retorna em português ({ erro, mensagem, detalhes }). O BFF unifica ambos em NormalizedApiError.",
    tags: ["HTTP 400/422", "Tratamento 502", "Contrato Único"],
  },
  {
    icon: Workflow,
    title: "Orquestração Cross-Service com Falha Parcial",
    description:
      "POST /api/bff/checkout-with-budget executa o checkout e, ao receber 201 Created, lança a compra automaticamente no Smart Budget. Se o segundo serviço estiver indisponível, o pedido é preservado com aviso transparente.",
    tags: ["Orquestração BFF", "Resiliência", "UX Transparente"],
  },
  {
    icon: Database,
    title: "Database per Service (H2 + Neon PostgreSQL)",
    description:
      "Cada microsserviço Java é dono exclusivo do seu banco: H2 em memória localmente e PostgreSQL serverless no Neon em produção — zero acoplamento de schema.",
    tags: ["Neon Serverless", "H2 Local", "Desacoplamento"],
  },
  {
    icon: GitBranch,
    title: "Design Patterns GoF & SOLID na Checkout API",
    description:
      "Facade centraliza o checkout, Strategy resolve o cálculo de frete (PAC/SEDEX), Chain of Responsibility valida Estoque → Pagamento → Cupom, e Singleton gerencia configurações compartilhadas.",
    tags: ["Facade", "Strategy", "Chain of Responsibility", "Singleton"],
  },
  {
    icon: Mic,
    title: "Spring AI Tool Calling + STT + Voz",
    description:
      "O Consultor Financeiro entende linguagem natural em texto ou áudio gravado no navegador (MediaRecorder), invoca Tools Java direto no banco e suporta resposta falada (OpenAI TTS ou Web Speech API).",
    tags: ["Spring AI", "Tool Calling", "Whisper", "Voz"],
  },
];

export function ArchitectureView() {
  const { health, isChecking, refreshHealth } = useAppStatus();

  const services = [
    {
      key: "budget" as const,
      title: "Smart Budget Spring AI",
      subtitle: "Gestão Financeira + Consultor IA (Texto & Voz)",
      portHint: "Padrão local: :8080",
      repo: GITHUB_BUDGET_REPO,
      dbLabel: "Neon DB #1 (Transações)",
      health: health?.budget,
      endpoints: [
        "GET /api/v1/transactions?category=&type=",
        "POST /api/v1/transactions",
        "GET /api/v1/transactions/summary",
        "POST /api/v1/assistant/chat",
        "POST /api/v1/assistant/voice?generateAudio=",
      ],
    },
    {
      key: "checkout" as const,
      title: "Checkout API Design Patterns",
      subtitle: "E-commerce GoF (Facade, Strategy, Chain, Singleton)",
      portHint: "Padrão local: :8081",
      repo: GITHUB_CHECKOUT_REPO,
      dbLabel: "Neon DB #2 (Pedidos)",
      health: health?.checkout,
      endpoints: [
        "POST /api/v1/checkout",
        "GET /api/v1/checkout/pedidos",
        "GET /api/v1/checkout/pedidos/{id}",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cabeçalho Dark Editorial */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#0D1528] p-6 text-white shadow-xl shadow-[#0D1528]/15 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#FF6200]/28 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FF6200]/20 px-3 py-1 text-xs font-extrabold text-[#FF9A44]">
              <Award className="h-3.5 w-3.5" />
              Vitrine Técnica • Bootcamp Java &amp; IA — Itaú + DIO
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Arquitetura de Microsserviços &amp; BFF
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
              Visão técnica de como este portal unifica dois backends Java 21 /
              Spring Boot 3.4 independentes em um Super-App financeiro, mantendo
              fronteiras limpas, contratos tipados e bancos isolados no Neon.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            disabled={isChecking}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#FF6200] px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#FF6200]/30 transition hover:bg-[#E05200] disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`}
            />
            Verificar Saúde Agora
          </button>
        </div>
      </section>

      {/* Diagrama Visual de Arquitetura */}
      <section className="voxel-card p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold text-[#101828]">
              Topologia do Sistema
            </h2>
            <p className="text-xs text-[#667085]">
              Fluxo completo do navegador até os bancos isolados no Neon
              PostgreSQL
            </p>
          </div>
          <span className="rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold text-[#E05200]">
            Database per Service
          </span>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Camada 1: Next.js Frontend + BFF */}
          <div className="w-full max-w-3xl rounded-3xl border-2 border-[#FF6200] bg-[#FFFBF8] p-5 shadow-md shadow-[#FF6200]/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <PedraMark className="h-10 w-10 shrink-0" />
                <div>
                  <h3 className="font-display text-sm font-extrabold text-[#101828]">
                    Next.js App Router — Frontend + BFF Gateway
                  </h3>
                  <p className="text-xs text-[#667085]">
                    React 19 • TypeScript • Tailwind CSS • Route Handlers
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#101828] px-3 py-1 text-[11px] font-bold text-white">
                Este Repositório
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-3">
              <div className="rounded-2xl border border-[#EAE3DB] bg-white p-3 font-mono text-[#101828]">
                /api/budget/*
                <span className="mt-0.5 block font-sans text-[11px] text-[#667085]">
                  Proxy + STT/TTS + 502 guard
                </span>
              </div>
              <div className="rounded-2xl border border-[#F5D6BE] bg-[#FFF4EC] p-3 font-mono text-[#C84A00]">
                /api/bff/checkout-with-budget
                <span className="mt-0.5 block font-sans text-[11px] text-[#9A3D00]">
                  Orquestração entre serviços
                </span>
              </div>
              <div className="rounded-2xl border border-[#EAE3DB] bg-white p-3 font-mono text-[#101828]">
                /api/checkout/*
                <span className="mt-0.5 block font-sans text-[11px] text-[#667085]">
                  Proxy + Normalização PT-BR
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12 text-[#98A2B3]">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-[#101828]">
                BUDGET_API_URL
              </span>
              <ArrowDown className="h-5 w-5 text-[#FF6200]" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-bold text-[#101828]">
                CHECKOUT_API_URL
              </span>
              <ArrowDown className="h-5 w-5 text-[#FF6200]" />
            </div>
          </div>

          {/* Camada 2: Os 2 Microsserviços + seus 2 bancos Neon */}
          <div className="grid w-full max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-3xl border border-[#EAE3DB] bg-[#FBF9F6] p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0D1528] text-[#FF8A3D]">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-extrabold text-[#101828]">
                      Smart Budget Spring AI
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Java 21 • Spring Boot 3.4 • Spring AI
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    health?.budget.status === "online"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {health?.budget.status === "online" ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Tool Calling
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Whisper STT
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  TTS / Voz
                </span>
              </div>

              <div className="mt-auto flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                <Database className="h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <strong className="block">Neon PostgreSQL #1 (Prod)</strong>
                  <span className="text-[11px] text-emerald-800">
                    Banco isolado de transações financeiras (H2 local)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-[#EAE3DB] bg-[#FBF9F6] p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FF6200] text-white">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-extrabold text-[#101828]">
                      Checkout API Design Patterns
                    </h3>
                    <p className="text-xs text-[#667085]">
                      Java 21 • Spring Boot 3.4 • GoF + SOLID
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    health?.checkout.status === "online"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {health?.checkout.status === "online" ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Facade
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Strategy (Frete)
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Chain (3 Elos)
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[#344054]">
                  Singleton
                </span>
              </div>

              <div className="mt-auto flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-950">
                <Database className="h-4 w-4 shrink-0 text-emerald-700" />
                <div>
                  <strong className="block">Neon PostgreSQL #2 (Prod)</strong>
                  <span className="text-[11px] text-emerald-800">
                    Banco isolado de pedidos e itens (H2 local)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monitor de Saúde ao Vivo + Links GitHub e Swagger */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#FF6200]" />
            <h2 className="font-display text-lg font-extrabold text-[#101828]">
              Monitor de Saúde ao Vivo &amp; Repositórios
            </h2>
          </div>
          {health?.checkedAt && (
            <span className="text-xs text-[#667085]">
              Última checagem:{" "}
              {new Date(health.checkedAt).toLocaleTimeString("pt-BR")}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {services.map((svc) => {
            const online = svc.health?.status === "online";
            return (
              <div
                key={svc.key}
                className="voxel-card flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-extrabold text-[#101828]">
                        {svc.title}
                      </h3>
                      <p className="text-xs text-[#667085]">{svc.subtitle}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                        online
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                      }`}
                    >
                      {online ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {online ? "Online" : "Offline"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-[#FBF9F6] p-3.5 text-xs">
                    <div>
                      <span className="block text-[11px] text-[#667085]">
                        Roteamento
                      </span>
                      <code className="mt-0.5 block break-all font-mono font-semibold text-[#101828]">
                        Proxy via BFF ({svc.portHint})
                      </code>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#667085]">
                        Latência / Persistência
                      </span>
                      <span className="mt-0.5 block font-semibold text-[#101828]">
                        {svc.health?.latencyMs != null
                          ? `${svc.health.latencyMs} ms`
                          : "Sem resposta"}{" "}
                        • {svc.dbLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                      Contratos consumidos pelo BFF
                    </p>
                    <ul className="mt-2 space-y-1">
                      {svc.endpoints.map((ep) => (
                        <li
                          key={ep}
                          className="flex items-center gap-1.5 font-mono text-xs text-[#344054]"
                        >
                          <ArrowRight className="h-3 w-3 shrink-0 text-[#FF6200]" />
                          {ep}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-[#F2ECE6] pt-4 text-xs font-bold">
                  <a
                    href={svc.repo}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#101828] px-4 py-2 text-white transition hover:bg-[#FF6200]"
                  >
                    <Github className="h-3.5 w-3.5" />
                    GitHub do Microsserviço
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {svc.health?.swaggerUrl && (
                    <a
                      href={svc.health.swaggerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#F5D6BE] bg-[#FFF4EC] px-4 py-2 text-[#C84A00] transition hover:bg-[#FFEAD9]"
                    >
                      <FileCode2 className="h-3.5 w-3.5" />
                      Swagger UI
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cards de Decisões Técnicas */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-extrabold text-[#101828]">
          Decisões Técnicas &amp; Diferenciais de Portfólio
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DECISIONS.map(({ icon: Icon, title, description, tags }) => (
            <div
              key={title}
              className="voxel-card flex flex-col justify-between p-5"
            >
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#FF6200]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3.5 font-display text-sm font-extrabold text-[#101828]">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#525D73]">
                  {description}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#F4EFE9] px-2.5 py-0.5 text-[11px] font-semibold text-[#344054]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
