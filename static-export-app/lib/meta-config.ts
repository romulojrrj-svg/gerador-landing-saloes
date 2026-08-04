import type { StaticMetaIntegration } from "./types";

const PIXEL_ID_PATTERN = /^\d{5,20}$/;

/**
 * Defense in depth for the generated JSON. The exporter already emits a
 * filtered configuration, but browser code must not trust data blindly.
 */
export function readPublicMetaIntegration(
  value: unknown,
): StaticMetaIntegration | undefined {
  if (!isRecord(value) || value.enabled !== true) {
    return undefined;
  }

  const pixelId = stringValue(value.pixelId);
  const capiEndpoint = safeEndpoint(value.capiEndpoint);
  const pageViewEventName = value.pageViewEventName;
  const contactEventName = value.contactEventName;

  if (
    !PIXEL_ID_PATTERN.test(pixelId) ||
    !capiEndpoint ||
    pageViewEventName !== "PageView" ||
    (contactEventName !== "Contact" && contactEventName !== "Lead")
  ) {
    return undefined;
  }

  return {
    enabled: true,
    pixelId,
    capiEndpoint,
    pageViewEventName,
    contactEventName,
  };
}

function safeEndpoint(value: unknown) {
  const candidate = stringValue(value);

  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/meta-event"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
