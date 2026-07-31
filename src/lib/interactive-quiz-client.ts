import type { SalonInteractiveQuizConfig } from "@/types/salon";

export type InteractiveQuizAnswerValue = string | number | string[];

export type InteractiveQuizSubmissionPayload = {
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: Record<string, InteractiveQuizAnswerValue>;
  consentAccepted: boolean;
  consentText: string;
  sourceUrl?: string;
  honeypot?: string;
};

export async function submitInteractiveQuiz(
  slug: string,
  payload: InteractiveQuizSubmissionPayload,
  config: SalonInteractiveQuizConfig,
) {
  const endpoint = config.submitEndpoint?.trim() || `/api/public/quiz/${encodeURIComponent(slug)}/submit`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "Nao foi possivel enviar suas respostas.");
  }
  return body as { ok: true };
}
