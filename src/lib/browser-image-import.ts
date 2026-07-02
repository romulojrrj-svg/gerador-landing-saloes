import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { BrowserContext, Page } from "playwright-core";
import type {
  ImportedImageCandidate,
  ImportSource,
  PublicImageImportDebug,
  PublicImageImportResult,
} from "@/lib/public-image-import";

type CollectorSource = "instagram" | "google";

type BrowserCollectorOptions = {
  maxPosts?: number;
  maxScrolls?: number;
  maxOpenedPosts?: number;
};

type BrowserVisibleImage = {
  src: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  collectorOrigin:
    | "feed"
    | "post"
    | "carousel"
    | "highlight"
    | "avatar"
    | "unknown";
  collectorContext?: string;
};

type BrowserCollectorState = {
  context?: BrowserContext;
  channel?: string;
  profileDir?: string;
  pending?: Promise<{
    context: BrowserContext;
    channel: string;
    profileDir: string;
  }>;
};

declare global {
  var __salonBrowserCollector__: BrowserCollectorState | undefined;
}

export async function collectBrowserImages(
  source: CollectorSource,
  url: string,
  options?: BrowserCollectorOptions,
): Promise<PublicImageImportResult> {
  const debug: PublicImageImportDebug = {
    source,
    requestedUrl: url.trim(),
    rawCandidates: 0,
    filteredCandidates: 0,
    notes: [],
  };

  if (!url.trim()) {
    return {
      success: false,
      source,
      candidates: [],
      error:
        source === "instagram"
          ? "Preencha o link do Instagram antes de buscar."
          : "Preencha o link do Google Maps antes de buscar.",
      errorType: "missing_url",
      debug,
    };
  }

  const normalizedUrl = safeNormalizeUrl(url);

  if (!normalizedUrl) {
    return {
      success: false,
      source,
      candidates: [],
      error: "O link informado parece invalido para essa fonte.",
      errorType: "invalid_url",
      debug,
    };
  }

  debug.resolvedUrl = normalizedUrl;

  try {
    const contextState = await ensureBrowserCollectorState();
    const page = await contextState.context.newPage();
    const stats = {
      feedImages: 0,
      highlightIgnored: 0,
      avatarIgnored: 0,
      postsOpened: 0,
      rawRejected: 0,
      accepted: 0,
    };

    await page.goto(normalizedUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(2500);

    if (source === "instagram" && (await detectInstagramLoginRequired(page))) {
      debug.notes.push("Instagram pediu login antes de expor o conteudo.");

      return {
        success: false,
        source,
        candidates: [],
        error:
          "O Instagram pediu login. Faça login manualmente na janela do navegador local aberta e clique novamente em analisar.",
        errorType: "blocked",
        debug,
      };
    }

    const rawCandidates =
      source === "instagram"
        ? await collectInstagramPageCandidates(page, normalizedUrl, {
            maxPosts:
              options?.maxPosts ??
              (process.env.NODE_ENV === "development" ? 60 : 36),
            maxScrolls:
              options?.maxScrolls ??
              (process.env.NODE_ENV === "development" ? 10 : 8),
            maxOpenedPosts:
              options?.maxOpenedPosts ??
              (process.env.NODE_ENV === "development" ? 16 : 12),
          }, stats)
        : await collectGooglePageCandidates(page, normalizedUrl, {
            maxScrolls: options?.maxScrolls ?? 3,
          });

    debug.rawCandidates = rawCandidates.length;
    const filteredCandidates = filterBrowserCandidates(rawCandidates, source, stats);
    debug.filteredCandidates = filteredCandidates.length;
    debug.stats = {
      ...stats,
      rawCandidates: rawCandidates.length,
      filteredCandidates: filteredCandidates.length,
      rejected: stats.rawRejected + stats.highlightIgnored + stats.avatarIgnored,
    };
    debug.notes.push(
      `Coletadas ${rawCandidates.length} imagens visiveis no navegador e ${filteredCandidates.length} apos filtros.`,
    );
    if (source === "instagram") {
      debug.notes.push(
        `Feed detectado: ${stats.feedImages}. Highlights ignorados: ${stats.highlightIgnored}. Avatar/imagens de perfil ignorados: ${stats.avatarIgnored}. Posts abertos: ${stats.postsOpened}.`,
      );
    }
    debug.notes.push(`Canal do navegador: ${contextState.channel}.`);

    if (!filteredCandidates.length) {
      return {
        success: false,
        source,
        candidates: [],
        error:
          source === "instagram"
            ? "Nao encontramos fotos publicas aproveitaveis nesta tela do Instagram. Tente abrir um perfil mais completo, fazer login manualmente ou usar o modo rapido/manual."
            : "Nao encontramos fotos publicas aproveitaveis nesta tela do Google. Tente abrir a area de fotos do perfil ou usar o modo rapido/manual.",
        errorType: "no_images",
        debug,
      };
    }

    return {
      success: true,
      source,
      candidates: filteredCandidates,
      debug,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao iniciar o navegador local.";
    debug.notes.push(message);

    return {
      success: false,
      source,
      candidates: [],
      error: message,
      errorType: "internal",
      debug,
    };
  }
}

async function ensureBrowserCollectorState() {
  const globalState = (globalThis.__salonBrowserCollector__ ??= {});

  if (globalState.context) {
    return {
      context: globalState.context,
      channel: globalState.channel ?? "chrome",
      profileDir: globalState.profileDir,
    };
  }

  if (globalState.pending) {
    return globalState.pending;
  }

  const profileDir = path.join(process.cwd(), ".local-browser-profile");
  globalState.pending = (async () => {
    await mkdir(profileDir, { recursive: true });
    const context = await createPersistentContext(profileDir);

    globalState.context = context.context;
    globalState.channel = context.channel;
    globalState.profileDir = profileDir;

    return {
      context: context.context,
      channel: context.channel,
      profileDir,
    };
  })();

  try {
    return await globalState.pending;
  } finally {
    globalState.pending = undefined;
  }
}

async function createPersistentContext(profileDir: string) {
  const playwright = await import("playwright-core");
  const chromium = playwright.chromium;
  const launchOptionsBase = {
    headless: false,
    viewport: { width: 1440, height: 960 },
    args: ["--window-size=1440,960"],
  };
  const executablePath = process.env.LOCAL_BROWSER_EXECUTABLE_PATH;

  if (executablePath) {
    const context = await chromium.launchPersistentContext(profileDir, {
      ...launchOptionsBase,
      executablePath,
    });

    return { context, channel: "custom-executable" };
  }

  for (const channel of ["chrome", "msedge"]) {
    try {
      const context = await chromium.launchPersistentContext(profileDir, {
        ...launchOptionsBase,
        channel,
      });

      return { context, channel };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Nao foi possivel abrir um navegador Chromium local. Instale Chrome/Edge ou defina LOCAL_BROWSER_EXECUTABLE_PATH.",
  );
}

async function detectInstagramLoginRequired(page: BrowserPage) {
  const currentUrl = page.url().toLowerCase();

  if (currentUrl.includes("/accounts/login")) {
    return true;
  }

  const pageText = await page.locator("body").innerText().catch(() => "");

  return (
    pageText.includes("Entrar") ||
    pageText.includes("Log in") ||
    pageText.includes("login") ||
    pageText.includes("See Instagram photos and videos")
  );
}

async function collectInstagramPageCandidates(
  page: BrowserPage,
  profileUrl: string,
  options: Required<BrowserCollectorOptions>,
  stats: {
    feedImages: number;
    highlightIgnored: number;
    avatarIgnored: number;
    postsOpened: number;
    rawRejected: number;
    accepted: number;
  },
) {
  const nonFeedImages = await collectInstagramNonFeedImages(page, profileUrl, stats);
  const visibleProfileImages = await collectInstagramFeedPreviewImages(page, profileUrl, stats);
  const postUrls = await collectInstagramPostUrls(page, options.maxPosts, options.maxScrolls);
  const postImages: ImportedImageCandidate[] = [];
  const maxOpenedPosts = Math.min(
    postUrls.length,
    options.maxOpenedPosts,
  );

  for (const postUrl of postUrls.slice(0, maxOpenedPosts)) {
    const postPage = await page.context().newPage();

    try {
      await postPage.goto(postUrl, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
      await postPage.waitForTimeout(1200);
      stats.postsOpened += 1;

      if (await detectInstagramLoginRequired(postPage)) {
        break;
      }

      const images = await collectInstagramPostImages(postPage, profileUrl, postUrl);
      postImages.push(...images);
    } catch {
      continue;
    } finally {
      await postPage.close().catch(() => undefined);
    }
  }

  return [...nonFeedImages, ...visibleProfileImages, ...postImages];
}

async function collectGooglePageCandidates(
  page: BrowserPage,
  pageUrl: string,
  options: { maxScrolls: number },
) {
  for (let index = 0; index < options.maxScrolls; index += 1) {
    await page.mouse.wheel(0, 1200).catch(() => undefined);
    await page.waitForTimeout(900);
  }

  return collectVisibleImages(page, pageUrl);
}

async function collectInstagramPostUrls(
  page: BrowserPage,
  maxPosts: number,
  maxScrolls: number,
) {
  const postUrls = new Set<string>();

  for (let index = 0; index < maxScrolls; index += 1) {
    const urls = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
        .map((anchor) => anchor.href)
        .filter((href) => href.includes("/p/") || href.includes("/reel/"));
    });

    urls.forEach((url) => postUrls.add(url));

    if (postUrls.size >= maxPosts) {
      break;
    }

    await page.mouse.wheel(0, 1600).catch(() => undefined);
    await page.waitForTimeout(900);
  }

  return Array.from(postUrls).slice(0, maxPosts);
}

async function collectVisibleImages(
  page: BrowserPage,
  sourceUrl: string,
  originalPostUrl?: string,
) {
  const images = await page.evaluate(() => {
    return Array.from(document.images)
      .map((image) => {
        const rect = image.getBoundingClientRect();

        return {
          src: image.currentSrc || image.src,
          alt: image.alt || image.getAttribute("aria-label") || "",
          title: image.getAttribute("title") || "",
          width: image.naturalWidth || rect.width || 0,
          height: image.naturalHeight || rect.height || 0,
          visible:
            rect.width > 40 &&
            rect.height > 40 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < window.innerHeight + 400,
        };
      })
      .filter((image) => image.visible && image.src);
  });

  return images.map((image, index) => ({
    id: `browser-candidate-${index + 1}`,
    url: image.src,
    alt: image.alt || image.title || "Imagem coletada pelo navegador local",
    title: image.title || image.alt || undefined,
    source: inferSourceFromUrl(sourceUrl),
    sourceUrl,
    originalPostUrl,
    width: toFiniteNumber(image.width),
    height: toFiniteNumber(image.height),
    collectorOrigin: "unknown",
    collectorContext: "Coletada da tela visivel",
  })) as ImportedImageCandidate[];
}

async function collectInstagramFeedPreviewImages(
  page: BrowserPage,
  sourceUrl: string,
  stats: {
    feedImages: number;
    highlightIgnored: number;
    avatarIgnored: number;
    postsOpened: number;
    rawRejected: number;
    accepted: number;
  },
) {
  const images = (await page.evaluate(() => {
    const postLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href*="/p/"], a[href*="/reel/"]'),
    );

    return postLinks
      .map((link) => {
        const image = link.querySelector("img");

        if (!image) {
          return null;
        }

        const rect = image.getBoundingClientRect();

        return {
          src: image.currentSrc || image.src,
          alt: image.alt || "",
          title: image.getAttribute("title") || "",
          width: image.naturalWidth || rect.width || 0,
          height: image.naturalHeight || rect.height || 0,
          href: link.href,
          top: rect.top,
          left: rect.left,
          size: Math.min(rect.width, rect.height),
        };
      })
      .filter(Boolean);
  })) as Array<{
    src: string;
    alt: string;
    title: string;
    width: number;
    height: number;
    href: string;
    top: number;
    left: number;
    size: number;
  }>;

  stats.feedImages += images.length;

  return images.map((image, index) => ({
    id: `browser-feed-${index + 1}`,
    url: image.src,
    alt: image.alt || image.title || "Imagem da grade do feed",
    title: image.title || image.alt || undefined,
    source: "instagram" as const,
    sourceUrl,
    originalPostUrl: image.href,
    width: toFiniteNumber(image.width),
    height: toFiniteNumber(image.height),
    collectorOrigin: "feed" as const,
    collectorContext: "Imagem coletada da grade principal do feed",
  }));
}

async function collectInstagramNonFeedImages(
  page: BrowserPage,
  sourceUrl: string,
  stats: {
    feedImages: number;
    highlightIgnored: number;
    avatarIgnored: number;
    postsOpened: number;
    rawRejected: number;
    accepted: number;
  },
) {
  const images = (await page.evaluate(() => {
    return Array.from(document.images)
      .map((image) => {
        const rect = image.getBoundingClientRect();
        const parentLink = image.closest("a") as HTMLAnchorElement | null;
        const likelyCircle = Math.abs(rect.width - rect.height) < 8;
        const nearTop = rect.top < 520;
        const href = parentLink?.href || "";
        const aria = parentLink?.getAttribute("aria-label") || "";
        const inPostLink = href.includes("/p/") || href.includes("/reel/");

        if (!nearTop || inPostLink || rect.width < 36 || rect.height < 36) {
          return null;
        }

        const isAvatar = likelyCircle && rect.width >= 96;
        const isHighlight =
          likelyCircle &&
          rect.width <= 110 &&
          (aria.length > 0 || href.includes("/stories/highlights/"));

        return {
          src: image.currentSrc || image.src,
          alt: image.alt || "",
          title: image.getAttribute("title") || "",
          width: image.naturalWidth || rect.width || 0,
          height: image.naturalHeight || rect.height || 0,
          collectorOrigin: isAvatar ? "avatar" : isHighlight ? "highlight" : "unknown",
          collectorContext: isAvatar
            ? "Imagem do avatar/perfil capturada no topo do Instagram"
            : isHighlight
              ? "Imagem parece capa de destaque/story perto do topo do perfil"
              : "Imagem do cabecalho do perfil do Instagram",
        };
      })
      .filter(Boolean);
  })) as BrowserVisibleImage[];

  stats.highlightIgnored += images.filter((image) => image.collectorOrigin === "highlight").length;
  stats.avatarIgnored += images.filter((image) => image.collectorOrigin === "avatar").length;

  return images.map((image, index) => ({
    id: `browser-non-feed-${index + 1}`,
    url: image.src,
    alt: image.alt || image.title || "Imagem do topo do perfil",
    title: image.title || image.alt || undefined,
    source: "instagram" as const,
    sourceUrl,
    width: image.width,
    height: image.height,
    collectorOrigin: image.collectorOrigin,
    collectorContext: image.collectorContext,
  }));
}

async function collectInstagramPostImages(
  page: BrowserPage,
  sourceUrl: string,
  originalPostUrl: string,
) {
  const collected: BrowserVisibleImage[] = [];

  for (let step = 0; step < 4; step += 1) {
    const images = (await page.evaluate(() => {
      return Array.from(document.images)
        .map((image) => {
          const rect = image.getBoundingClientRect();
          const parentLink = image.closest("a") as HTMLAnchorElement | null;

          return {
            src: image.currentSrc || image.src,
            alt: image.alt || "",
            title: image.getAttribute("title") || "",
            width: image.naturalWidth || rect.width || 0,
            height: image.naturalHeight || rect.height || 0,
            top: rect.top,
            visible:
              rect.width > 120 &&
              rect.height > 120 &&
              rect.bottom > 0 &&
              rect.top < window.innerHeight + 300,
            href: parentLink?.href || "",
          };
        })
        .filter((image) => image.visible && image.src);
    })) as Array<{
      src: string;
      alt: string;
      title: string;
      width: number;
      height: number;
      top: number;
      href: string;
    }>;

    for (const image of images) {
      collected.push({
        src: image.src,
        alt: image.alt,
        title: image.title || undefined,
        width: toFiniteNumber(image.width),
        height: toFiniteNumber(image.height),
        collectorOrigin: step === 0 ? "post" : "carousel",
        collectorContext:
          step === 0
            ? "Imagem coletada com o post aberto"
            : "Imagem coletada de carrossel do post",
      });
    }

    const nextButton = page
      .locator('svg[aria-label="Avançar"], svg[aria-label="Next"], button[aria-label="Avançar"], button[aria-label="Next"]')
      .first();

    try {
      if (!(await nextButton.isVisible())) {
        break;
      }

      await nextButton.click({});
      await page.waitForTimeout(800);
    } catch {
      break;
    }
  }

  return collected.map((image, index) => ({
    id: `browser-post-${index + 1}`,
    url: image.src,
    alt: image.alt || image.title || "Imagem coletada do post do Instagram",
    title: image.title || image.alt || undefined,
    source: "instagram" as const,
    sourceUrl,
    originalPostUrl,
    width: image.width,
    height: image.height,
    collectorOrigin: image.collectorOrigin,
    collectorContext: image.collectorContext,
  }));
}

function filterBrowserCandidates(
  candidates: ImportedImageCandidate[],
  source: CollectorSource,
  stats: {
    feedImages: number;
    highlightIgnored: number;
    avatarIgnored: number;
    postsOpened: number;
    rawRejected: number;
    accepted: number;
  },
) {
  const seen = new Set<string>();

  return candidates.filter((candidate) => {
    const normalizedUrl = candidate.url.trim();
    const dedupeKey = normalizedUrl.split("?")[0]?.toLowerCase() || normalizedUrl;

    if (!normalizedUrl || seen.has(dedupeKey)) {
      stats.rawRejected += 1;
      return false;
    }

    seen.add(dedupeKey);

    if (isPlatformAsset(normalizedUrl, source)) {
      stats.rawRejected += 1;
      return false;
    }

    if ((candidate.width ?? 0) < 140 || (candidate.height ?? 0) < 140) {
      stats.rawRejected += 1;
      return false;
    }

    const accepted = /^https?:\/\//i.test(normalizedUrl);

    if (!accepted) {
      stats.rawRejected += 1;
      return false;
    }

    stats.accepted += 1;
    return true;
  });
}

function inferSourceFromUrl(url: string): ImportSource {
  return url.includes("instagram") ? "instagram" : "google";
}

function isPlatformAsset(url: string, source: CollectorSource) {
  const normalized = url.toLowerCase();

  if (
    normalized.includes("sprite") ||
    normalized.includes("icon") ||
    normalized.includes("favicon") ||
    normalized.includes("badge") ||
    normalized.includes("emoji")
  ) {
    return true;
  }

  if (source === "instagram") {
    return (
      normalized.includes("static.cdninstagram.com/rsrc") ||
      normalized === "https://static.cdninstagram.com/" ||
      normalized.endsWith(".svg")
    );
  }

  return (
    normalized.includes("maps.gstatic.com/tactile") ||
    normalized.includes("google.com/images/branding") ||
    normalized.endsWith(".svg")
  );
}

function safeNormalizeUrl(url: string) {
  try {
    return new URL(url.trim()).toString();
  } catch {
    return "";
  }
}

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type BrowserPage = Page;
