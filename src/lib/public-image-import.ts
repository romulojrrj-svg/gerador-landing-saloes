export type ImportSource = "instagram" | "google" | "website";

export type ImportedImageCandidate = {
  id: string;
  url: string;
  alt: string;
  source: ImportSource;
  sourceUrl?: string;
  originalPostUrl?: string;
  width?: number;
  height?: number;
  score?: number;
  suggestedType?: "logo" | "hero" | "interior" | "gallery" | "result";
  title?: string;
  collectorOrigin?:
    | "feed"
    | "post"
    | "carousel"
    | "highlight"
    | "avatar"
    | "unknown";
  collectorContext?: string;
};

export type PublicImageImportErrorType =
  | "missing_url"
  | "invalid_url"
  | "blocked"
  | "no_images"
  | "internal";

export type PublicImageImportDebug = {
  source: ImportSource;
  requestedUrl: string;
  resolvedUrl?: string;
  rawCandidates: number;
  filteredCandidates: number;
  notes: string[];
  usedTestCandidates?: boolean;
  stats?: Record<string, number>;
};

export type PublicImageImportResult = {
  success: boolean;
  source: ImportSource;
  candidates: ImportedImageCandidate[];
  error?: string;
  errorType?: PublicImageImportErrorType;
  debug?: PublicImageImportDebug;
};

export async function collectPublicImages(
  source: ImportSource,
  url: string,
  options?: { useTestCandidates?: boolean },
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
          : source === "google"
            ? "Preencha o link do Google Maps antes de buscar."
            : "Preencha o site do salao antes de buscar.",
      errorType: "missing_url",
      debug,
    };
  }

  if (process.env.NODE_ENV === "development" && options?.useTestCandidates) {
    const testCandidates = buildDevelopmentCandidates(source, url.trim());
    const result: PublicImageImportResult = {
      success: true,
      source,
      candidates: testCandidates,
      debug: {
        ...debug,
        requestedUrl: url.trim(),
        resolvedUrl: url.trim(),
        filteredCandidates: testCandidates.length,
        notes: [
          "Candidatas de teste acionadas explicitamente em ambiente de desenvolvimento.",
        ],
        usedTestCandidates: true,
      },
    };

    logImportDebug(result);
    return result;
  }

  try {
    const normalizedUrl = normalizeImportUrl(url, source);
    debug.resolvedUrl = normalizedUrl;
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) {
      debug.notes.push(`HTTP ${response.status}`);

      return withDevelopmentFallback(
        {
          success: false,
          source,
          candidates: [],
          error:
            "A fonte respondeu sem liberar o conteudo publico esperado. Tente outro link ou use URLs manuais.",
          errorType: "blocked",
          debug,
        },
        options,
      );
    }

    const finalUrl = response.url || normalizedUrl;
    debug.resolvedUrl = finalUrl;

    const html = await response.text();
    const extracted = extractImageCandidatesFromHtml(html, finalUrl, source);
    debug.rawCandidates = extracted.rawCount;
    debug.filteredCandidates = extracted.candidates.length;
    debug.notes.push(
      `Extraidas ${extracted.rawCount} imagens brutas e ${extracted.candidates.length} apos filtros.`,
    );

    if (!extracted.candidates.length) {
      return withDevelopmentFallback(
        {
          success: false,
          source,
          candidates: [],
          error:
            "Nenhuma imagem publica util foi encontrada nesse link. A fonte pode ter bloqueado o HTML ou expor apenas miniaturas limitadas.",
          errorType: "no_images",
          debug,
        },
        options,
      );
    }

    const result: PublicImageImportResult = {
      success: true,
      source,
      candidates: extracted.candidates,
      debug,
    };

    logImportDebug(result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno ao buscar imagens.";
    const errorType = message.includes("Informe um link")
      ? "invalid_url"
      : message.includes("fetch")
        ? "blocked"
        : "internal";
    const result = withDevelopmentFallback(
      {
        success: false,
        source,
        candidates: [],
        error: message,
        errorType,
        debug: {
          ...debug,
          notes: [...debug.notes, message],
        },
      },
      options,
    );

    logImportDebug(result);
    return result;
  }
}

export async function importPublicImages(
  source: ImportSource,
  url: string,
): Promise<ImportedImageCandidate[]> {
  const result = await collectPublicImages(source, url);

  if (!result.success) {
    throw new Error(
      result.error ||
        "Nao foi possivel buscar fotos automaticamente deste link. Tente colar URLs manualmente ou fazer upload.",
    );
  }

  return result.candidates;
}

export function normalizeImportUrl(url: string, source: ImportSource) {
  const normalized = new URL(url.trim());
  const hostname = normalized.hostname.toLowerCase();

  if (
    source === "instagram" &&
    !["instagram.com", "www.instagram.com", "instagr.am"].includes(hostname)
  ) {
    throw new Error("Informe um link publico do Instagram.");
  }

  if (
    source === "google" &&
    !(
      hostname.includes("google.") ||
      hostname === "share.google" ||
      hostname === "g.page" ||
      hostname.endsWith(".g.page") ||
      hostname === "maps.app.goo.gl"
    )
  ) {
    throw new Error("Informe um link publico do Google Maps ou Perfil da Empresa.");
  }

  if (source === "website" && !["http:", "https:"].includes(normalized.protocol)) {
    throw new Error("Informe um link publico valido do site.");
  }

  return normalized.toString();
}

function extractImageCandidatesFromHtml(
  html: string,
  baseUrl: string,
  source: ImportSource,
) {
  const rawCandidates = [
    ...extractMetaCandidates(html, baseUrl, source),
    ...extractImageTagCandidates(html, baseUrl, source),
    ...extractJsonLdCandidates(html, baseUrl, source),
    ...extractInlineUrlCandidates(html, baseUrl, source),
  ];
  const rankedCandidates = rankCandidates(rawCandidates);

  return {
    rawCount: rawCandidates.length,
    candidates: rankedCandidates.slice(0, 12).map((candidate, index) => ({
      ...candidate,
      id: `candidate-${source}-${index + 1}`,
    })),
  };
}

function extractMetaCandidates(
  html: string,
  baseUrl: string,
  source: ImportSource,
) {
  const candidates: ImportedImageCandidate[] = [];
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const twitterTitle =
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ||
    ogTitle;
  const patterns = [
    {
      pattern:
        /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
      title: ogTitle,
    },
    {
      pattern:
        /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
      title: twitterTitle,
    },
    {
      pattern: /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
      title: ogTitle,
    },
    {
      pattern:
        /<meta[^>]+(?:name|property|itemprop)=["']image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
      title: ogTitle,
    },
  ];

  for (const { pattern, title } of patterns) {
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(html)) !== null) {
      const resolvedUrl = resolveImageUrl(match[1], baseUrl);

      if (!resolvedUrl || !isLikelyImageUrl(resolvedUrl)) {
        continue;
      }

      candidates.push(buildCandidate(resolvedUrl, baseUrl, source, undefined, title));
    }
  }

  return candidates;
}

function extractImageTagCandidates(
  html: string,
  baseUrl: string,
  source: ImportSource,
) {
  const candidates: ImportedImageCandidate[] = [];
  const pattern = /<img\b([^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const attributes = match[1] ?? "";
    const srcMatch = attributes.match(/\bsrc=["']([^"']+)["']/i);
    const srcSetMatch = attributes.match(/\bsrcset=["']([^"']+)["']/i);
    const widthMatch = attributes.match(/\bwidth=["']?(\d+)["']?/i);
    const heightMatch = attributes.match(/\bheight=["']?(\d+)["']?/i);
    const altMatch = attributes.match(/\balt=["']([^"']*)["']/i);
    const titleMatch = attributes.match(/\btitle=["']([^"']*)["']/i);
    const primarySrc = srcMatch?.[1] ?? getBestSrcSetCandidate(srcSetMatch?.[1]);
    const resolvedUrl = resolveImageUrl(primarySrc ?? "", baseUrl);

    if (!resolvedUrl || !isLikelyImageUrl(resolvedUrl)) {
      continue;
    }

    candidates.push(
      buildCandidate(
        resolvedUrl,
        baseUrl,
        source,
        {
          width: toNumber(widthMatch?.[1]),
          height: toNumber(heightMatch?.[1]),
        },
        titleMatch?.[1] || altMatch?.[1],
      ),
    );
  }

  return candidates;
}

function extractJsonLdCandidates(
  html: string,
  baseUrl: string,
  source: ImportSource,
) {
  const candidates: ImportedImageCandidate[] = [];
  const scriptPattern =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    const scriptContent = decodeHtml(match[1].trim());

    try {
      const parsed = JSON.parse(scriptContent);
      const imageValues = collectJsonLdImages(parsed);

      for (const imageValue of imageValues) {
        const resolvedUrl = resolveImageUrl(imageValue.url, baseUrl);

        if (!resolvedUrl || !isLikelyImageUrl(resolvedUrl)) {
          continue;
        }

        candidates.push(
          buildCandidate(
            resolvedUrl,
            baseUrl,
            source,
            undefined,
            imageValue.title,
          ),
        );
      }
    } catch {
      continue;
    }
  }

  return candidates;
}

function extractInlineUrlCandidates(
  html: string,
  baseUrl: string,
  source: ImportSource,
) {
  const candidates: ImportedImageCandidate[] = [];
  const patterns = [
    /https?:\\\/\\\/[^"'\\\s<>()]+/gi,
    /https?:\/\/[^"'\s<>()]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern) ?? [];

    for (const match of matches) {
      const resolvedUrl = resolveImageUrl(match, baseUrl);

      if (!resolvedUrl || !isLikelyImageUrl(resolvedUrl)) {
        continue;
      }

      candidates.push(buildCandidate(resolvedUrl, baseUrl, source));
    }
  }

  return candidates;
}

function collectJsonLdImages(
  input: unknown,
): Array<{ url: string; title?: string }> {
  if (!input) {
    return [];
  }

  if (typeof input === "string") {
    return [{ url: input }];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => collectJsonLdImages(item));
  }

  if (typeof input === "object") {
    const candidate = input as Record<string, unknown>;
    const images = collectJsonLdImages(candidate.image);
    const logos = collectJsonLdImages(candidate.logo);
    const primaryUrl =
      typeof candidate.url === "string"
        ? [{ url: candidate.url, title: toText(candidate.name) }]
        : [];

    return [...images, ...logos, ...primaryUrl];
  }

  return [];
}

function buildCandidate(
  url: string,
  baseUrl: string,
  source: ImportSource,
  dimensions?: { width?: number; height?: number },
  title?: string,
): ImportedImageCandidate {
  return {
    id: "",
    url,
    alt:
      clean(title) ||
      (source === "instagram"
        ? "Imagem publica do Instagram"
        : source === "google"
          ? "Imagem publica do Google"
          : "Imagem publica do site"),
    source,
    sourceUrl: baseUrl,
    originalPostUrl: source === "instagram" ? baseUrl : undefined,
    width: dimensions?.width,
    height: dimensions?.height,
    title: clean(title) || undefined,
  };
}

function rankCandidates(candidates: ImportedImageCandidate[]) {
  const deduped = new Map<string, ImportedImageCandidate>();

  for (const candidate of candidates) {
    const normalizedUrl = candidate.url.split("?")[0] ?? candidate.url;

    if (!deduped.has(normalizedUrl)) {
      deduped.set(normalizedUrl, candidate);
    }
  }

  return Array.from(deduped.values())
    .map((candidate) => {
      const suggestedType = inferSuggestedType(candidate.url, candidate.width, candidate.height);
      const score = scoreCandidate(candidate.url, candidate.width, candidate.height, suggestedType);

      return {
        ...candidate,
        suggestedType,
        score,
      };
    })
    .filter((candidate) => candidate.score && candidate.score > 0)
    .sort((first, second) => (second.score ?? 0) - (first.score ?? 0));
}

function inferSuggestedType(
  url: string,
  width?: number,
  height?: number,
): ImportedImageCandidate["suggestedType"] {
  const normalized = url.toLowerCase();

  if (containsAny(normalized, ["logo", "icon", "avatar", "profile"])) {
    return "logo";
  }

  if (width && height) {
    const ratio = width / height;

    if (ratio >= 1.45) {
      return "hero";
    }

    if (ratio <= 0.9) {
      return "result";
    }
  }

  if (containsAny(normalized, ["interior", "inside", "space", "salon"])) {
    return "interior";
  }

  return "gallery";
}

function scoreCandidate(
  url: string,
  width: number | undefined,
  height: number | undefined,
  suggestedType: ImportedImageCandidate["suggestedType"],
) {
  const normalized = url.toLowerCase();
  let score = 0;

  if (!isLikelyImageUrl(url)) {
    return 0;
  }

  if (containsAny(normalized, ["sprite", "badge", "emoji", "icon", "favicon"])) {
    return 0;
  }

  if (
    containsAny(normalized, [
      "static.cdninstagram.com/",
      "static.cdninstagram.com/rsrc",
      "google.com/images/branding",
      "maps.gstatic.com/tactile",
    ])
  ) {
    return 0;
  }

  if (
    normalized === "https://static.cdninstagram.com/" ||
    normalized.endsWith(".com/") ||
    normalized.endsWith(".com")
  ) {
    return 0;
  }

  if (suggestedType === "logo") {
    score += 18;
  } else {
    score += 30;
  }

  if (width && height) {
    const area = width * height;

    if (area < 40_000) {
      return 0;
    }

    if (area > 600_000) {
      score += 24;
    } else if (area > 180_000) {
      score += 14;
    } else {
      score += 6;
    }

    const ratio = width / height;

    if (ratio >= 1.35 && ratio <= 1.95) {
      score += 12;
    } else if (ratio >= 0.8 && ratio <= 1.2) {
      score += 8;
    }
  } else {
    score += 6;
  }

  if (
    containsAny(normalized, [
      "cdninstagram",
      "fbcdn",
      "googleusercontent",
      "gstatic",
      "cloudfront",
    ])
  ) {
    score += 8;
  }

  if (containsAny(normalized, ["logo", "icon", "avatar", "profile"])) {
    score -= 12;
  }

  return score;
}

function resolveImageUrl(candidate: string, baseUrl: string) {
  try {
    const cleaned = decodeHtml(candidate.split(",")[0]?.trim() || "");

    if (!cleaned || cleaned.startsWith("data:")) {
      return "";
    }

    return new URL(cleaned, baseUrl).toString();
  } catch {
    return "";
  }
}

function isLikelyImageUrl(url: string) {
  const normalized = url.toLowerCase();

  return (
    normalized.includes("cdninstagram") ||
    normalized.includes("fbcdn") ||
    normalized.includes("googleusercontent") ||
    normalized.includes("gstatic") ||
    normalized.includes("cloudfront") ||
    normalized.includes("images.") ||
    /\.(jpg|jpeg|png|webp|avif|svg)(\?|$)/.test(normalized)
  );
}

function withDevelopmentFallback(
  result: PublicImageImportResult,
  options?: { useTestCandidates?: boolean },
) {
  if (
    process.env.NODE_ENV !== "development" ||
    !options?.useTestCandidates ||
    result.success
  ) {
    return result;
  }

  const testCandidates = buildDevelopmentCandidates(result.source, result.debug?.resolvedUrl);
  const baseDebug: PublicImageImportDebug = result.debug ?? {
    source: result.source,
    requestedUrl: "",
    rawCandidates: 0,
    filteredCandidates: 0,
    notes: [],
  };
  const fallbackResult: PublicImageImportResult = {
    success: true,
    source: result.source,
    candidates: testCandidates,
    debug: {
      ...baseDebug,
      filteredCandidates: testCandidates.length,
      notes: [
        ...baseDebug.notes,
        "Fonte bloqueou ou nao expôs imagens uteis. Candidatas de teste foram retornadas explicitamente.",
      ],
      usedTestCandidates: true,
    },
  };

  logImportDebug(fallbackResult);
  return fallbackResult;
}

function buildDevelopmentCandidates(source: ImportSource, pageUrl?: string) {
  const baseCandidates: Array<{
    url: string;
    width: number;
    height: number;
    title: string;
    suggestedType: ImportedImageCandidate["suggestedType"];
  }> = [
    {
      url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
      width: 1600,
      height: 1067,
      title: "Candidata de teste para hero",
      suggestedType: "hero",
    },
    {
      url: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
      width: 1200,
      height: 800,
      title: "Candidata de teste para ambiente",
      suggestedType: "interior",
    },
    {
      url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
      width: 1200,
      height: 1500,
      title: "Candidata de teste para galeria",
      suggestedType: "gallery",
    },
    {
      url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
      width: 1200,
      height: 1500,
      title: "Candidata de teste para resultado",
      suggestedType: "result",
    },
    {
      url: "https://dummyimage.com/480x180/111827/ffffff.png&text=Logo+de+Teste",
      width: 480,
      height: 180,
      title: "Logo de teste",
      suggestedType: "logo",
    },
  ];

  return baseCandidates.map((candidate, index) => ({
    id: `test-${source}-${index + 1}`,
    url: candidate.url,
    alt: `${candidate.title} (dados de teste)`,
    source,
    sourceUrl: pageUrl,
    originalPostUrl: source === "instagram" ? pageUrl : undefined,
    width: candidate.width,
    height: candidate.height,
    score: candidate.suggestedType === "logo" ? 58 : 72 - index * 4,
    suggestedType: candidate.suggestedType,
    title: `${candidate.title} (dados de teste)`,
  }));
}

function logImportDebug(result: PublicImageImportResult) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.info("[image-import]", {
    source: result.source,
    success: result.success,
    error: result.error,
    errorType: result.errorType,
    debug: result.debug,
  });
}

function getBestSrcSetCandidate(srcSet?: string) {
  if (!srcSet) {
    return undefined;
  }

  const entries = srcSet
    .split(",")
    .map((entry) => entry.trim())
    .map((entry) => {
      const [url, width] = entry.split(/\s+/);
      return {
        url,
        width: Number(width?.replace("w", "")) || 0,
      };
    })
    .sort((first, second) => second.width - first.width);

  return entries[0]?.url;
}

function toNumber(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function containsAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function clean(value?: string) {
  return value?.trim() || "";
}

function toText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}
