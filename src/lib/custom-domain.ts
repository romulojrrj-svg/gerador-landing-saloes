export function normalizeCustomDomain(value?: string | null) {
  const rawValue = value?.trim().toLowerCase();

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = new URL(
      rawValue.includes("://") ? rawValue : `https://${rawValue}`,
    );
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");

    if (
      !hostname ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".vercel.app") ||
      !hostname.includes(".") ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    return hostname;
  } catch {
    return null;
  }
}

export function isCustomDomainForSalon(
  requestHost: string | null | undefined,
  customDomain: string | null | undefined,
) {
  const normalizedHost = normalizeCustomDomain(requestHost);
  const normalizedDomain = normalizeCustomDomain(customDomain);

  return Boolean(normalizedHost && normalizedDomain && normalizedHost === normalizedDomain);
}
