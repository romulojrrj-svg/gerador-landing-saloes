"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readPublicMetaIntegration } from "../../lib/meta-config";
import type { StaticMetaIntegration } from "../../lib/types";

const CONSENT_STORAGE_KEY = "salon-marketing-consent-v1";
const NOTICE_STORAGE_KEY = "salon-meta-notice-dismissed-v1";
const PREFERENCES_EVENT = "salon:open-cookie-preferences";
const CONSENT_CHANGE_EVENT = "salon:marketing-consent-changed";
const NOTICE_CHANGE_EVENT = "salon:meta-notice-changed";
let volatileConsent: Consent = null;
let volatileNoticeDismissed = false;

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

type MetaTrackingProps = {
  config?: StaticMetaIntegration;
  automatic?: boolean;
  privacyUrl?: string;
};

export function MetaTracking({
  config,
  automatic = false,
  privacyUrl,
}: MetaTrackingProps) {
  const integration = readPublicMetaIntegration(config);
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, () => null);
  const noticeDismissed = useSyncExternalStore(
    subscribeToNotice,
    readNoticeDismissed,
    () => false,
  );
  const [endReached, setEndReached] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!automatic || noticeDismissed) return;

    const main = document.querySelector("main");
    if (!main) return;

    const sentinel = document.createElement("span");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.dataset.metaNoticeEndSentinel = "true";
    Object.assign(sentinel.style, {
      display: "block",
      width: "1px",
      height: "1px",
      marginTop: "-1px",
      opacity: "0",
      pointerEvents: "none",
    });
    main.appendChild(sentinel);

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        setEndReached(true);
        observer.disconnect();
      });
      observer.observe(sentinel);
      return () => {
        observer.disconnect();
        sentinel.remove();
      };
    }

    const checkPageEnd = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 16) {
        setEndReached(true);
        window.removeEventListener("scroll", checkPageEnd);
        window.removeEventListener("resize", checkPageEnd);
      }
    };
    window.addEventListener("scroll", checkPageEnd, { passive: true });
    window.addEventListener("resize", checkPageEnd);
    checkPageEnd();

    return () => {
      window.removeEventListener("scroll", checkPageEnd);
      window.removeEventListener("resize", checkPageEnd);
      sentinel.remove();
    };
  }, [automatic, noticeDismissed]);

  useEffect(() => {
    if (!integration || automatic) return;

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
  }, [automatic, integration]);

  useEffect(() => {
    const activeIntegration = integration;
    if (!activeIntegration || (!automatic && consent !== "accepted")) return;

    ensurePixel(activeIntegration.pixelId);
    const state = getPixelState();
    if (!state.pageViewSent) {
      state.pageViewSent = true;
      sendMetaEvent(activeIntegration, activeIntegration.pageViewEventName);
    }
  }, [automatic, consent, integration]);

  useEffect(() => {
    const activeIntegration = integration;
    if (!activeIntegration || (!automatic && consent !== "accepted")) return;

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
  }, [automatic, consent, integration]);

  if (automatic) {
    if (!integration || noticeDismissed || !endReached) return null;

    return (
      <aside
        role="status"
        aria-label="Informação de privacidade"
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[10001] mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-full border border-zinc-200/80 bg-white/95 px-3.5 py-2 text-[0.68rem] leading-4 text-zinc-600 shadow-lg backdrop-blur sm:bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-4 sm:py-2.5"
      >
        <p className="min-w-0">
          Este site utiliza tecnologias de medição para analisar resultados e
          melhorar anúncios.
          {privacyUrl ? (
            <a
              href={privacyUrl}
              className="ml-2 whitespace-nowrap font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 transition hover:text-zinc-950"
            >
              Privacidade
            </a>
          ) : null}
        </p>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={dismissNotice}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
        >
          <span aria-hidden="true">×</span>
        </button>
      </aside>
    );
  }

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

function readNoticeDismissed() {
  try {
    if (window.localStorage.getItem(NOTICE_STORAGE_KEY) === "1") return true;
  } catch {
    // Fall through to the current-page value when storage is unavailable.
  }
  return volatileNoticeDismissed;
}

function subscribeToNotice(onStoreChange: () => void) {
  window.addEventListener(NOTICE_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(NOTICE_CHANGE_EVENT, onStoreChange);
}

function dismissNotice() {
  volatileNoticeDismissed = true;
  try {
    window.localStorage.setItem(NOTICE_STORAGE_KEY, "1");
  } catch {
    // The dismissal still applies to the current page when storage is unavailable.
  }
  window.dispatchEvent(new Event(NOTICE_CHANGE_EVENT));
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
