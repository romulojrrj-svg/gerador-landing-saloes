import type { SalonInteractiveQuizConfig } from "@/types/salon";

export type InteractiveQuizAnswerValue = string | number | string[];

export type InteractiveQuizSubmissionPayload = {
  submissionId: string;
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: Record<string, InteractiveQuizAnswerValue>;
  consentAccepted: boolean;
  consentText: string;
  sourceUrl?: string;
  honeypot?: string;
};

export type InteractiveQuizSubmissionResult = {
  ok: true;
  saved?: boolean;
  emailSent?: boolean;
  duplicate?: boolean;
};

export async function submitInteractiveQuiz(
  slug: string,
  payload: InteractiveQuizSubmissionPayload,
  config: SalonInteractiveQuizConfig,
) {
  const workerBaseUrl = process.env.NEXT_PUBLIC_QUIZ_API_URL?.trim().replace(/\/$/, "");
  const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  if (isStaticExport && !workerBaseUrl) {
    throw new Error("O envio do teste ainda nao foi configurado para este site.");
  }
  const endpoint = workerBaseUrl
    ? `${workerBaseUrl}/quiz-submit`
    : config.submitEndpoint?.trim() || `/api/public/quiz/${encodeURIComponent(slug)}/submit`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    // The Worker resolves the published quiz from this slug. The Vercel
    // fallback receives the same harmless field and keeps its route contract.
    body: JSON.stringify({ ...payload, slug }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "Nao foi possivel enviar suas respostas.");
  }
  return body as InteractiveQuizSubmissionResult;
}
