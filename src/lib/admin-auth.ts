const ADMIN_AUTH_COOKIE = "salon_lg_admin";
const ADMIN_AUTH_NAMESPACE = "salon-lg-admin-session";

export function getAdminAuthCookieName() {
  return ADMIN_AUTH_COOKIE;
}

export function isAdminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export async function verifyAdminPassword(password: string) {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!configuredPassword) {
    return false;
  }

  return password === configuredPassword;
}

export async function getAdminSessionToken() {
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!configuredPassword) {
    return null;
  }

  return digestValue(`${ADMIN_AUTH_NAMESPACE}:${configuredPassword}`);
}

export async function isAdminSessionCookieValid(
  cookieValue?: string | null,
) {
  if (!cookieValue) {
    return false;
  }

  const expectedToken = await getAdminSessionToken();

  return Boolean(expectedToken && cookieValue === expectedToken);
}

async function digestValue(value: string) {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(buffer))
    .map((item) => item.toString(16).padStart(2, "0"))
    .join("");
}
