import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthCookieName, isAdminSessionCookieValid } from "@/lib/admin-auth";
import { getAdminSalonBySlug } from "@/lib/admin-salons";
import { normalizeInteractiveQuizConfig } from "@/lib/interactive-quiz";
import { isValidEmail, type QuizTestEmailPayload } from "@/lib/quiz-email-format";
import { sendQuizTestEmail } from "@/lib/quiz-email";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const authError = await ensureAdminRequest(request);
  if (authError) return authError;

  const { slug } = await context.params;
  const result = await getAdminSalonBySlug(slug);
  if (!result.ok) return NextResponse.json({ ok: false, error: "Salão não encontrado." }, { status: 404 });
  if (result.salon.templateVersion !== "premium_editorial_v2") {
    return NextResponse.json({ ok: false, error: "O e-mail de teste está disponível apenas no Premium Editorial 2." }, { status: 400 });
  }

  const config = normalizeInteractiveQuizConfig(result.salon.premiumEditorial.interactiveQuiz);
  const savedRecipientEmail = config?.notificationRecipientEmail?.trim() ?? "";
  const body = await readTestEmailBody(request);
  const recipientEmail = body
    ? String(body.recipientEmail ?? "").trim()
    : savedRecipientEmail;
  if (!config || !isValidEmail(recipientEmail)) {
    return NextResponse.json({ ok: false, error: "Informe um e-mail válido para realizar o teste." }, { status: 400 });
  }

  const mailResult = await sendQuizTestEmail({ salon: result.salon, recipientEmail });
  if (!mailResult.success) {
    return NextResponse.json({ ok: false, error: friendlyMailError(mailResult.errorCode) }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

async function readTestEmailBody(request: NextRequest): Promise<Partial<QuizTestEmailPayload> | undefined> {
  try {
    const body = await request.json() as Partial<QuizTestEmailPayload>;
    if (!body || typeof body !== "object" || Array.isArray(body) || !Object.prototype.hasOwnProperty.call(body, "recipientEmail")) {
      return undefined;
    }
    return body;
  } catch {
    return undefined;
  }
}

async function ensureAdminRequest(request: NextRequest) {
  const cookie = request.cookies.get(getAdminAuthCookieName())?.value;
  return await isAdminSessionCookieValid(cookie)
    ? null
    : NextResponse.json({ ok: false, error: "Acesso interno nao autenticado." }, { status: 401 });
}

function friendlyMailError(code?: string) {
  if (code === "mail_config_missing") return "As credenciais de envio de e-mail ainda não foram configuradas no ambiente.";
  if (code === "mail_config_invalid") return "A configuração do remetente de e-mail é inválida.";
  if (code === "mail_authentication_failed") return "Não foi possível autenticar o remetente. Verifique o e-mail e a Senha de app.";
  if (code === "mail_connection_failed") return "Não foi possível conectar ao servidor de e-mail.";
  if (code === "mail_recipient_rejected") return "O destinatário informado foi rejeitado pelo servidor de e-mail.";
  if (code === "mail_rejected") return "Não foi possível enviar o e-mail de teste. Tente novamente.";
  return "Não foi possível enviar o e-mail de teste. Tente novamente.";
}
