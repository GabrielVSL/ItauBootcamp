"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Mic,
  Send,
  Square,
  Trash2,
  Upload,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { AssistantResponse, ChatHistoryItem } from "@/types/budget";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { useToast } from "@/context/ToastContext";
import { simulateDemoAssistant } from "@/lib/demo-store";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import { PedraMark } from "@/components/brand/ItauBootcampLogo";
import {
  SafeMarkdown,
  stripMarkdownForSpeech,
} from "@/components/ui/SafeMarkdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  transcribedText?: string | null;
  audioBase64?: string | null;
  spokenViaBrowser?: boolean;
  timestamp: string;
  viaVoice?: boolean;
}

const CHAT_STORAGE_KEY = "itau_ai_chat_history_v1";
const CHAT_SYNC_EVENT = "itau:chat-history-updated";
const MAX_STORED_MESSAGES = 60;

function createWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    text: "Olá! Sou seu Consultor Financeiro IA. Você pode registrar receitas e despesas por texto ou voz, consultar seu saldo ou pedir um plano para metas como comprar uma casa, um carro ou montar sua reserva.",
    timestamp: new Date().toISOString(),
  };
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [createWelcomeMessage()];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [createWelcomeMessage()];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createWelcomeMessage()];
    }
    const valid = parsed.filter(
      (item): item is ChatMessage =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as ChatMessage).id === "string" &&
        ((item as ChatMessage).role === "user" ||
          (item as ChatMessage).role === "assistant") &&
        typeof (item as ChatMessage).text === "string" &&
        typeof (item as ChatMessage).timestamp === "string",
    );
    return valid.length > 0 ? valid.slice(-MAX_STORED_MESSAGES) : [createWelcomeMessage()];
  } catch {
    return [createWelcomeMessage()];
  }
}

function saveStoredMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  try {
    // Não persiste audioBase64 pesado no localStorage
    const light = messages.slice(-MAX_STORED_MESSAGES).map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      transcribedText: m.transcribedText ?? null,
      timestamp: m.timestamp,
      viaVoice: Boolean(m.viaVoice),
    }));
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(light));
    window.dispatchEvent(new Event(CHAT_SYNC_EVENT));
  } catch {
    // Ignora caso localStorage esteja indisponível ou cheio
  }
}

interface AiConsultantPanelProps {
  onAssistantCompleted?: () => Promise<void> | void;
  onClose?: () => void;
  compact?: boolean;
}

function speakWithBrowser(text: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }
  try {
    const cleanText = stripMarkdownForSpeech(text);
    if (!cleanText) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "pt-BR";
    utterance.rate = 1.03;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

const SAFE_AUDIO_DATA_URI =
  /^data:audio\/(?:mpeg|mp3|wav|ogg|webm);base64,[A-Za-z0-9+/=\s]+$/;
const SAFE_RAW_BASE64 = /^[A-Za-z0-9+/=\s]+$/;

function toSafeAudioDataUri(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) {
    return SAFE_AUDIO_DATA_URI.test(trimmed) ? trimmed : null;
  }
  return SAFE_RAW_BASE64.test(trimmed)
    ? `data:audio/mp3;base64,${trimmed}`
    : null;
}

export function AiConsultantPanel({
  onAssistantCompleted,
  onClose,
  compact = false,
}: AiConsultantPanelProps) {
  const { demoMode, notifyBudgetUpdated } = useAppStatus();
  const { notify } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createWelcomeMessage(),
  ]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [generateAudio, setGenerateAudio] = useState(false);
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [chatError, setChatError] = useState<NormalizedApiError | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Carrega histórico salvo após hidratação e sincroniza entre painel flutuante e página /budget
  useEffect(() => {
    setMessages(loadStoredMessages());
    setHydrated(true);

    const handleSync = () => {
      setMessages(loadStoredMessages());
    };
    window.addEventListener(CHAT_SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(CHAT_SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function updateMessages(updater: (prev: ChatMessage[]) => ChatMessage[]) {
    setMessages((prev) => {
      const next = updater(prev).slice(-MAX_STORED_MESSAGES);
      if (hydrated) {
        saveStoredMessages(next);
      }
      return next;
    });
  }

  function handleClearHistory() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const fresh = [createWelcomeMessage()];
    setMessages(fresh);
    saveStoredMessages(fresh);
    setChatError(null);
  }

  function buildRecentHistory(currentMessages: ChatMessage[]): ChatHistoryItem[] {
    return currentMessages
      .filter((m) => m.id !== "welcome")
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.text.slice(0, 600),
      }));
  }

  function appendAssistantReply(reply: AssistantResponse, idPrefix: string) {
    let spokenViaBrowser = false;
    if (generateAudio && !reply.audioBase64) {
      spokenViaBrowser = speakWithBrowser(reply.response);
    }

    updateMessages((prev) => [
      ...prev,
      {
        id: `${idPrefix}-${Date.now()}`,
        role: "assistant",
        text: reply.response,
        audioBase64: reply.audioBase64,
        spokenViaBrowser,
        timestamp: reply.timestamp || new Date().toISOString(),
      },
    ]);
  }

  async function sendTextMessage(textToSend: string) {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    const historySnapshot = buildRecentHistory(messages);
    setChatError(null);
    setInput("");

    updateMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: new Date().toISOString(),
      },
    ]);
    setSending(true);

    try {
      let reply: AssistantResponse;

      if (demoMode) {
        await new Promise((r) => setTimeout(r, 420));
        reply = simulateDemoAssistant(trimmed);
      } else {
        const res = await fetch("/api/budget/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            generateAudio,
            history: historySnapshot,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          const normalized = data as NormalizedApiError;
          setChatError(normalized);
          notify({
            tone: normalized.status === 502 ? "warning" : "error",
            title: normalized.title,
            description: normalized.message,
          });
          return;
        }
        reply = data as AssistantResponse;
      }

      appendAssistantReply(reply, "ai");
      notifyBudgetUpdated();
      await onAssistantCompleted?.();
    } catch {
      setChatError({
        status: 503,
        title: "Erro ao falar com o Consultor IA",
        message: "Não foi possível completar a requisição ao assistente.",
        details: [],
        service: "budget",
      });
    } finally {
      setSending(false);
    }
  }

  async function sendVoiceBlob(blob: Blob, filename: string) {
    setChatError(null);
    const placeholderId = `voice-user-${Date.now()}`;
    updateMessages((prev) => [
      ...prev,
      {
        id: placeholderId,
        role: "user",
        text: `Mensagem de voz enviada (${filename})`,
        timestamp: new Date().toISOString(),
        viaVoice: true,
      },
    ]);
    setSending(true);

    try {
      let reply: AssistantResponse;

      if (demoMode) {
        await new Promise((r) => setTimeout(r, 550));
        reply = {
          transcribedText: "Como está meu saldo atual? (transcrição demo)",
          ...simulateDemoAssistant("Como está meu saldo?"),
        };
      } else {
        const formData = new FormData();
        formData.append("audio", blob, filename);

        const res = await fetch(
          `/api/budget/assistant/voice?generateAudio=${generateAudio}`,
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();
        if (!res.ok) {
          const normalized = data as NormalizedApiError;
          setChatError(normalized);
          notify({
            tone: normalized.status === 502 ? "warning" : "error",
            title: normalized.title,
            description: normalized.message,
          });
          return;
        }
        reply = data as AssistantResponse;
      }

      if (reply.transcribedText) {
        updateMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? {
                  ...m,
                  text: reply.transcribedText || m.text,
                  transcribedText: reply.transcribedText,
                }
              : m,
          ),
        );
      }

      appendAssistantReply(reply, "ai-voice");
      notifyBudgetUpdated();
      await onAssistantCompleted?.();
    } catch {
      setChatError({
        status: 503,
        title: "Falha no envio de áudio",
        message: "Não foi possível enviar o áudio para transcrição Whisper.",
        details: [],
        service: "budget",
      });
    } finally {
      setSending(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      notify({
        tone: "warning",
        title: "Microfone indisponível",
        description:
          "Seu navegador não suporta gravação via MediaRecorder. Envie um arquivo .mp3 ou .wav pelo botão de upload.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        if (blob.size > 0) {
          void sendVoiceBlob(blob, "gravacao-microfone.webm");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      notify({
        tone: "error",
        title: "Permissão de microfone negada",
        description:
          "Autorize o uso do microfone no navegador ou faça upload de um áudio.",
      });
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void sendVoiceBlob(file, file.name);
    e.target.value = "";
  }

  const hasConversation = messages.some((m) => m.id !== "welcome");

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-[24px] border border-[#EAE9E4] bg-white ${
        compact ? "h-[min(600px,calc(100svh-5.5rem))]" : "h-[660px]"
      }`}
    >
      {/* Cabeçalho Obsidian limpo */}
      <div className="relative overflow-hidden bg-[#120F17] px-5 py-4 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FF6200]/25 blur-2xl" />
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <PedraMark className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <h2 className="truncate text-[14.5px] font-semibold tracking-[-0.015em]">
                Consultor IA
              </h2>
              <p className="truncate text-[11px] text-white/55">
                Lançamentos, saldo e planos por texto ou voz
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setGenerateAudio((prev) => {
                  if (prev && typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  return !prev;
                });
              }}
              title={
                generateAudio
                  ? "Leitura em voz alta ativada: clique para silenciar as respostas da IA"
                  : "Ativar leitura em voz alta: a IA lerá as respostas automaticamente"
              }
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition ${
                generateAudio
                  ? "border-[#FF8A3D] bg-[#FF6200] text-white"
                  : "border-white/15 bg-white/[0.08] text-white/80 hover:bg-white/15"
              }`}
            >
              {generateAudio ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              {generateAudio ? "Leitura: ON" : "Leitura: OFF"}
            </button>

            {hasConversation && (
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={sending}
                title="Limpar histórico desta conversa"
                aria-label="Limpar histórico da conversa"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar Consultor IA"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#FBF9F6] p-4">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
                  isUser
                    ? "bg-[#FF6200] text-white"
                    : "bg-[#101828] text-white"
                }`}
              >
                {isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4 text-[#FF8A3D]" />
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? "rounded-tr-sm bg-[#101828] text-white"
                    : "rounded-tl-sm border border-[#EAE3DB] bg-white text-[#101828]"
                }`}
              >
                {msg.viaVoice && (
                  <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-orange-200">
                    <Mic className="h-2.5 w-2.5" />
                    Mensagem por voz
                  </span>
                )}

                {isUser ? (
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                ) : (
                  <SafeMarkdown content={msg.text} />
                )}

                {msg.audioBase64 &&
                  (() => {
                    const safeSrc = toSafeAudioDataUri(msg.audioBase64);
                    if (!safeSrc) return null;
                    return (
                      <div className="mt-3 rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] p-2">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#667085]">
                          Resposta em áudio
                        </p>
                        <audio controls className="h-8 w-full" src={safeSrc} />
                      </div>
                    );
                  })()}

                {!msg.audioBase64 && msg.spokenViaBrowser && (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl bg-[#FFF4EC] px-2.5 py-1.5 text-[10px] font-semibold text-[#C84A00]">
                    <span className="inline-flex items-center gap-1">
                      <Volume2 className="h-3 w-3" />
                      Lido em voz alta
                    </span>
                    <button
                      type="button"
                      onClick={() => speakWithBrowser(msg.text)}
                      className="underline hover:text-[#101828]"
                    >
                      Ouvir de novo
                    </button>
                  </div>
                )}

                <span
                  className={`mt-1.5 block text-[10px] ${
                    isUser ? "text-slate-400" : "text-[#98A2B3]"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {sending && (
          <div className="flex items-center gap-2.5 text-xs text-[#667085]">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#101828] text-white">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF6200]" />
            </div>
            <span className="rounded-2xl border border-[#EAE3DB] bg-white px-4 py-2.5 shadow-2xs">
              Consultor IA analisando suas finanças...
            </span>
          </div>
        )}

        {chatError && (
          <ApiErrorBanner
            error={chatError}
            onDismiss={() => setChatError(null)}
          />
        )}

        <div ref={listEndRef} />
      </div>

      {/* Barra de envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void sendTextMessage(input);
        }}
        className="border-t border-[#EAE3DB] bg-white p-3.5"
      >
        {recording && (
          <div className="mb-2.5 flex items-center justify-between rounded-2xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-rose-600" />
              Gravando áudio ({recordingSeconds}s)...
            </span>
            <button
              type="button"
              onClick={() => void toggleRecording()}
              className="rounded-full bg-rose-600 px-3 py-1 text-[11px] text-white hover:bg-rose-700"
            >
              Parar e Enviar
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/webm,audio/mp3,audio/mpeg,audio/wav,audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => void toggleRecording()}
            disabled={sending}
            title={
              recording
                ? "Parar gravação e enviar"
                : "Gravar áudio pelo microfone"
            }
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
              recording
                ? "border-rose-500 bg-rose-600 text-white"
                : "border-[#EAE3DB] bg-[#FBF9F6] text-[#344054] hover:border-[#FF6200] hover:text-[#FF6200]"
            }`}
            aria-label={recording ? "Parar gravação" : "Gravar voz"}
          >
            {recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || recording}
            title="Enviar arquivo de áudio (.mp3, .wav, .webm)"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#EAE3DB] bg-[#FBF9F6] text-[#525D73] transition hover:border-[#101828] hover:text-[#101828] disabled:opacity-50"
            aria-label="Enviar arquivo de áudio"
          >
            <Upload className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending || recording}
            placeholder="Ex: Quero juntar para uma casa, monte um plano..."
            className="h-10 flex-1 rounded-full border border-[#EAE3DB] bg-[#FBF9F6] px-4 text-xs text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!input.trim() || sending || recording}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#FF6200] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E05200] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </form>
    </section>
  );
}
