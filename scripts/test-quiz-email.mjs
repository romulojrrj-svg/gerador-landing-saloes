import assert from "node:assert/strict";
import {
  buildQuizNotificationEmail,
  buildWhatsappLink,
  isValidEmail,
} from "../src/lib/quiz-email-format.ts";

assert.equal(isValidEmail("lead@example.com"), true);
assert.equal(isValidEmail(" romulojrj2@gmail.com ".trim()), true);
assert.equal(isValidEmail("nome.sobrenome@gmail.com"), true);
assert.equal(isValidEmail("nome+teste@gmail.com"), true);
assert.equal(isValidEmail("contato@empresa.com.br"), true);
assert.equal(isValidEmail("email"), false);
assert.equal(isValidEmail("@email.com"), false);
assert.equal(isValidEmail("nome@"), false);
assert.equal(isValidEmail("nome com espaco@gmail.com"), false);
assert.equal(isValidEmail("invalid"), false);
assert.match(buildWhatsappLink("+5521999999999", "Ana"), /^https:\/\/wa\.me\/5521999999999\?text=/);

const email = buildQuizNotificationEmail({
  salon: { name: "Dra. Exemplo", slug: "dra-exemplo" },
  submission: {
    id: "submission-1",
    visitorName: "Ana <teste>",
    visitorWhatsapp: "+5521999999999",
    visitorCity: "Rio de Janeiro",
    consentAccepted: true,
    consentText: "Autorizo o contato.",
    sourceUrl: "https://example.com/p/dra-exemplo",
    createdAt: "2026-08-02T12:00:00.000Z",
    answers: [
      { questionId: "goal", category: "Objetivo", prompt: "O que você busca?", type: "single_choice", value: "naturalidade", selectedOptions: [{ id: "naturalidade", label: "Naturalidade" }] },
      { questionId: "scale", prompt: "Como você se sente?", type: "scale", value: 4, scaleMax: 5, scaleMinLabel: "Pouco", scaleMaxLabel: "Muito" },
    ],
  },
  recipientEmail: "owner@example.com",
  publicUrl: "https://example.com/p/dra-exemplo",
});

assert.match(email.subject, /Ana/);
assert.match(email.html, /Ana &lt;teste&gt;/);
assert.match(email.html, /Naturalidade/);
assert.match(email.html, /4 de 5/);
assert.match(email.text, /Rio de Janeiro/);
assert.match(email.html, /wa\.me/);
assert.match(email.html, /02\/08\/2026, 09:00/);
assert.doesNotMatch(email.html, /\/p\/dra-exemplo/);
assert.doesNotMatch(email.text, /\/p\/dra-exemplo/);
assert.doesNotMatch(email.html, /NÃ£o exigido|Não exigido/);
assert.match(email.html, /Esta notificação foi enviada automaticamente através do seu site/);
assert.doesNotMatch(email.html, /Esta notificação foi enviada automaticamente pela Minha Página Pronta/);

console.log("quiz email formatter: ok");
