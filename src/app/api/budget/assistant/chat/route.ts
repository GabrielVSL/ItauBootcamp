import { NextRequest, NextResponse } from "next/server";
import type { AssistantResponse, ChatRequest } from "@/types/budget";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "JSON inválido",
      message: "Envie { message, generateAudio } no corpo da requisição.",
      details: [],
      service: "budget",
    });
  }

  const result = await proxyJsonRequest<AssistantResponse>(
    "budget",
    "/api/v1/assistant/chat",
    {
      method: "POST",
      body,
      timeoutMs: 35000,
    },
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
