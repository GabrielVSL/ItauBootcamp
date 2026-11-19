import { NextRequest, NextResponse } from "next/server";
import type { AssistantResponse } from "@/types/budget";
import { jsonErrorResponse, proxyMultipartRequest } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const generateAudio = searchParams.get("generateAudio") === "true";

  let incomingForm: FormData;
  try {
    incomingForm = await request.formData();
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "Multipart inválido",
      message: 'Envie um formulário multipart/form-data contendo o campo "audio".',
      details: [],
      service: "budget",
    });
  }

  const audio = incomingForm.get("audio");
  if (!audio) {
    return jsonErrorResponse({
      status: 400,
      title: "Áudio obrigatório",
      message: 'O campo "audio" não foi encontrado no envio.',
      details: [],
      service: "budget",
    });
  }

  const forwardForm = new FormData();
  if (audio instanceof Blob) {
    const filename =
      "name" in audio && typeof audio.name === "string" && audio.name
        ? audio.name
        : "gravacao.webm";
    forwardForm.append("audio", audio, filename);
  } else {
    forwardForm.append("audio", audio);
  }

  const result = await proxyMultipartRequest<AssistantResponse>(
    "budget",
    `/api/v1/assistant/voice?generateAudio=${generateAudio}`,
    forwardForm,
    45000,
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
