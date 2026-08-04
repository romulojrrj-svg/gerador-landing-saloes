import assert from "node:assert/strict";
import test from "node:test";
import { handleRequest } from "../src/index.ts";
import type { WorkerEnv } from "../src/types.ts";

const env: WorkerEnv = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-for-test-only",
  BREVO_API_KEY: "brevo-key-for-test-only",
  BREVO_SENDER_EMAIL: "notifications@example.com",
  BREVO_SENDER_NAME: "Novo contato - Seu Site",
  ALLOWED_ORIGINS: "https://cliente.example",
};

const salonRow = {
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
        notificationEnabled: true,
        notificationRecipientEmail: "owner@example.com",
        contactNameRequired: true,
        contactCityEnabled: false,
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
};

function request(body: Record<string, unknown>, origin = "https://cliente.example") {
  return new Request("https://quiz.example/quiz-submit", {
    method: "POST",
    headers: { Origin: origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validPayload(submissionId = "22222222-2222-4222-8222-222222222222") {
  return {
    submissionId,
    slug: "clinica-teste",
    visitorName: "Maria",
    visitorWhatsapp: "(21) 99999-9999",
    answers: { objetivo: "natural" },
    consentAccepted: false,
  };
}

function mockFetch({
  salonAvailable = true,
  salonStatus = 200,
  brevoResponses = [true],
  claimAvailable = true,
}: {
  salonAvailable?: boolean;
  salonStatus?: number;
  brevoResponses?: boolean[];
  claimAvailable?: boolean;
} = {}) {
  const original = globalThis.fetch;
  const savedIds = new Set<string>();
  const emailStatuses = new Map<string, "pending" | "sent" | "skipped" | "failed">();
  const emailClaims = new Map<string, string>();
  let successfulInsertCount = 0;
  let brevoCount = 0;
  let lastBrevoBody: Record<string, unknown> | null = null;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/rest/v1/salons?")) {
      return new Response(JSON.stringify(salonAvailable ? [salonRow] : []), { status: salonStatus });
    }
    if (url.includes("/rest/v1/salon_quiz_submissions?select=id")) {
      const id = new URL(url).searchParams.get("id")?.replace("eq.", "") ?? "";
      return new Response(JSON.stringify(savedIds.has(id) ? [{ id }] : []), { status: 200 });
    }
    if (url.endsWith("/rest/v1/salon_quiz_submissions") && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { id: string };
      if (savedIds.has(body.id)) return new Response(null, { status: 409 });
      savedIds.add(body.id);
      successfulInsertCount += 1;
      return new Response(null, { status: 201 });
    }
    if (url.endsWith("/rest/v1/rpc/claim_quiz_email_notification") && init?.method === "POST") {
      if (!claimAvailable) return new Response(JSON.stringify({}), { status: 404 });
      const body = JSON.parse(String(init.body)) as { p_submission_id: string; p_claim_id: string };
      const status = emailStatuses.get(body.p_submission_id) ?? null;
      if (status === "sent" || status === "skipped" || status === "pending") {
        return new Response(JSON.stringify([{ claimed: false, email_status: status }]), { status: 200 });
      }
      emailStatuses.set(body.p_submission_id, "pending");
      emailClaims.set(body.p_submission_id, body.p_claim_id);
      return new Response(JSON.stringify([{ claimed: true, email_status: "pending" }]), { status: 200 });
    }
    if (url.includes("/rest/v1/salon_quiz_submissions?") && init?.method === "PATCH") {
      const id = new URL(url).searchParams.get("id")?.replace("eq.", "") ?? "";
      const claimId = new URL(url).searchParams.get("email_notification_claim_id")?.replace("eq.", "");
      const body = JSON.parse(String(init.body)) as { email_notification_status?: "sent" | "failed" | "skipped" };
      if (claimId && emailClaims.get(id) !== claimId) return new Response(JSON.stringify([]), { status: 200 });
      if (body.email_notification_status) emailStatuses.set(id, body.email_notification_status);
      if (claimId) emailClaims.delete(id);
      return new Response(JSON.stringify([{ id }]), { status: 200 });
    }
    if (url === "https://api.brevo.com/v3/smtp/email") {
      lastBrevoBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      const ok = brevoResponses[brevoCount] ?? brevoResponses.at(-1) ?? true;
      brevoCount += 1;
      return new Response(JSON.stringify(ok ? { messageId: `test-message-${brevoCount}` } : {}), { status: ok ? 201 : 503 });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };
  return {
    insertCount: () => successfulInsertCount,
    brevoCount: () => brevoCount,
    emailStatus: (id: string) => emailStatuses.get(id),
    lastBrevoBody: () => lastBrevoBody,
    restore: () => { globalThis.fetch = original; },
  };
}

test("rejects unknown origins before reading Supabase", async () => {
  const result = await handleRequest(request(validPayload(), "https://attacker.example"), env);
  assert.equal(result.status, 403);
});

test("rejects an invalid slug without reading Supabase", async () => {
  const result = await handleRequest(request({ ...validPayload(), slug: "INVALID SLUG" }), env);
  assert.equal(result.status, 400);
});

test("answers CORS preflight only for an allowed origin", async () => {
  const result = await handleRequest(new Request("https://quiz.example/quiz-submit", {
    method: "OPTIONS",
    headers: { Origin: "https://cliente.example" },
  }), env);
  assert.equal(result.status, 204);
  assert.equal(result.headers.get("access-control-allow-origin"), "https://cliente.example");
});

test("rejects CORS preflight from an unauthorized origin", async () => {
  const result = await handleRequest(new Request("https://quiz.example/quiz-submit", {
    method: "OPTIONS",
    headers: { Origin: "https://attacker.example" },
  }), env);
  assert.equal(result.status, 403);
  assert.equal(result.headers.get("access-control-allow-origin"), null);
});

test("rejects a payload that does not satisfy the saved question", async () => {
  const mock = mockFetch();
  try {
    const result = await handleRequest(request({ ...validPayload(), answers: { objetivo: "unknown" } }), env);
    assert.equal(result.status, 400);
    assert.equal(mock.insertCount(), 0);
  } finally {
    mock.restore();
  }
});

test("saves the lead even when Brevo fails after persistence", async () => {
  const mock = mockFetch({ brevoResponses: [false] });
  try {
    const result = await handleRequest(request(validPayload()), env);
    assert.equal(result.status, 201);
    assert.deepEqual(await result.json(), { ok: true, saved: true, emailSent: false });
    assert.equal(mock.insertCount(), 1);
    assert.equal(mock.brevoCount(), 1);
    assert.equal(mock.emailStatus(validPayload().submissionId), "failed");
    assert.deepEqual(mock.lastBrevoBody()?.headers, { "Idempotency-Key": validPayload().submissionId });
  } finally {
    mock.restore();
  }
});

test("retries a failed email with the same submission id without duplicating the lead", async () => {
  const mock = mockFetch({ brevoResponses: [false, true] });
  try {
    const first = await handleRequest(request(validPayload()), env);
    const second = await handleRequest(request(validPayload()), env);
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.deepEqual(await second.json(), { ok: true, saved: true, emailSent: true, duplicate: true });
    assert.equal(mock.insertCount(), 1);
    assert.equal(mock.brevoCount(), 2);
    assert.equal(mock.emailStatus(validPayload().submissionId), "sent");
  } finally {
    mock.restore();
  }
});

test("does not resend an email already marked as sent", async () => {
  const mock = mockFetch();
  try {
    const first = await handleRequest(request(validPayload()), env);
    const second = await handleRequest(request(validPayload()), env);
    assert.equal(first.status, 201);
    assert.equal(second.status, 200);
    assert.deepEqual(await second.json(), { ok: true, saved: true, emailSent: true, duplicate: true });
    assert.equal(mock.insertCount(), 1);
    assert.equal(mock.brevoCount(), 1);
  } finally {
    mock.restore();
  }
});

test("uses a single email claim for simultaneous duplicate requests", async () => {
  const mock = mockFetch();
  try {
    const [first, second] = await Promise.all([
      handleRequest(request(validPayload()), env),
      handleRequest(request(validPayload()), env),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [200, 201]);
    assert.equal(mock.insertCount(), 1);
    assert.equal(mock.brevoCount(), 1);
  } finally {
    mock.restore();
  }
});

test("reports an inactive or unavailable quiz without inserting", async () => {
  const mock = mockFetch({ salonAvailable: false });
  try {
    const result = await handleRequest(request(validPayload()), env);
    assert.equal(result.status, 404);
    assert.equal(mock.insertCount(), 0);
  } finally {
    mock.restore();
  }
});

test("returns a retryable error when Supabase is unavailable", async () => {
  const mock = mockFetch({ salonStatus: 503 });
  try {
    const result = await handleRequest(request(validPayload()), env);
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { ok: false, error: "Nao foi possivel processar o envio." });
    assert.equal(mock.insertCount(), 0);
  } finally {
    mock.restore();
  }
});

test("does not send mail when the durable email claim migration is unavailable", async () => {
  const mock = mockFetch({ claimAvailable: false });
  try {
    const result = await handleRequest(request(validPayload()), env);
    assert.equal(result.status, 201);
    assert.deepEqual(await result.json(), { ok: true, saved: true, emailSent: false });
    assert.equal(mock.insertCount(), 1);
    assert.equal(mock.brevoCount(), 0);
  } finally {
    mock.restore();
  }
});
