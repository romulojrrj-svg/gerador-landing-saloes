"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { readPublicMetaIntegration } from "../../lib/meta-config";
import type { StaticMetaIntegration } from "../../lib/types";

const CONSENT_STORAGE_KEY = "salon-marketing-consent-v1";
const PREFERENCES_EVENT = "salon:open-cookie-preferences";
const CONSENT_CHANGE_EVENT = "salon:marketing-consent-changed";
let volatileConsent: Consent = null;

type Consent = "accepted" | "rejected" | null;
type MetaPixelQueue = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelQueue;
    _fbq?: MetaPixelQueue;
    __salonMetaPixelState?: {
      initializedPixelIds: Set<string>;
      scriptRequested: boolean;
      pageViewSent: boolean;
    };
  }
}

export function MetaTracking({ config }: { config?: StaticMetaIntegration }) {
  const integration = readPublicMetaIntegration(config);
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!integration) return;

    function openPreferences() {
      volatileConsent = null;
      try {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      } catch {
        // The in-memory value still allows preferences to be changed now.
      }
      window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    }

    window.addEventListener(PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(PREFERENCES_EVENT, openPreferences);
  }, [integration]);

  useEffect(() => {
    const activeIntegration = integration;
    if (!activeIntegration || consent !== "accepted") return;

    ensurePixel(activeIntegration.pixelId);
    const state = getPixelState();
    if (!state.pageViewSent) {
      state.pageViewSent = true;
      sendMetaEvent(activeIntegration, activeIntegration.pageViewEventName);
    }
  }, [consent, integration]);

  useEffect(() => {
    const activeIntegration = integration;
    if (!activeIntegration || consent !== "accepted") return;

    function trackWhatsappClick(event: MouseEvent) {
      if (!activeIntegration) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || !isWhatsappHref(anchor.href)) return;

      // Do not await or prevent navigation: WhatsApp must open normally even
      // when either Meta endpoint is slow or unavailable.
      sendMetaEvent(activeIntegration, activeIntegration.contactEventName);
    }

    document.addEventListener("click", trackWhatsappClick, true);
    return () => document.removeEventListener("click", trackWhatsappClick, true);
  }, [consent, integration]);

  if (!integration || consent !== null) return null;

  return (
    <section
      role="region"
      aria-label="Preferências de cookies"
      className="fixed inset-x-4 bottom-4 z-[10001] mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl sm:bottom-6"
    >
      <p className="font-serif text-lg">Cookies de marketing</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">
        Com sua autorização, usamos a Meta para medir visitas e contatos pelo
        WhatsApp. Você pode mudar esta preferência a qualquer momento.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => saveConsent("accepted")}
          className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-950"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => saveConsent("rejected")}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-950"
        >
          Rejeitar
        </button>
      </div>
    </section>
  );
}

export function CookiePreferencesLink({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  return (
    <button
      type="button"
      className="text-xs text-[#bba49b] underline decoration-[#bba49b]/50 underline-offset-4 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#281916]"
      onClick={() => window.dispatchEvent(new Event(PREFERENCES_EVENT))}
    >
      Preferências de cookies
    </button>
  );
}

function readConsent(): Consent {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === "accepted" || value === "rejected") return value;
  } catch {
    // Fall through to the current-page value when storage is unavailable.
  }
  return volatileConsent;
}

function subscribeToConsent(onStoreChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
}

function saveConsent(value: Exclude<Consent, null>) {
  volatileConsent = value;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Consent still applies to the current page even if storage is unavailable.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
}

function getPixelState() {
  if (!window.__salonMetaPixelState) {
    window.__salonMetaPixelState = {
      initializedPixelIds: new Set<string>(),
      scriptRequested: false,
      pageViewSent: false,
    };
  }
  return window.__salonMetaPixelState;
}

function ensurePixel(pixelId: string) {
  const state = getPixelState();
  const fbq = getFbq();

  if (!state.initializedPixelIds.has(pixelId)) {
    fbq("init", pixelId);
    state.initializedPixelIds.add(pixelId);
  }

  if (state.scriptRequested) return;
  if (document.querySelector('script[src="https://connect.facebook.net/en_US/fbevents.js"]')) {
    state.scriptRequested = true;
    return;
  }
  state.scriptRequested = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.dataset.salonMetaPixel = "true";
  document.head.appendChild(script);
}

function getFbq(): MetaPixelQueue {
  if (window.fbq) return window.fbq;

  const queue = ((...args: unknown[]) => {
    if (queue.callMethod) {
      queue.callMethod(...args);
      return;
    }
    queue.queue?.push(args);
  }) as MetaPixelQueue;
  queue.queue = [];
  queue.loaded = true;
  queue.version = "2.0";
  window.fbq = queue;
  window._fbq = queue;
  return queue;
}

function sendMetaEvent(integration: StaticMetaIntegration, eventName: "PageView" | "Contact" | "Lead") {
  const eventId = crypto.randomUUID();
  const fbq = getFbq();
  fbq("track", eventName, {}, { eventID: eventId });

  const payload = {
    eventName,
    eventId,
    eventSourceUrl: window.location.href,
    ...readFacebookCookies(),
  };

  try {
    void fetch(integration.capiEndpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  } catch {
    // Fetch support or network failures must never affect the landing flow.
  }
}

function readFacebookCookies() {
  const values = Object.fromEntries(
    document.cookie
      .split(";")
      .map((item) => item.trim().split(/=(.*)/, 2))
      .filter(([name]) => name === "_fbp" || name === "_fbc"),
  );
  const fbp = values._fbp;
  const fbc = values._fbc;

  return {
    ...(isValidFbp(fbp) ? { fbp } : {}),
    ...(isValidFbc(fbc) ? { fbc } : {}),
  };
}

function isValidFbp(value: unknown): value is string {
  return typeof value === "string" && /^fb\.1\.\d{10,16}\.\d+$/i.test(value);
}

function isValidFbc(value: unknown): value is string {
  return typeof value === "string" && /^fb\.1\.\d{10,16}\.[A-Za-z0-9_-]+$/i.test(value);
}

function isWhatsappHref(href: string) {
  try {
    const url = new URL(href, window.location.href);
    return ["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname);
  } catch {
    return false;
  }
}
