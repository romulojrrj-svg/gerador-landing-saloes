import "server-only";

import nodemailer from "nodemailer";
import { normalizeCustomDomain } from "@/lib/custom-domain";
import type { Salon } from "@/types/salon";
import {
  buildQuizNotificationEmail,
  escapeHtml,
  isValidEmail,
  type QuizEmailSubmission,
} from "@/lib/quiz-email-format";

export type MailErrorCode =
  | "mail_config_missing"
  | "mail_config_invalid"
  | "mail_authentication_failed"
  | "mail_connection_failed"
  | "mail_recipient_rejected"
  | "mail_rejected"
  | "mail_unknown";

export type MailOperationResult = {
  success: boolean;
  messageId?: string;
  errorCode?: MailErrorCode;
};

type MailConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
};

export function validateMailConfiguration() {
  const config = readMailConfiguration();
  const rawPort = process.env.SMTP_PORT?.trim() ?? "";
  const rawSecure = process.env.SMTP_SECURE?.trim() ?? "";
  const required = [
    config.host,
    rawPort,
    rawSecure,
    config.user,
    config.pass,
    config.fromName,
    config.fromEmail,
  ];

  if (required.some((value) => !value)) {
    return {
      ok: false as const,
      errorCode: "mail_config_missing" as const,
      message: "As credenciais de envio de e-mail ainda não foram configuradas no ambiente.",
    };
  }

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535 || !isValidEmail(config.user) || !isValidEmail(config.fromEmail)) {
    return {
      ok: false as const,
      errorCode: "mail_config_invalid" as const,
      message: "A configuração do remetente de e-mail é inválida.",
    };
  }

  return { ok: true as const, config };
}

export async function verifyMailConfiguration(): Promise<MailOperationResult> {
  const checked = validateMailConfiguration();
  if (!checked.ok) return { success: false, errorCode: checked.errorCode };

  try {
    await createTransport(checked.config).verify();
    return { success: true };
  } catch (error) {
    return { success: false, errorCode: classifyMailError(error) };
  }
}

export async function sendQuizSubmissionNotification({
  submission,
  salon,
  recipientEmail,
}: {
  submission: QuizEmailSubmission;
  salon: Salon;
  recipientEmail: string;
}): Promise<MailOperationResult> {
  if (!isValidEmail(recipientEmail)) {
    return { success: false, errorCode: "mail_recipient_rejected" };
  }

  const checked = validateMailConfiguration();
  if (!checked.ok) return { success: false, errorCode: checked.errorCode };

  try {
    const transport = createTransport(checked.config);
    await transport.verify();
    const content = buildQuizNotificationEmail({
      submission,
      salon,
      publicUrl: getPublicQuizUrl(salon),
    });
    const info = await transport.sendMail({
      from: { name: checked.config.fromName, address: checked.config.fromEmail },
      to: recipientEmail.trim(),
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    return { success: true, messageId: typeof info.messageId === "string" ? info.messageId : undefined };
  } catch (error) {
    return { success: false, errorCode: classifyMailError(error) };
  }
}

export async function sendQuizTestEmail({
  salon,
  recipientEmail,
}: {
  salon: Salon;
  recipientEmail: string;
}): Promise<MailOperationResult> {
  if (!isValidEmail(recipientEmail)) {
    return { success: false, errorCode: "mail_recipient_rejected" };
  }

  const checked = validateMailConfiguration();
  if (!checked.ok) return { success: false, errorCode: checked.errorCode };

  const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  try {
    const transport = createTransport(checked.config);
    await transport.verify();
    const publicUrl = getPublicQuizUrl(salon);
    const info = await transport.sendMail({
      from: { name: checked.config.fromName, address: checked.config.fromEmail },
      to: recipientEmail.trim(),
      subject: "Teste de notificação — Minha Página Pronta",
      text: `Se você recebeu esta mensagem, as notificações por e-mail desta página estão configuradas corretamente.\n\nLanding: ${salon.name}\nDestinatário: ${recipientEmail.trim()}\nData: ${now}\nRemetente utilizado: ${checked.config.fromEmail}`,
      html: `<!doctype html><html lang="pt-BR"><body style="background:#f5f3f0;margin:0;padding:24px 12px;font-family:Arial,sans-serif;color:#282421;"><div style="max-width:600px;margin:0 auto;background:#fff;padding:28px;border-radius:16px;"><div style="color:#7a5b44;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Minha Página Pronta</div><h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.2;margin:12px 0;">Teste de notificação</h1><p style="font-size:15px;line-height:1.7;">Se você recebeu esta mensagem, as notificações por e-mail desta página estão configuradas corretamente.</p><p style="font-size:15px;line-height:1.7;"><strong>Landing:</strong> ${escapeHtml(salon.name)}<br /><strong>Página:</strong> <a href="${escapeHtml(publicUrl)}" style="color:#7a5b44;">${escapeHtml(publicUrl)}</a><br /><strong>Destinatário:</strong> ${escapeHtml(recipientEmail.trim())}<br /><strong>Data:</strong> ${escapeHtml(now)}<br /><strong>Remetente:</strong> ${escapeHtml(checked.config.fromEmail)}</p></div></body></html>`,
    });

    return { success: true, messageId: typeof info.messageId === "string" ? info.messageId : undefined };
  } catch (error) {
    return { success: false, errorCode: classifyMailError(error) };
  }
}

function readMailConfiguration(): MailConfiguration {
  const port = Number(process.env.SMTP_PORT ?? "465");
  return {
    host: process.env.SMTP_HOST?.trim() ?? "",
    port,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() ?? "",
    pass: process.env.SMTP_PASS?.trim() ?? "",
    fromName: process.env.MAIL_FROM_NAME?.trim() ?? "",
    fromEmail: process.env.MAIL_FROM_EMAIL?.trim() ?? "",
  };
}

function createTransport(config: MailConfiguration) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

function getPublicQuizUrl(salon: Salon) {
  const customDomain = normalizeCustomDomain(salon.customDomain);
  if (customDomain) return `https://${customDomain}/`;

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configuredOrigin) return `${configuredOrigin}/p/${salon.slug}`;

  return `/p/${salon.slug}`;
}

function classifyMailError(error: unknown): MailErrorCode {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const responseCode = typeof error === "object" && error && "responseCode" in error ? Number(error.responseCode) : 0;

  if (["EAUTH", "AUTH"].includes(code) || responseCode === 535) return "mail_authentication_failed";
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET"].includes(code)) return "mail_connection_failed";
  if ([550, 551, 553].includes(responseCode)) return "mail_recipient_rejected";
  if (responseCode >= 400 && responseCode < 600) return "mail_rejected";
  return "mail_unknown";
}
