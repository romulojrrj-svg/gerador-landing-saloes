export const MAX_PAYLOAD_BYTES = 4_096;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PIXEL_ID_PATTERN = /^\d{5,20}$/;
const GRAPH_API_VERSION_PATTERN = /^v\d+\.\d+$/;
const FBP_PATTERN = /^fb\.1\.\d{10,16}\.\d+$/i;
const FBC_PATTERN = /^fb\.1\.\d{10,16}\.[A-Za-z0-9_-]+$/i;
const eventNames = new Set(["PageView", "Contact", "Lead"]);

export type MetaEventName = "PageView" | "Contact" | "Lead";

export type ValidatedMetaEvent = {
  eventName: MetaEventName;
  eventId: string;
  eventSourceUrl: string;
  fbp?: string;
  fbc?: string;
};

export type WorkerConfig = {
  accessToken: string;
  pixelId: string;
  graphApiVersion: string;
  testEventCode?: string;
};

export function parseAllowedOrigins(value: string) {
  return new Set(
    value
      .split(",")
      .map(normalizeOrigin)
      .filter((origin) => isValidOrigin(origin)),
  );
}

export function isAllowedOrigin(origin: string | null, allowedOrigins: Set<string>) {
  return Boolean(origin && allowedOrigins.has(normalizeOrigin(origin)));
}

export function validateEventPayload(
  value: unknown,
): { ok: true; event: ValidatedMetaEvent } | { ok: false } {
  if (!isRecord(value)) return { ok: false };
  const allowedKeys = new Set(["eventName", "eventId", "eventSourceUrl", "fbp", "fbc"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return { ok: false };

  const eventName = string(value.eventName);
  const eventId = string(value.eventId);
  const eventSourceUrl = normalizeSourceUrl(value.eventSourceUrl);
  if (!eventNames.has(eventName) || !UUID_PATTERN.test(eventId) || !eventSourceUrl) {
    return { ok: false };
  }

  return {
    ok: true,
    event: {
      eventName: eventName as MetaEventName,
      eventId,
      eventSourceUrl,
      ...(isValidFbp(value.fbp) ? { fbp: value.fbp } : {}),
      ...(isValidFbc(value.fbc) ? { fbc: value.fbc } : {}),
    },
  };
}

export function readWorkerConfig(env: Record<string, string | undefined>) {
  const accessToken = string(env.META_ACCESS_TOKEN);
  const pixelId = string(env.META_PIXEL_ID);
  const graphApiVersion = string(env.META_GRAPH_API_VERSION);
  const testEventCode = string(env.META_TEST_EVENT_CODE);

  if (!accessToken || !PIXEL_ID_PATTERN.test(pixelId) || !GRAPH_API_VERSION_PATTERN.test(graphApiVersion)) {
    return null;
  }

  return {
    accessToken,
    pixelId,
    graphApiVersion,
    ...(testEventCode ? { testEventCode: testEventCode.slice(0, 200) } : {}),
  } satisfies WorkerConfig;
}

export function isValidFbp(value: unknown): value is string {
  return typeof value === "string" && FBP_PATTERN.test(value);
}

export function isValidFbc(value: unknown): value is string {
  return typeof value === "string" && FBC_PATTERN.test(value);
}

function normalizeOrigin(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isValidOrigin(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.pathname.replace(/^\/$/, "") &&
      !url.search &&
      !url.hash;
  } catch {
    return false;
  }
}

function normalizeSourceUrl(value: unknown) {
  const candidate = string(value);
  if (!candidate || candidate.length > 2_048) return "";

  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
