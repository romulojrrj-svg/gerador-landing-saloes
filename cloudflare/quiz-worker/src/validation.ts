import type {
  QuizAnswerValue,
  QuizOption,
  QuizQuestion,
  StoredQuizAnswer,
  ValidatedSubmission,
  WorkerQuizConfig,
  WorkerSalon,
} from "./types.ts";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const QUESTION_TYPES = new Set(["short_text", "long_text", "single_choice", "multiple_choice", "scale", "yes_no"]);

type SupabaseSalonRow = {
  id?: unknown;
  slug?: unknown;
  name?: unknown;
  status?: unknown;
  updated_at?: unknown;
  metadata?: unknown;
};

export function isValidEmail(value: string) {
  const trimmed = value.trim();
  return trimmed.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function parseAllowedOrigins(value: string) {
  return new Set(
    value
      .split(",")
      .map(normalizeOrigin)
      .filter((origin) => /^https?:\/\/[^/\s]+$/i.test(origin)),
  );
}

export function isAllowedOrigin(origin: string | null, allowedOrigins: Set<string>) {
  return Boolean(origin && allowedOrigins.has(normalizeOrigin(origin)));
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getWorkerSalon(row: SupabaseSalonRow): WorkerSalon | null {
  const metadata = record(row.metadata);
  const legacySalon = record(metadata?.salon);
  const fields = { ...legacySalon, ...metadata };
  const premium = record(fields.premiumEditorial);
  const quiz = parseQuiz(record(premium?.interactiveQuiz));
  const templateVersion = string(fields.templateVersion);

  if (
    !isUuid(string(row.id)) ||
    !isSlug(string(row.slug)) ||
    !string(row.name) ||
    string(row.status) !== "published" ||
    templateVersion !== "premium_editorial_v2" ||
    !quiz?.enabled ||
    !quiz.questions.length
  ) {
    return null;
  }

  return {
    id: string(row.id),
    slug: string(row.slug),
    name: string(row.name),
    status: string(row.status) || null,
    updatedAt: string(row.updated_at),
    quiz,
  };
}

export function validateSubmission(
  payload: unknown,
  salon: WorkerSalon,
): { ok: true; submission: ValidatedSubmission } | { ok: false; message: string } {
  const input = record(payload);
  if (!input) return { ok: false, message: "Nao foi possivel validar o envio." };

  const submissionId = string(input.submissionId);
  if (!isUuid(submissionId) || string(input.slug) !== salon.slug) {
    return { ok: false, message: "Nao foi possivel validar o envio." };
  }
  if (string(input.honeypot)) return { ok: false, message: "Nao foi possivel validar o envio." };

  const visitorName = string(input.visitorName).slice(0, 160);
  if (salon.quiz.contactNameRequired && !visitorName) {
    return { ok: false, message: "Informe seu nome para continuar." };
  }

  const visitorWhatsapp = normalizeWhatsapp(string(input.visitorWhatsapp), salon.quiz.defaultCountryCode);
  if (!visitorWhatsapp) return { ok: false, message: "Informe um WhatsApp valido." };

  const visitorCity = salon.quiz.contactCityEnabled
    ? string(input.visitorCity).slice(0, 100)
    : "";
  if (salon.quiz.contactCityRequired && !visitorCity) {
    return { ok: false, message: "Informe sua cidade." };
  }

  const consentAccepted = input.consentAccepted === true;
  if (salon.quiz.contactConsentRequired && !consentAccepted) {
    return { ok: false, message: "Aceite o consentimento para enviar suas respostas." };
  }

  const answersInput = record(input.answers) ?? {};
  const answers: StoredQuizAnswer[] = [];
  for (const question of salon.quiz.questions) {
    const value = answerValue(answersInput[question.id]);
    const validation = validateAnswer(question, value);
    if (!validation.ok) return validation;
    const selectedOptions = selectedOptionsFor(question, value);
    answers.push({
      questionId: question.id,
      category: question.category || undefined,
      prompt: question.prompt,
      type: question.type,
      value: value ?? "",
      ...(selectedOptions.length ? { selectedOptions } : {}),
      ...(question.type === "scale"
        ? {
            scaleMin: question.scaleMin,
            scaleMax: question.scaleMax,
            scaleMinLabel: question.scaleMinLabel,
            scaleMaxLabel: question.scaleMaxLabel,
          }
        : {}),
    });
  }

  return {
    ok: true,
    submission: {
      submissionId,
      visitorName,
      visitorWhatsapp,
      ...(visitorCity ? { visitorCity } : {}),
      answers,
      consentAccepted: salon.quiz.contactConsentRequired && consentAccepted,
      consentText: salon.quiz.contactConsentRequired
        ? salon.quiz.consentText.slice(0, 2000)
        : "",
      ...(cleanSourceUrl(string(input.sourceUrl)) ? { sourceUrl: cleanSourceUrl(string(input.sourceUrl)) } : {}),
    },
  };
}

function parseQuiz(input: Record<string, unknown> | undefined): WorkerQuizConfig | null {
  if (!input) return null;
  const questions = Array.isArray(input.questions)
    ? input.questions.map(parseQuestion).filter((question): question is QuizQuestion => Boolean(question))
    : [];
  return {
    enabled: input.enabled === true,
    notificationEnabled: input.notificationEnabled === true,
    notificationRecipientEmail: string(input.notificationRecipientEmail),
    contactNameRequired: input.contactNameRequired !== false,
    contactCityEnabled: input.contactCityEnabled === true,
    contactCityRequired: input.contactCityRequired === true,
    contactConsentRequired: input.contactConsentRequired === true,
    consentText: string(input.consentText),
    defaultCountryCode: normalizeCountryCode(string(input.defaultCountryCode)),
    questions,
  };
}

function parseQuestion(value: unknown): QuizQuestion | null {
  const input = record(value);
  const type = string(input?.type);
  if (!input || !QUESTION_TYPES.has(type)) return null;
  const options = Array.isArray(input.options)
    ? input.options.map(parseOption).filter((option): option is QuizOption => Boolean(option))
    : [];
  const min = integer(input.minSelections);
  const max = integer(input.maxSelections);
  const scaleMin = integer(input.scaleMin) ?? 1;
  const scaleMax = Math.max(scaleMin + 1, integer(input.scaleMax) ?? 5);
  return {
    id: string(input.id),
    category: string(input.category),
    type: type as QuizQuestion["type"],
    prompt: string(input.prompt).slice(0, 1000),
    required: input.required !== false,
    options,
    ...(min != null ? { minSelections: Math.max(0, min) } : {}),
    ...(max != null ? { maxSelections: Math.max(1, max) } : {}),
    ...(integer(input.maxLength) != null ? { maxLength: Math.max(1, integer(input.maxLength) as number) } : {}),
    scaleMin,
    scaleMax,
    scaleMinLabel: string(input.scaleMinLabel).slice(0, 200),
    scaleMaxLabel: string(input.scaleMaxLabel).slice(0, 200),
  };
}

function parseOption(value: unknown): QuizOption | null {
  const input = record(value);
  const id = string(input?.id);
  const label = string(input?.label).slice(0, 300);
  return id && label ? { id, label } : null;
}

function validateAnswer(
  question: QuizQuestion,
  value: QuizAnswerValue | undefined,
): { ok: true } | { ok: false; message: string } {
  if (value == null || value === "" || (Array.isArray(value) && !value.length)) {
    return question.required
      ? { ok: false, message: "Responda todas as perguntas obrigatorias." }
      : { ok: true };
  }
  if (question.type === "short_text" || question.type === "long_text") {
    const maximum = question.maxLength ?? (question.type === "short_text" ? 1000 : 5000);
    return typeof value === "string" && value.length <= maximum
      ? { ok: true }
      : { ok: false, message: "Resposta invalida." };
  }
  if (question.type === "single_choice") {
    return typeof value === "string" && question.options.some((option) => option.id === value)
      ? { ok: true }
      : { ok: false, message: "Escolha invalida." };
  }
  if (question.type === "yes_no") {
    return value === "yes" || value === "no"
      ? { ok: true }
      : { ok: false, message: "Escolha invalida." };
  }
  if (question.type === "multiple_choice") {
    if (!Array.isArray(value) || new Set(value).size !== value.length || value.some((id) => !question.options.some((option) => option.id === id))) {
      return { ok: false, message: "Escolhas invalidas." };
    }
    if (question.minSelections != null && value.length < question.minSelections) return { ok: false, message: "Escolha mais opcoes para continuar." };
    if (question.maxSelections != null && value.length > question.maxSelections) return { ok: false, message: "Escolha menos opcoes para continuar." };
    return { ok: true };
  }
  if (question.type === "scale") {
    return typeof value === "number" && Number.isInteger(value) && value >= (question.scaleMin ?? 1) && value <= (question.scaleMax ?? 5)
      ? { ok: true }
      : { ok: false, message: "Escala invalida." };
  }
  return { ok: false, message: "Resposta invalida." };
}

function selectedOptionsFor(question: QuizQuestion, value: QuizAnswerValue | undefined) {
  const ids = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return question.options.filter((option) => ids.includes(option.id));
}

function answerValue(value: unknown): QuizAnswerValue | undefined {
  if (typeof value === "string") return value.trim().slice(0, 5000);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.map((item) => item.trim()).filter(Boolean).slice(0, 30);
  return undefined;
}

function normalizeWhatsapp(value: string, countryCode: string) {
  const raw = value.trim();
  const digits = raw.replace(/[^0-9]/g, "");
  const country = countryCode.replace(/[^0-9]/g, "");
  const full = raw.startsWith("+") ? digits : `${country}${digits}`;
  return full.length >= 8 && full.length <= 15 ? `+${full}` : null;
}

function cleanSourceUrl(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 2000) : "";
  } catch {
    return "";
  }
}

function isSlug(value: string) {
  return SLUG_PATTERN.test(value);
}

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function normalizeCountryCode(value: string) {
  const digits = value.replace(/[^0-9]/g, "");
  return digits ? `+${digits}` : "+55";
}

function integer(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : undefined;
}

function record(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
