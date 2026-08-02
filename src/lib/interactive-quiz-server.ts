import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSalonBySlug } from "@/lib/salon-repository";
import { getAdminSalonBySlug } from "@/lib/admin-salons";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import { getDevSharedSalonBySlug } from "@/lib/dev-shared-salon-storage";
import { normalizeInteractiveQuizConfig } from "@/lib/interactive-quiz";
import {
  isValidEmail,
  type QuizEmailAnswer,
} from "@/lib/quiz-email-format";
import {
  sendQuizSubmissionNotification,
  type MailErrorCode,
} from "@/lib/quiz-email";
import type { Salon, SalonInteractiveQuizConfig, SalonInteractiveQuizQuestion } from "@/types/salon";
import type { InteractiveQuizAnswerValue, InteractiveQuizSubmissionPayload } from "@/lib/interactive-quiz-client";

export type QuizLeadStatus = "new" | "contacted" | "finished";
export type QuizNotificationStatus = "pending" | "sent" | "skipped" | "failed";

export type QuizLead = {
  id: string;
  salonId: string;
  quizVersion: string;
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: QuizEmailAnswer[];
  consentAccepted: boolean;
  consentText: string;
  sourceUrl?: string;
  status: QuizLeadStatus;
  createdAt: string;
  emailNotificationStatus?: QuizNotificationStatus;
  emailNotificationSentAt?: string;
  emailNotificationMessageId?: string;
  emailNotificationErrorCode?: string;
};

type SubmissionResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

const LOCAL_FILE = path.join(process.cwd(), ".local-data", "quiz-submissions.json");
const ipAttempts = new Map<string, number[]>();
const recentSubmissions = new Map<string, number>();
const notificationInFlight = new Set<string>();

export async function getActiveInteractiveQuiz(slug: string) {
  let salon: Salon | null;
  if (isServerLocalStorageEnabled()) {
    salon = await getDevSharedSalonBySlug(slug);
  } else {
    const result = await getSalonBySlug(slug);
    salon = result.ok ? result.salon : null;
  }
  if (!salon || salon.status !== "published") return null;
  const config = normalizeInteractiveQuizConfig(salon.premiumEditorial?.interactiveQuiz);
  if (salon.templateVersion !== "premium_editorial_v2" || !config?.enabled || !config.questions.length) return null;
  return { salon, config };
}

export async function createQuizSubmission(
  slug: string,
  payload: InteractiveQuizSubmissionPayload,
  requestIp: string,
): Promise<SubmissionResult> {
  if (JSON.stringify(payload).length > 50_000) return { ok: false, status: 413, error: "Envio muito grande." };
  if (payload.honeypot?.trim()) return { ok: false, status: 400, error: "Nao foi possivel validar o envio." };
  const active = await getActiveInteractiveQuiz(slug);
  if (!active) return { ok: false, status: 404, error: "Teste indisponivel." };
  if (!allowRequest(requestIp, slug, payload.visitorWhatsapp)) return { ok: false, status: 429, error: "Aguarde um momento antes de enviar novamente." };

  const validated = validateSubmission(active.salon, active.config, payload);
  if (!validated.ok) return validated;
  const lead: QuizLead = {
    id: crypto.randomUUID(),
    salonId: active.salon.id,
    quizVersion: active.salon.updatedAt,
    visitorName: validated.visitorName,
    visitorWhatsapp: validated.visitorWhatsapp,
    visitorCity: validated.visitorCity,
    answers: validated.answers,
    consentAccepted: validated.consentAccepted,
    consentText: validated.consentText,
    sourceUrl: cleanSourceUrl(payload.sourceUrl),
    status: "new",
    createdAt: new Date().toISOString(),
  };

  try {
    if (isServerLocalStorageEnabled()) {
      const leads = await readLocalLeads();
      await writeLocalLeads([lead, ...leads]);
    } else {
      if (!isSupabaseAdminConfigured()) return { ok: false, status: 503, error: "Servico de envio indisponivel." };
      const client = getSupabaseAdminClient();
      if (!client) return { ok: false, status: 503, error: "Servico de envio indisponivel." };
      const { error } = await client.from("salon_quiz_submissions").insert({
        id: lead.id,
        salon_id: lead.salonId,
        quiz_version: lead.quizVersion,
        visitor_name: lead.visitorName,
        visitor_whatsapp: lead.visitorWhatsapp,
        ...(lead.visitorCity ? { visitor_city: lead.visitorCity } : {}),
        answers: lead.answers,
        consent_accepted: lead.consentAccepted,
        consent_text: lead.consentText,
        source_url: lead.sourceUrl ?? null,
        status: lead.status,
        created_at: lead.createdAt,
      });
      if (error) return { ok: false, status: 500, error: "Nao foi possivel salvar suas respostas." };
    }

    await maybeSendQuizNotification(active.salon, active.config, lead);
    return { ok: true, id: lead.id };
  } catch {
    return { ok: false, status: 500, error: "Nao foi possivel salvar suas respostas." };
  }
}

export async function listQuizLeads(slug: string, status?: QuizLeadStatus) {
  const salon = await getQuizAdminSalon(slug);
  if (!salon.ok) return salon;
  if (isServerLocalStorageEnabled()) {
    const leads = await readLocalLeads();
    return { ok: true as const, leads: leads.filter((lead) => lead.salonId === salon.salon.id && (!status || lead.status === status)) };
  }
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, error: "Supabase nao configurado." };
  let query = client.from("salon_quiz_submissions").select("*").eq("salon_id", salon.salon.id).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, leads: (data ?? []).map(mapSupabaseLead) };
}

export async function updateQuizLeadStatus(slug: string, id: string, status: QuizLeadStatus) {
  const salon = await getQuizAdminSalon(slug);
  if (!salon.ok) return salon;
  if (isServerLocalStorageEnabled()) {
    const leads = await readLocalLeads();
    const next = leads.map((lead) => lead.id === id && lead.salonId === salon.salon.id ? { ...lead, status } : lead);
    await writeLocalLeads(next);
    return { ok: true as const };
  }
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, error: "Supabase nao configurado." };
  const { error } = await client.from("salon_quiz_submissions").update({ status }).eq("id", id).eq("salon_id", salon.salon.id);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function deleteQuizLead(slug: string, id: string) {
  const salon = await getQuizAdminSalon(slug);
  if (!salon.ok) return salon;
  if (isServerLocalStorageEnabled()) {
    const leads = await readLocalLeads();
    const next = leads.filter((lead) => !(lead.id === id && lead.salonId === salon.salon.id));
    await writeLocalLeads(next);
    return { ok: true as const };
  }
  const client = getSupabaseAdminClient();
  if (!client) return { ok: false as const, error: "Supabase nao configurado." };
  const { error } = await client.from("salon_quiz_submissions").delete().eq("id", id).eq("salon_id", salon.salon.id);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

function validateSubmission(salon: Salon, config: SalonInteractiveQuizConfig, payload: InteractiveQuizSubmissionPayload) {
  const visitorName = payload.visitorName.trim().slice(0, 160);
  if (config.contactNameRequired && !visitorName) return { ok: false as const, status: 400, error: "Nome obrigatorio." };
  const visitorWhatsapp = normalizeWhatsapp(payload.visitorWhatsapp, config.defaultCountryCode);
  if (!visitorWhatsapp) return { ok: false as const, status: 400, error: "Informe um WhatsApp valido." };
  const answers: QuizLead["answers"] = [];
  for (const question of config.questions) {
    const value = payload.answers?.[question.id];
    const valid = validateAnswer(question, value);
    if (!valid.ok) return valid;
    const selectedOptions = Array.isArray(value) || typeof value === "string" ? question.options.filter((option) => Array.isArray(value) ? value.includes(option.id) : value === option.id).map((option) => ({ id: option.id, label: option.label })) : undefined;
    answers.push({
      questionId: question.id,
      category: question.category?.trim().slice(0, 200) || undefined,
      prompt: question.prompt.slice(0, 1000),
      type: question.type,
      value: value as InteractiveQuizAnswerValue,
      ...(selectedOptions?.length ? { selectedOptions } : {}),
      ...(question.type === "scale" ? {
        scaleMin: question.scaleMin,
        scaleMax: question.scaleMax,
        scaleMinLabel: question.scaleMinLabel,
        scaleMaxLabel: question.scaleMaxLabel,
      } : {}),
    });
  }
  const visitorCity = config.contactCityEnabled
    ? payload.visitorCity?.trim().slice(0, 100) ?? ""
    : undefined;
  if (config.contactCityRequired && !visitorCity) return { ok: false as const, status: 400, error: "Informe sua cidade." };
  if (config.contactConsentRequired && payload.consentAccepted !== true) return { ok: false as const, status: 400, error: "Consentimento obrigatorio." };
  return {
    ok: true as const,
    visitorName,
    visitorWhatsapp,
    visitorCity,
    answers,
    consentAccepted: config.contactConsentRequired === true && payload.consentAccepted === true,
    consentText: config.contactConsentRequired === true ? config.consentText.trim().slice(0, 2000) : "",
    salonId: salon.id,
  };
}

function validateAnswer(question: SalonInteractiveQuizQuestion, value: InteractiveQuizAnswerValue | undefined) {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) return question.required ? { ok: false as const, status: 400, error: "Responda todas as perguntas obrigatorias." } : { ok: true as const };
  if (question.type === "short_text" && (typeof value !== "string" || value.length > (question.maxLength ?? 1000))) return { ok: false as const, status: 400, error: "Resposta curta invalida." };
  if (question.type === "long_text" && (typeof value !== "string" || value.length > (question.maxLength ?? 5000))) return { ok: false as const, status: 400, error: "Resposta longa invalida." };
  if ((question.type === "single_choice" || question.type === "yes_no") && (typeof value !== "string" || (question.type === "single_choice" && !question.options.some((option) => option.id === value)) || (question.type === "yes_no" && value !== "yes" && value !== "no"))) return { ok: false as const, status: 400, error: "Escolha invalida." };
  if (question.type === "multiple_choice") {
    if (!Array.isArray(value) || value.some((item) => !question.options.some((option) => option.id === item)) || new Set(value).size !== value.length) return { ok: false as const, status: 400, error: "Escolhas invalidas." };
    if (question.minSelections != null && value.length < question.minSelections) return { ok: false as const, status: 400, error: "Escolha mais opcoes para continuar." };
    if (question.maxSelections != null && value.length > question.maxSelections) return { ok: false as const, status: 400, error: "Escolha menos opcoes para continuar." };
  }
  if (question.type === "scale" && (typeof value !== "number" || !Number.isInteger(value) || value < (question.scaleMin ?? 1) || value > (question.scaleMax ?? 5))) return { ok: false as const, status: 400, error: "Escala invalida." };
  return { ok: true as const };
}

function normalizeWhatsapp(value: string, countryCode: string) {
  const raw = value.trim();
  const digits = raw.replace(/[^0-9]/g, "");
  const country = countryCode.replace(/[^0-9]/g, "");
  const full = raw.startsWith("+") ? digits : `${country}${digits}`;
  return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
}

function cleanSourceUrl(value?: string) {
  if (!value) return undefined;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 2000) : undefined; } catch { return undefined; }
}

function allowRequest(ip: string, slug: string, phone: string) {
  const now = Date.now();
  const attempts = (ipAttempts.get(ip) ?? []).filter((timestamp) => timestamp > now - 60 * 60 * 1000);
  if (attempts.length >= 10) return false;
  attempts.push(now); ipAttempts.set(ip, attempts);
  const key = `${slug}:${phone.replace(/\D/g, "")}`;
  const previous = recentSubmissions.get(key);
  if (previous && previous > now - 60_000) return false;
  recentSubmissions.set(key, now);
  return true;
}

async function maybeSendQuizNotification(
  salon: Salon,
  config: SalonInteractiveQuizConfig,
  lead: QuizLead,
) {
  const startedAt = Date.now();
  const recipientEmail = config.notificationRecipientEmail?.trim() ?? "";

  if (config.notificationEnabled !== true) {
    await safelySetNotificationStatus(lead.id, "skipped");
    logQuizNotification("quiz_notification_skipped", lead, "notification_disabled", startedAt, "skipped");
    return;
  }

  if (!isValidEmail(recipientEmail)) {
    await safelySetNotificationStatus(lead.id, "skipped");
    logQuizNotification("quiz_notification_config_missing", lead, "recipient_invalid", startedAt, "skipped");
    return;
  }

  const storedStatus = await getNotificationStatus(lead.id);
  if (storedStatus === "sent" || notificationInFlight.has(lead.id)) {
    logQuizNotification("quiz_notification_duplicate_prevented", lead, "already_sent_or_in_flight", startedAt);
    return;
  }

  notificationInFlight.add(lead.id);
  try {
    const result = await sendQuizSubmissionNotification({
      submission: lead,
      salon,
      recipientEmail,
    });

    if (result.success) {
      await safelySetNotificationStatus(lead.id, "sent", result.messageId);
      logQuizNotification("quiz_notification_sent", lead, undefined, startedAt);
    } else {
      await safelySetNotificationStatus(lead.id, "failed", undefined, result.errorCode);
      logQuizNotification("quiz_notification_failed", lead, result.errorCode, startedAt);
    }
  } catch {
    await safelySetNotificationStatus(lead.id, "failed", undefined, "mail_unknown");
    logQuizNotification("quiz_notification_failed", lead, "mail_unknown", startedAt);
  } finally {
    notificationInFlight.delete(lead.id);
  }
}

async function safelySetNotificationStatus(
  id: string,
  status: QuizNotificationStatus,
  messageId?: string,
  errorCode?: MailErrorCode,
) {
  try {
    await setNotificationStatus(id, status, messageId, errorCode);
  } catch {
    // Notification bookkeeping must never turn a persisted lead into a failed submission.
  }
}

async function getNotificationStatus(id: string) {
  if (isServerLocalStorageEnabled()) {
    const leads = await readLocalLeads();
    return leads.find((lead) => lead.id === id)?.emailNotificationStatus;
  }

  const client = getSupabaseAdminClient();
  if (!client) return undefined;
  const { data, error } = await client
    .from("salon_quiz_submissions")
    .select("email_notification_status")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return undefined;
  const status = data.email_notification_status;
  return status === "pending" || status === "sent" || status === "skipped" || status === "failed"
    ? status
    : undefined;
}

async function setNotificationStatus(
  id: string,
  status: QuizNotificationStatus,
  messageId?: string,
  errorCode?: MailErrorCode,
) {
  if (isServerLocalStorageEnabled()) {
    const leads = await readLocalLeads();
    const next = leads.map((lead) => lead.id === id ? {
      ...lead,
      emailNotificationStatus: status,
      ...(status === "sent" ? { emailNotificationSentAt: new Date().toISOString() } : {}),
      ...(messageId ? { emailNotificationMessageId: messageId } : {}),
      ...(errorCode ? { emailNotificationErrorCode: errorCode } : {}),
    } : lead);
    await writeLocalLeads(next);
    return;
  }

  const client = getSupabaseAdminClient();
  if (!client) return;
  await client.from("salon_quiz_submissions").update({
    email_notification_status: status,
    email_notification_sent_at: status === "sent" ? new Date().toISOString() : null,
    email_notification_message_id: messageId ?? null,
    email_notification_error_code: errorCode ?? null,
  }).eq("id", id);
}

function logQuizNotification(
  event: string,
  lead: QuizLead,
  errorCode: string | undefined,
  startedAt: number,
  status: "ok" | "skipped" | "failed" = errorCode ? "failed" : "ok",
) {
  console.info("[quiz-notification]", {
    event,
    submissionId: lead.id,
    salonId: lead.salonId,
    status,
    ...(errorCode ? { errorCode } : {}),
    durationMs: Date.now() - startedAt,
  });
}

async function readLocalLeads(): Promise<QuizLead[]> {
  try { return JSON.parse(await readFile(LOCAL_FILE, "utf8")) as QuizLead[]; } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") return []; throw error; }
}
async function writeLocalLeads(leads: QuizLead[]) { await mkdir(path.dirname(LOCAL_FILE), { recursive: true }); await writeFile(LOCAL_FILE, JSON.stringify(leads, null, 2), "utf8"); }
function mapSupabaseLead(row: Record<string, unknown>): QuizLead {
  const emailNotificationStatus = row.email_notification_status;
  return {
    id: String(row.id),
    salonId: String(row.salon_id),
    quizVersion: String(row.quiz_version ?? ""),
    visitorName: String(row.visitor_name ?? ""),
    visitorWhatsapp: String(row.visitor_whatsapp ?? ""),
    visitorCity: typeof row.visitor_city === "string" ? row.visitor_city : undefined,
    answers: Array.isArray(row.answers) ? row.answers as QuizLead["answers"] : [],
    consentAccepted: row.consent_accepted === true,
    consentText: String(row.consent_text ?? ""),
    sourceUrl: typeof row.source_url === "string" ? row.source_url : undefined,
    status: row.status === "contacted" || row.status === "finished" ? row.status : "new",
    createdAt: String(row.created_at ?? ""),
    ...(emailNotificationStatus === "pending" || emailNotificationStatus === "sent" || emailNotificationStatus === "skipped" || emailNotificationStatus === "failed" ? { emailNotificationStatus } : {}),
    ...(typeof row.email_notification_sent_at === "string" ? { emailNotificationSentAt: row.email_notification_sent_at } : {}),
    ...(typeof row.email_notification_message_id === "string" ? { emailNotificationMessageId: row.email_notification_message_id } : {}),
    ...(typeof row.email_notification_error_code === "string" ? { emailNotificationErrorCode: row.email_notification_error_code } : {}),
  };
}

async function getQuizAdminSalon(slug: string) {
  if (isServerLocalStorageEnabled()) {
    const salon = await getDevSharedSalonBySlug(slug);
    return salon ? { ok: true as const, salon, source: "server-local" as const } : { ok: false as const, error: "Salao nao encontrado." };
  }
  return getAdminSalonBySlug(slug);
}
