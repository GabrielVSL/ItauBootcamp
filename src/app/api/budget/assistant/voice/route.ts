import { NextRequest, NextResponse } from "next/server";
import type { AssistantResponse } from "@/types/budget";
import { jsonErrorResponse, proxyMultipartRequest } from "@/lib/bff-proxy";
import {
  RATE_LIMITS,
  attachSessionCookie,
  checkRateLimit,
  rateLimitErrorResponse,
  resolveSessionContext,
  verifySameOrigin,
} from "@/lib/security";
import { MAX_VOICE_BYTES, validateVoiceUpload } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const originError = verifySameOrigin(request, "budget");
  if (originError) return originError;

  const limit = checkRateLimit(request, RATE_LIMITS.aiVoice);
  if (!limit.allowed) {
    return rateLimitErrorResponse("budget", limit.retryAfterSeconds);
  }

  // Checagem antecipada do Content-Length antes de carregar o multipart em memória
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredSize = Number(contentLengthHeader);
    if (
      Number.isFinite(declaredSize) &&
      declaredSize > MAX_VOICE_BYTES + 64 * 1024
    ) {
      return jsonErrorResponse({
        status: 413,
        title: "Áudio muito grande",
        message: "O arquivo de áudio excede o limite máximo de 5 MB.",
        details: [],
        service: "budget",
      });
    }
  }

  const { searchParams } = new URL(request.url);
  const generateAudio = searchParams.get("generateAudio") === "true";

  let incomingForm: FormData;
  try {
    incomingForm = await request.formData();
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "Multipart inválido",
      message:
        'Envie um formulário multipart/form-data contendo o campo "audio".',
      details: [],
      service: "budget",
    });
  }

  const validated = validateVoiceUpload(incomingForm.get("audio"));
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const forwardForm = new FormData();
  forwardForm.append("audio", validated.data.blob, validated.data.safeFilename);

  const result = await proxyMultipartRequest<AssistantResponse>(
    "budget",
    `/api/v1/assistant/voice?generateAudio=${generateAudio}`,
    forwardForm,
    45000,
    session.sessionId,
  );

  if (!result.ok) {
    return attachSessionCookie(jsonErrorResponse(result.error), session);
  }

  return attachSessionCookie(
    NextResponse.json(result.data, { status: result.status }),
    session,
  );
}
