export type QuizEmailAnswer = {
  questionId: string;
  category?: string;
  prompt: string;
  type: string;
  value: unknown;
  selectedOptions?: Array<{ id: string; label: string }>;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export type QuizEmailSubmission = {
  id: string;
  visitorName: string;
  visitorWhatsapp: string;
  visitorCity?: string;
  answers: QuizEmailAnswer[];
  consentAccepted: boolean;
  consentText: string;
  sourceUrl?: string;
  createdAt: string;
};

export type QuizEmailSalon = {
  name: string;
  slug: string;
};

export type QuizTestEmailPayload = {
  recipientEmail: string;
};

export function isValidEmail(value: string) {
  const trimmed = value.trim();
  return trimmed.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatQuizAnswer(answer: QuizEmailAnswer) {
  if (Array.isArray(answer.value)) {
    const labels = answer.selectedOptions?.map((option) => option.label).filter(Boolean);
    return (labels?.length ? labels : answer.value.map(String)).join("\n");
  }

  if (typeof answer.value === "string" && answer.selectedOptions?.length) {
    return answer.selectedOptions.map((option) => option.label).filter(Boolean).join(", ");
  }

  if (answer.type === "scale" && typeof answer.value === "number") {
    const max = answer.scaleMax ?? 5;
    const labels = answer.scaleMinLabel && answer.scaleMaxLabel
      ? ` - entre \"${answer.scaleMinLabel}\" e \"${answer.scaleMaxLabel}\"`
      : "";
    return `${answer.value} de ${max}${labels}`;
  }

  if (answer.value == null) return "";
  return String(answer.value).trim();
}

export function buildWhatsappLink(phone: string, visitorName: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  const message = `Olá, ${visitorName || ""}! Vi as respostas que você enviou pelo meu site e gostaria de conversar melhor sobre seus objetivos.`.trim();
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildQuizNotificationEmail({
  submission,
  salon,
}: {
  submission: QuizEmailSubmission;
  salon: QuizEmailSalon;
}) {
  const visitorName = submission.visitorName.trim();
  const subject = visitorName
    ? `Novo interesse recebido pelo seu site — ${visitorName}`
    : "Novo interesse recebido pelo seu site";
  const answerBlocks = submission.answers
    .map((answer) => ({ answer, value: formatQuizAnswer(answer) }))
    .filter(({ value }) => value.length > 0);
  const whatsappUrl = buildWhatsappLink(submission.visitorWhatsapp, visitorName);
  const createdAt = new Date(submission.createdAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });

  const htmlAnswers = answerBlocks.length
    ? answerBlocks.map(({ answer, value }) => `
      <div style="border-top:1px solid #eee8e2;padding:18px 0 0;margin-top:18px;">
        ${answer.category ? `<div style="color:#7a5b44;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(answer.category)}</div>` : ""}
        <div style="color:#282421;font-size:15px;font-weight:700;line-height:1.45;margin-top:6px;">${escapeHtml(answer.prompt)}</div>
        <div style="color:#645c56;font-size:15px;line-height:1.7;margin-top:7px;white-space:pre-line;">${escapeHtml(value)}</div>
      </div>`).join("")
    : "<p style=\"color:#645c56;font-size:15px;line-height:1.7;\">Nenhuma resposta preenchida.</p>";
  const textAnswers = answerBlocks.length
    ? answerBlocks.map(({ answer, value }) => `${answer.category ? `${answer.category}\n` : ""}${answer.prompt}\n${value}`).join("\n\n")
    : "Nenhuma resposta preenchida.";

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="background:#f5f3f0;margin:0;padding:24px 12px;font-family:Arial,sans-serif;color:#282421;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:28px;border-radius:16px;">
      <div style="border-bottom:1px solid #eee8e2;padding-bottom:20px;">
        <div style="color:#7a5b44;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Novo interesse recebido pelo seu site</div>
        <h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.2;margin:12px 0 0;">Uma nova pessoa concluiu o Teste Interativo da sua página.</h1>
      </div>
      <div style="padding-top:22px;">
        <div style="color:#645c56;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Página</div>
        <p style="font-size:15px;line-height:1.7;margin:8px 0 0;"><strong>${escapeHtml(salon.name)}</strong><br />${escapeHtml(createdAt)}</p>
      </div>
      <div style="border-top:1px solid #eee8e2;margin-top:22px;padding-top:22px;">
        <div style="color:#645c56;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Dados da visitante</div>
        <p style="font-size:15px;line-height:1.7;margin:8px 0 0;">Nome: ${escapeHtml(visitorName || "Não informado")}<br />WhatsApp: ${escapeHtml(submission.visitorWhatsapp)}${submission.visitorCity ? `<br />Cidade: ${escapeHtml(submission.visitorCity)}` : ""}${submission.consentAccepted ? "<br />Consentimento: Aceito" : ""}</p>
      </div>
      <div style="border-top:1px solid #eee8e2;margin-top:22px;padding-top:22px;">
        <div style="color:#645c56;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Respostas do teste</div>
        ${htmlAnswers}
      </div>
      ${whatsappUrl ? `<div style="margin-top:26px;"><a href="${escapeHtml(whatsappUrl)}" style="background:#18804c;border-radius:999px;color:#fff;display:inline-block;font-size:14px;font-weight:700;padding:12px 18px;text-decoration:none;">Conversar pelo WhatsApp</a></div>` : ""}
      <p style="border-top:1px solid #eee8e2;color:#8a817a;font-size:12px;line-height:1.6;margin:28px 0 0;padding-top:18px;">Esta notificação foi enviada automaticamente através do seu site</p>
    </div>
  </body>
</html>`;

  const text = [
    "Novo interesse recebido pelo seu site",
    "",
    "Página:",
    salon.name,
    createdAt,
    "",
    "Nome:",
    visitorName || "Não informado",
    "WhatsApp:",
    submission.visitorWhatsapp,
    ...(submission.visitorCity ? ["Cidade:", submission.visitorCity] : []),
    "",
    "RESPOSTAS",
    "",
    textAnswers,
    ...(whatsappUrl ? ["", "Conversar pelo WhatsApp:", whatsappUrl] : []),
  ].join("\n");

  return { subject, html, text };
}
