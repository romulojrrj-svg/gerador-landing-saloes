export type QuizAnswerValue = string | number | string[];

export type QuizSubmissionPayload = {
  submissionId: string;
  slug: string;
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: Record<string, QuizAnswerValue>;
  consentAccepted: boolean;
  consentText?: string;
  sourceUrl?: string;
  honeypot?: string;
  // Reserved for a future Turnstile verification. It is not required yet.
  turnstileToken?: string;
};

export type QuizOption = { id: string; label: string };

export type QuizQuestion = {
  id: string;
  category?: string;
  type: "short_text" | "long_text" | "single_choice" | "multiple_choice" | "scale" | "yes_no";
  prompt: string;
  required: boolean;
  options: QuizOption[];
  minSelections?: number;
  maxSelections?: number;
  maxLength?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export type WorkerQuizConfig = {
  enabled: boolean;
  notificationEnabled: boolean;
  notificationRecipientEmail: string;
  contactNameRequired: boolean;
  contactCityEnabled: boolean;
  contactCityRequired: boolean;
  contactConsentRequired: boolean;
  consentText: string;
  defaultCountryCode: string;
  questions: QuizQuestion[];
};

export type WorkerSalon = {
  id: string;
  slug: string;
  name: string;
  status: string | null;
  updatedAt: string;
  quiz: WorkerQuizConfig;
};

export type StoredQuizAnswer = {
  questionId: string;
  category?: string;
  prompt: string;
  type: QuizQuestion["type"];
  value: QuizAnswerValue;
  selectedOptions?: QuizOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export type ValidatedSubmission = {
  submissionId: string;
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: StoredQuizAnswer[];
  consentAccepted: boolean;
  consentText: string;
  sourceUrl?: string;
};

export type WorkerEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BREVO_API_KEY: string;
  BREVO_SENDER_EMAIL: string;
  BREVO_SENDER_NAME: string;
  ALLOWED_ORIGINS: string;
  TURNSTILE_SECRET_KEY?: string;
};
