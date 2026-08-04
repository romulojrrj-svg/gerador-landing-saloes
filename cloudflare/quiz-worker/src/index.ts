import { buildBrevoMessage } from "./email.ts";
import {
  getWorkerSalon,
  isAllowedOrigin,
  isValidEmail,
  parseAllowedOrigins,
  validateSubmission,
} from "./validation.ts";
import type { ValidatedSubmission, WorkerEnv, WorkerSalon } from "./types.ts";

const MAX_PAYLOAD_BYTES = 50_000;

type EmailResult = { sent: boolean; messageId?: string; errorCode?: string };
type EmailNotificationStatus = "pending" | "sent" | "skipped" | "failed";
type EmailClaim = { available: boolean; claimed: boolean; status: EmailNotificationStatus | null };

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleRequest(request, env);
  },
};

export default worker;

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/quiz-submit") {
    return new Response("Not found", { status: 404 });
  }

  const origin = request.headers.get("Origin");
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS ?? "");
  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return response({ ok: false, error: "Origem nao autorizada." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return response({ ok: false, error: "Metodo nao permitido." }, 405, origin);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return response({ ok: false, error: "Conteudo invalido." }, 415, origin);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    return response({ ok: false, error: "Envio muito grande." }, 413, origin);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_PAYLOAD_BYTES) {
    return response({ ok: false, error: "Envio muito grande." }, 413, origin);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response({ ok: false, error: "Nao foi possivel validar o envio." }, 400, origin);
  }

  const slug = readSlug(payload);
  if (!slug) return response({ ok: false, error: "Nao foi possivel validar o envio." }, 400, origin);

  try {
    const salon = await fetchSalon(env, slug);
    if (!salon) {
      log("quiz_worker_salon_unavailable", { slug });
      return response({ ok: false, error: "Teste indisponivel." }, 404, origin);
    }

    const validated = validateSubmission(payload, salon);
    if (!validated.ok) {
      log("quiz_worker_validation_failed", { slug });
      return response({ ok: false, error: validated.message }, 400, origin);
    }

    const saved = await insertSubmission(env, salon, validated.submission);
    if (!saved.ok) {
      log("quiz_worker_insert_failed", { slug });
      return response({ ok: false, error: "Nao foi possivel salvar suas respostas." }, 503, origin);
    }

    const email = await notifyRecipient(env, salon, validated.submission);
    if (saved.duplicate) log("quiz_worker_duplicate", { slug });
    return response(
      { ok: true, saved: true, emailSent: email.sent, ...(saved.duplicate ? { duplicate: true } : {}) },
      saved.duplicate ? 200 : 201,
      origin,
    );
  } catch {
    log("quiz_worker_unexpected_failure", { slug });
    return response({ ok: false, error: "Nao foi possivel processar o envio." }, 503, origin);
  }
}

async function fetchSalon(env: WorkerEnv, slug: string) {
  const response = await supabaseFetch(
    env,
    `/rest/v1/salons?select=id,slug,name,status,updated_at,metadata&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  if (!response.ok) throw new Error("supabase_salon_read_failed");
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length ? getWorkerSalon(rows[0]) : null;
}

async function getExistingSubmission(env: WorkerEnv, submissionId: string) {
  const response = await supabaseFetch(
    env,
    `/rest/v1/salon_quiz_submissions?select=id&id=eq.${encodeURIComponent(submissionId)}&limit=1`,
  );
  if (!response.ok) throw new Error("supabase_read_failed");
  const rows = await response.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}

async function insertSubmission(env: WorkerEnv, salon: WorkerSalon, submission: ValidatedSubmission) {
  const response = await supabaseFetch(env, "/rest/v1/salon_quiz_submissions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      id: submission.submissionId,
      salon_id: salon.id,
      quiz_version: salon.updatedAt,
      visitor_name: submission.visitorName,
      visitor_whatsapp: submission.visitorWhatsapp,
      ...(submission.visitorCity ? { visitor_city: submission.visitorCity } : {}),
      answers: submission.answers,
      consent_accepted: submission.consentAccepted,
      consent_text: submission.consentText,
      source_url: submission.sourceUrl ?? null,
      status: "new",
      created_at: new Date().toISOString(),
    }),
  });

  if (response.ok) return { ok: true, duplicate: false };
  if (response.status !== 409) return { ok: false, duplicate: false };
  return { ok: await getExistingSubmission(env, submission.submissionId), duplicate: true };
}

async function notifyRecipient(env: WorkerEnv, salon: WorkerSalon, submission: ValidatedSubmission): Promise<EmailResult> {
  const recipientEmail = salon.quiz.notificationRecipientEmail.trim();
  if (!salon.quiz.notificationEnabled || !isValidEmail(recipientEmail)) {
    await markEmailSkipped(env, submission.submissionId);
    return { sent: false };
  }

  const senderEmail = env.BREVO_SENDER_EMAIL?.trim();
  const senderName = env.BREVO_SENDER_NAME?.trim();
  if (!senderEmail || !senderName || !env.BREVO_API_KEY?.trim()) {
    await markEmailFailedWithoutClaim(env, submission.submissionId, "mail_config_missing");
    return { sent: false, errorCode: "mail_config_missing" };
  }

  const claimId = crypto.randomUUID();
  const claim = await claimEmailNotification(env, submission.submissionId, claimId);
  if (!claim.available) {
    // Do not send without durable state: that would allow a retry to duplicate mail.
    return { sent: false, errorCode: "mail_status_unavailable" };
  }
  if (!claim.claimed) return { sent: claim.status === "sent" };

  const content = buildBrevoMessage(salon, submission);

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipientEmail }],
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.text,
        // Brevo retains this key for 15 minutes. The same submission can safely
        // retry during the database claim recovery window without duplicating mail.
        headers: { "Idempotency-Key": submission.submissionId },
      }),
    });
    const data = await response.json().catch(() => ({})) as { messageId?: unknown };
    if (!response.ok) {
      const errorCode = response.status === 401 || response.status === 403
        ? "mail_authentication_failed"
        : "mail_rejected";
      await finalizeEmailStatus(env, submission.submissionId, claimId, "failed", undefined, errorCode);
      log("quiz_worker_email_failed", { slug: salon.slug, status: response.status });
      return { sent: false, errorCode };
    }
    const messageId = typeof data.messageId === "string" ? data.messageId.slice(0, 500) : undefined;
    await finalizeEmailStatus(env, submission.submissionId, claimId, "sent", messageId);
    log("quiz_worker_email_sent", { slug: salon.slug });
    return { sent: true, messageId };
  } catch {
    await finalizeEmailStatus(env, submission.submissionId, claimId, "failed", undefined, "mail_connection_failed");
    log("quiz_worker_email_failed", { slug: salon.slug, status: 0 });
    return { sent: false, errorCode: "mail_connection_failed" };
  }
}

async function claimEmailNotification(env: WorkerEnv, submissionId: string, claimId: string): Promise<EmailClaim> {
  try {
    const response = await supabaseFetch(env, "/rest/v1/rpc/claim_quiz_email_notification", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ p_submission_id: submissionId, p_claim_id: claimId }),
    });
    if (!response.ok) {
      log("quiz_worker_email_claim_unavailable", { status: response.status });
      return { available: false, claimed: false, status: null };
    }
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : null;
    const status = row && isEmailNotificationStatus(row.email_status) ? row.email_status : null;
    return { available: true, claimed: row?.claimed === true, status };
  } catch {
    log("quiz_worker_email_claim_unavailable", { status: 0 });
    return { available: false, claimed: false, status: null };
  }
}

async function finalizeEmailStatus(
  env: WorkerEnv,
  submissionId: string,
  claimId: string,
  status: Exclude<EmailNotificationStatus, "pending" | "skipped">,
  messageId?: string,
  errorCode?: string,
) {
  try {
    const response = await supabaseFetch(
      env,
      `/rest/v1/salon_quiz_submissions?id=eq.${encodeURIComponent(submissionId)}&email_notification_claim_id=eq.${encodeURIComponent(claimId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          email_notification_status: status,
          email_notification_sent_at: status === "sent" ? new Date().toISOString() : null,
          email_notification_message_id: messageId ?? null,
          email_notification_error_code: errorCode ?? null,
          email_notification_claim_id: null,
          email_notification_claimed_at: null,
        }),
      },
    );
    const rows = response.ok ? await response.json().catch(() => []) : [];
    if (!response.ok || !Array.isArray(rows) || rows.length !== 1) {
      log("quiz_worker_email_status_unavailable", { status: response.status });
    }
  } catch {
    log("quiz_worker_email_status_unavailable", { status: 0 });
  }
}

async function markEmailSkipped(env: WorkerEnv, submissionId: string) {
  try {
    const response = await supabaseFetch(
      env,
      `/rest/v1/salon_quiz_submissions?id=eq.${encodeURIComponent(submissionId)}&email_notification_status=is.null`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ email_notification_status: "skipped" }),
      },
    );
    if (!response.ok) log("quiz_worker_email_status_unavailable", { status: response.status });
  } catch {
    log("quiz_worker_email_status_unavailable", { status: 0 });
  }
}

async function markEmailFailedWithoutClaim(env: WorkerEnv, submissionId: string, errorCode: string) {
  try {
    const response = await supabaseFetch(
      env,
      `/rest/v1/salon_quiz_submissions?id=eq.${encodeURIComponent(submissionId)}&email_notification_claim_id=is.null`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          email_notification_status: "failed",
          email_notification_error_code: errorCode,
        }),
      },
    );
    if (!response.ok) log("quiz_worker_email_status_unavailable", { status: response.status });
  } catch {
    log("quiz_worker_email_status_unavailable", { status: 0 });
  }
}

function isEmailNotificationStatus(value: unknown): value is EmailNotificationStatus {
  return value === "pending" || value === "sent" || value === "skipped" || value === "failed";
}

function supabaseFetch(env: WorkerEnv, path: string, init: RequestInit = {}) {
  const baseUrl = env.SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!baseUrl || !serviceRole) throw new Error("supabase_config_missing");
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceRole);
  headers.set("Authorization", `Bearer ${serviceRole}`);
  headers.set("content-type", "application/json");
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

function readSlug(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  const slug = (payload as { slug?: unknown }).slug;
  return typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : "";
}

function response(payload: Record<string, unknown>, status: number, origin?: string | null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function corsHeaders(origin: string | null) {
  return {
    "access-control-allow-origin": origin ?? "",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

function log(event: string, details: Record<string, unknown>) {
  console.info("[quiz-worker]", { event, ...details });
}
