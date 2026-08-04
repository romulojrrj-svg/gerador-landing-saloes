import assert from "node:assert/strict";
import test from "node:test";
import { getWorkerSalon, isAllowedOrigin, parseAllowedOrigins, validateSubmission } from "../src/validation.ts";

const salon = getWorkerSalon({
  id: "11111111-1111-4111-8111-111111111111",
  slug: "clinica-teste",
  name: "Clinica teste",
  status: "published",
  updated_at: "2026-08-03T12:00:00.000Z",
  metadata: {
    templateVersion: "premium_editorial_v2",
    premiumEditorial: {
      interactiveQuiz: {
        enabled: true,
        contactNameRequired: true,
        contactCityEnabled: true,
        contactCityRequired: false,
        contactConsentRequired: false,
        defaultCountryCode: "+55",
        questions: [{
          id: "objetivo",
          type: "single_choice",
          prompt: "Qual e seu objetivo?",
          required: true,
          options: [{ id: "natural", label: "Naturalidade" }],
        }],
      },
    },
  },
});

test("accepts an allowed origin only", () => {
  const allowed = parseAllowedOrigins(" https://site.example/ , http://localhost:3000/// ");
  assert.equal(isAllowedOrigin("https://site.example///", allowed), true);
  assert.equal(isAllowedOrigin("https://other.example", allowed), false);
});

test("validates a complete submission", () => {
  assert.ok(salon);
  const result = validateSubmission({
    submissionId: "22222222-2222-4222-8222-222222222222",
    slug: "clinica-teste",
    visitorName: "Maria",
    visitorWhatsapp: "(21) 99999-9999",
    visitorCity: "Rio de Janeiro",
    answers: { objetivo: "natural" },
    consentAccepted: false,
  }, salon);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.submission.visitorWhatsapp, "+5521999999999");
});

test("rejects a duplicate-shaped invalid submission id", () => {
  assert.ok(salon);
  const result = validateSubmission({
    submissionId: "not-a-uuid",
    slug: "clinica-teste",
    visitorName: "Maria",
    visitorWhatsapp: "21999999999",
    answers: { objetivo: "natural" },
    consentAccepted: false,
  }, salon);
  assert.equal(result.ok, false);
});
