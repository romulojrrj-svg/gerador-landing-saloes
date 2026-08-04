import assert from "node:assert/strict";
import test from "node:test";
import {
  isAllowedOrigin,
  parseAllowedOrigins,
  readWorkerConfig,
  validateEventPayload,
} from "../src/validation.ts";

const eventId = "f0c24d75-75a4-4c6c-a5b0-5021c094dd87";

test("allows only explicitly configured origins", () => {
  const origins = parseAllowedOrigins("https://dra-julia.example,http://localhost:4173");
  assert.equal(isAllowedOrigin("https://dra-julia.example", origins), true);
  assert.equal(isAllowedOrigin("https://other.example", origins), false);
  assert.equal(isAllowedOrigin(null, origins), false);
});

test("accepts only the minimal Meta event payload", () => {
  const result = validateEventPayload({
    eventName: "Contact",
    eventId,
    eventSourceUrl: "https://dra-julia.example/",
    fbp: "fb.1.1710000000000.123456789",
    fbc: "fb.1.1710000000000.ABCdef_123",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.event.eventName, "Contact");
});

test("rejects arbitrary fields and event names", () => {
  assert.equal(
    validateEventPayload({
      eventName: "Purchase",
      eventId,
      eventSourceUrl: "https://dra-julia.example/",
    }).ok,
    false,
  );
  assert.equal(
    validateEventPayload({
      eventName: "Lead",
      eventId,
      eventSourceUrl: "https://dra-julia.example/",
      visitorPhone: "+55 11 99999-9999",
    }).ok,
    false,
  );
});

test("requires valid Worker configuration without exposing it", () => {
  assert.equal(
    readWorkerConfig({
      META_ACCESS_TOKEN: "token",
      META_PIXEL_ID: "1234567890",
      META_GRAPH_API_VERSION: "v23.0",
    })?.pixelId,
    "1234567890",
  );
  assert.equal(readWorkerConfig({ META_ACCESS_TOKEN: "token" }), null);
});
