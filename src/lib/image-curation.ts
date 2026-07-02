import type {
  SalonDataConfidence,
  SalonGalleryImage,
  SalonImageCandidate,
  SalonImageSelectionSummary,
  SalonImageSuggestedUse,
  SalonImageType,
} from "@/types/salon";
import type { ImportedImageCandidate } from "@/lib/public-image-import";

const LANDING_IMAGE_TYPES = new Set<SalonImageType>([
  "logo",
  "hero",
  "interior",
  "service",
  "result",
  "gallery",
]);

export function curateImportedCandidates(
  importedCandidates: ImportedImageCandidate[],
): SalonImageCandidate[] {
  const seen = new Set<string>();

  const curatedCandidates = importedCandidates
    .map((candidate) => buildSalonImageCandidate(candidate))
    .filter((candidate) => {
      const dedupeKey = normalizeCandidateUrl(candidate.imageUrl);

      if (!dedupeKey || seen.has(dedupeKey)) {
        return false;
      }

      seen.add(dedupeKey);
      return true;
    })
    .sort((first, second) => second.score - first.score);

  return ensureUniqueCandidateIds(curatedCandidates);
}

export function mergeImageCandidates(
  existingCandidates: SalonImageCandidate[],
  nextCandidates: SalonImageCandidate[],
) {
  const byUrl = new Map<string, SalonImageCandidate>();

  for (const candidate of existingCandidates) {
    byUrl.set(normalizeCandidateUrl(candidate.imageUrl), candidate);
  }

  for (const candidate of nextCandidates) {
    const key = normalizeCandidateUrl(candidate.imageUrl);
    const existing = byUrl.get(key);

    if (!existing) {
      byUrl.set(key, candidate);
      continue;
    }

    byUrl.set(key, {
      ...candidate,
      id: existing.id,
      status:
        existing.status === "applied" || existing.status === "selected"
          ? existing.status
          : candidate.status,
      reasons:
        existing.reasons.length >= candidate.reasons.length
          ? existing.reasons
          : candidate.reasons,
    });
  }

  return Array.from(byUrl.values()).sort((first, second) => second.score - first.score);
}

export function selectBestImageCandidates(
  candidates: SalonImageCandidate[],
): {
  updatedCandidates: SalonImageCandidate[];
  selection: SalonImageSelectionSummary;
  warnings: string[];
} {
  const eligibleCandidates = candidates
    .filter((candidate) => candidate.status !== "rejected")
    .filter((candidate) => candidate.suggestedUse !== "ignore")
    .filter((candidate) => candidate.score >= 34)
    .sort((first, second) => second.score - first.score);

  const usedIds = new Set<string>();

  const logoId = pickFirstCandidate(
    eligibleCandidates,
    usedIds,
    (candidate) => candidate.suggestedUse === "logo" && candidate.score >= 48,
  );
  const heroId = pickFirstCandidate(
    eligibleCandidates,
    usedIds,
    (candidate) =>
      candidate.suggestedUse !== "logo" &&
      candidate.suggestedUse !== "ignore" &&
      candidate.collectorOrigin !== "highlight" &&
      candidate.collectorOrigin !== "avatar" &&
      candidate.suggestedUse === "top" &&
      candidate.score >= 52,
  );
  const interiorIds = pickCandidateGroup(
    eligibleCandidates,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "space",
    2,
  );
  const resultIds = pickCandidateGroup(
    eligibleCandidates,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "gallery",
    2,
  );
  const galleryIds = pickGalleryCandidates(eligibleCandidates, usedIds, 8);

  const selectedIds = new Set(
    [logoId, heroId, ...interiorIds, ...resultIds, ...galleryIds].filter(Boolean),
  );
  const ignoredIds = candidates
    .filter((candidate) => candidate.suggestedUse === "ignore" || candidate.score < 20)
    .map((candidate) => candidate.id);

  const updatedCandidates: SalonImageCandidate[] = candidates.map((candidate) => {
    if (ignoredIds.includes(candidate.id)) {
      return {
        ...candidate,
        status: candidate.status === "applied" ? "applied" : "rejected",
      };
    }

    if (selectedIds.has(candidate.id)) {
      return {
        ...candidate,
        status: candidate.status === "applied" ? "applied" : "selected",
      };
    }

    return candidate.status === "rejected"
      ? candidate
      : {
          ...candidate,
          status: candidate.status === "applied" ? "applied" : "new",
        };
  });

  return {
    updatedCandidates,
    selection: {
      logoId: logoId || undefined,
      heroId: heroId || undefined,
      interiorIds,
      resultIds,
      galleryIds,
      ignoredIds,
      selectedAt: new Date().toISOString(),
    },
    warnings: heroId
      ? []
      : [
          "Nenhuma imagem forte o suficiente para hero. Escolha manualmente ou adicione uma foto melhor por URL/upload.",
        ],
  };
}

export function applyCandidateSelection(
  currentImages: SalonGalleryImage[],
  candidates: SalonImageCandidate[],
  selection: SalonImageSelectionSummary,
  salonName: string,
): {
  images: SalonGalleryImage[];
  updatedCandidates: SalonImageCandidate[];
  selection: SalonImageSelectionSummary;
} {
  const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const nextImages = [...currentImages];
  const selectedIds = [
    selection.logoId,
    selection.heroId,
    ...selection.interiorIds,
    ...selection.resultIds,
    ...selection.galleryIds,
  ].filter(Boolean) as string[];

  for (const candidateId of selectedIds) {
    const candidate = candidateMap.get(candidateId);

    if (!candidate) {
      continue;
    }

    const type = mapSuggestedUseToImageType(candidate.suggestedUse, candidate.id, selection);
    const existingIndex = nextImages.findIndex(
      (image) => normalizeCandidateUrl(image.src) === normalizeCandidateUrl(candidate.imageUrl),
    );
    const nextImage = buildGalleryImageFromCandidate(candidate, type, salonName);

    if (existingIndex >= 0) {
      nextImages[existingIndex] = {
        ...nextImages[existingIndex],
        ...nextImage,
        id: nextImages[existingIndex]?.id ?? nextImage.id,
      };
      continue;
    }

    nextImages.push(nextImage);
  }

  const updatedCandidates: SalonImageCandidate[] = candidates.map((candidate) =>
    selectedIds.includes(candidate.id)
      ? {
          ...candidate,
          status: "applied",
        }
      : candidate,
  );

  return {
    images: normalizeHeroImages(nextImages),
    updatedCandidates,
    selection: {
      ...selection,
      appliedAt: new Date().toISOString(),
    },
  };
}

export function buildGalleryImageFromCandidate(
  candidate: SalonImageCandidate,
  type: SalonImageType,
  salonName: string,
): SalonGalleryImage {
  return {
    id: `image-${candidate.id}`,
    url: candidate.imageUrl,
    src: candidate.imageUrl,
    alt:
      clean(candidate.alt) ||
      clean(candidate.title) ||
      `${salonName || "Salao"} - ${getCandidateTypeLabel(type)}`,
    title: clean(candidate.title) || undefined,
    type,
    source: candidate.source,
    sourceUrl: candidate.sourceUrl ?? candidate.pageUrl,
    originalPostUrl: candidate.originalPostUrl,
    isReal: true,
    selectedForLanding: true,
    createdAt: new Date().toISOString(),
  };
}

export function mapSuggestedUseToImageType(
  suggestedUse: SalonImageSuggestedUse,
  candidateId?: string,
  selection?: SalonImageSelectionSummary,
): SalonImageType {
  if (selection?.logoId === candidateId) {
    return "logo";
  }

  if (selection?.heroId === candidateId) {
    return "hero";
  }

  if (selection?.interiorIds.includes(candidateId ?? "")) {
    return "interior";
  }

  if (selection?.resultIds.includes(candidateId ?? "")) {
    return "result";
  }

  switch (suggestedUse) {
    case "logo":
      return "logo";
    case "top":
    case "hero":
      return "hero";
    case "space":
      return "interior";
    case "hero_mosaic":
      return "gallery";
    case "experience":
    case "interior":
    case "facade":
    case "team":
      return "interior";
    case "service":
      return "service";
    case "result":
      return "result";
    default:
      return "gallery";
  }
}

function buildSalonImageCandidate(
  candidate: ImportedImageCandidate,
): SalonImageCandidate {
  const normalizedUrl = candidate.url.trim();
  const normalized = normalizedUrl.toLowerCase();
  const width = candidate.width;
  const height = candidate.height;
  const ratio = width && height ? width / height : undefined;
  const detectedType = detectCandidateType(candidate);
  const reasons: string[] = [];
  let score = Math.max(0, Math.round(candidate.score ?? 24));

  if (candidate.collectorContext) {
    reasons.push(candidate.collectorContext);
  }

  if (candidate.collectorOrigin === "highlight") {
    score = Math.min(score, 8);
    reasons.push("Ignorada porque parece capa de destaque/story, nao foto do feed.");
  }

  if (candidate.collectorOrigin === "avatar") {
    score = Math.min(score, 10);
    reasons.push("Ignorada por parecer avatar ou imagem de perfil.");
  }

  if (candidate.collectorOrigin === "feed") {
    score += 12;
    reasons.push("Imagem coletada da grade do feed, com bom contexto para landing.");
  }

  if (candidate.collectorOrigin === "post") {
    score += 14;
    reasons.push("Imagem coletada com o post aberto, em tamanho mais util para curadoria.");
  }

  if (candidate.collectorOrigin === "carousel") {
    score += 10;
    reasons.push("Imagem veio de carrossel do feed e pode ampliar a variedade da galeria.");
  }

  if (width && height) {
    const area = width * height;

    if (area >= 900_000) {
      score += 22;
      reasons.push("Resolucao alta, com boa margem para hero ou destaque.");
    } else if (area >= 280_000) {
      score += 12;
      reasons.push("Tamanho suficiente para uso comercial na landing.");
    } else if (area < 60_000) {
      score -= 32;
      reasons.push("Imagem pequena demais para uma landing convincente.");
    }
  } else {
    reasons.push("Dimensoes nao identificadas; revisar visualmente antes de aplicar.");
  }

  if (ratio) {
    if (ratio >= 1.35 && ratio <= 1.95) {
      score += 14;
      reasons.push("Formato amplo, bom candidato para hero ou bloco visual.");
    } else if (ratio >= 0.9 && ratio <= 1.2) {
      score += 8;
      reasons.push("Formato equilibrado, util para galeria ou bloco de apoio.");
    } else if (ratio < 0.78) {
      score += 4;
      reasons.push("Formato vertical, com cara de resultado ou detalhe.");
    }
  }

  if (containsAny(normalized, ["logo", "brand", "avatar", "profile"])) {
    score += 6;
    reasons.push("Arquivo com sinais de identidade visual; pode ser a logo do salao.");
  }

  if (containsAny(normalized, ["sprite", "emoji", "icon", "badge", "button"])) {
    score -= 42;
    reasons.push("Arquivo parece icone, sprite ou asset de plataforma.");
  }

  if (containsAny(normalized, ["text", "banner", "promo", "sale"])) {
    score -= 18;
    reasons.push("Rebaixada por conter muito texto promocional.");
  }

  if (
    candidate.source === "instagram" &&
    containsAny(normalized, ["cdninstagram", "fbcdn", "scontent"])
  ) {
    score += 8;
    reasons.push("Origem visual compativel com imagem publica do Instagram.");
  }

  if (
    candidate.source === "google" &&
    containsAny(normalized, ["googleusercontent", "gstatic"])
  ) {
    score += 8;
    reasons.push("Origem visual compativel com imagem publica do Google.");
  }

  if (candidate.source === "website") {
    reasons.push("Coletada do site publico relacionado ao salao.");
  }

  const suggestedUse =
    candidate.collectorOrigin === "highlight" || candidate.collectorOrigin === "avatar"
      ? "ignore"
      : score < 24
        ? "ignore"
        : detectedType;

  if (!reasons.length) {
    reasons.push("Imagem candidata coletada de fonte publica para revisao.");
  }

  const clampedScore = Math.max(0, Math.min(100, score));
  const normalizedReasons = uniqueStrings(reasons);
  const status =
    suggestedUse === "ignore" || clampedScore < 20 ? "rejected" : "new";

  return {
    id: candidate.id,
    source: candidate.source,
    imageUrl: normalizedUrl,
    collectorOrigin: candidate.collectorOrigin,
    collectorContext: candidate.collectorContext,
    pageUrl: candidate.sourceUrl,
    width,
    height,
    title: clean(candidate.title) || clean(candidate.alt),
    alt: clean(candidate.alt) || clean(candidate.title),
    detectedType,
    score: clampedScore,
    confidence: toConfidence(clampedScore),
    suggestedUse,
    status,
    reasons: normalizedReasons,
    sourceUrl: candidate.sourceUrl,
    originalPostUrl: candidate.originalPostUrl,
    collectedAt: new Date().toISOString(),
  };
}

function detectCandidateType(
  candidate: ImportedImageCandidate,
): SalonImageSuggestedUse {
  if (candidate.collectorOrigin === "highlight" || candidate.collectorOrigin === "avatar") {
    return "ignore";
  }

  const normalized = candidate.url.toLowerCase();
  const width = candidate.width;
  const height = candidate.height;
  const ratio = width && height ? width / height : undefined;

  if (candidate.collectorOrigin === "post" || candidate.collectorOrigin === "carousel") {
    if (ratio && ratio >= 1.3) {
      return "top";
    }

    if (ratio && ratio < 0.82) {
      return "gallery";
    }

    return "gallery";
  }

  if (candidate.collectorOrigin === "feed") {
    if (ratio && ratio >= 1.3) {
      return "top";
    }

    return "gallery";
  }

  if (containsAny(normalized, ["logo", "avatar", "brand", "profile"])) {
    return "logo";
  }

  if (containsAny(normalized, ["facade", "front", "outside", "exterior"])) {
    return "space";
  }

  if (containsAny(normalized, ["team", "staff"])) {
    return "gallery";
  }

  if (containsAny(normalized, ["result", "before", "after", "makeup", "nail"])) {
    return "gallery";
  }

  if (containsAny(normalized, ["service", "treatment", "hair", "beauty"])) {
    return "gallery";
  }

  if (containsAny(normalized, ["interior", "inside", "space", "salon"])) {
    return "space";
  }

  if (ratio && ratio >= 1.35) {
    return "top";
  }

  if (ratio && ratio < 0.78) {
    return "gallery";
  }

  return "gallery";
}

function pickFirstCandidate(
  candidates: SalonImageCandidate[],
  usedIds: Set<string>,
  predicate: (candidate: SalonImageCandidate) => boolean,
) {
  const candidate = candidates.find(
    (item) => !usedIds.has(item.id) && predicate(item),
  );

  if (!candidate) {
    return "";
  }

  usedIds.add(candidate.id);
  return candidate.id;
}

function pickCandidateGroup(
  candidates: SalonImageCandidate[],
  usedIds: Set<string>,
  predicate: (candidate: SalonImageCandidate) => boolean,
  limit: number,
) {
  const items = candidates.filter(
    (candidate) => !usedIds.has(candidate.id) && predicate(candidate),
  );
  const selected: string[] = [];

  for (const candidate of items) {
    if (selected.length >= limit) {
      break;
    }

    usedIds.add(candidate.id);
    selected.push(candidate.id);
  }

  return selected;
}

function pickGalleryCandidates(
  candidates: SalonImageCandidate[],
  usedIds: Set<string>,
  limit: number,
) {
  const selected: string[] = [];
  const suggestedUses = new Set<SalonImageSuggestedUse>();
  const collectorOrigins = new Set<string>();
  const postUrls = new Set<string>();

  for (const candidate of candidates) {
    if (selected.length >= limit || usedIds.has(candidate.id)) {
      continue;
    }

    if (candidate.suggestedUse === "logo" || candidate.suggestedUse === "ignore") {
      continue;
    }

    if (
      candidate.collectorOrigin &&
      collectorOrigins.has(candidate.collectorOrigin) &&
      selected.length >= 4 &&
      suggestedUses.has(candidate.suggestedUse)
    ) {
      continue;
    }

    if (suggestedUses.has(candidate.suggestedUse) && selected.length >= 3) {
      continue;
    }

    if (
      candidate.originalPostUrl &&
      postUrls.has(candidate.originalPostUrl) &&
      selected.length >= 3
    ) {
      continue;
    }

    usedIds.add(candidate.id);
    selected.push(candidate.id);
    suggestedUses.add(candidate.suggestedUse);
    if (candidate.collectorOrigin) {
      collectorOrigins.add(candidate.collectorOrigin);
    }
    if (candidate.originalPostUrl) {
      postUrls.add(candidate.originalPostUrl);
    }
  }

  return selected;
}

function normalizeHeroImages(images: SalonGalleryImage[]) {
  let hasHeroImage = false;

  return images
    .filter((image) => LANDING_IMAGE_TYPES.has(image.type))
    .map((image) => {
      if (image.type !== "hero") {
        return image;
      }

      if (hasHeroImage) {
        return {
          ...image,
          type: "gallery" as const,
        };
      }

      hasHeroImage = true;
      return image;
    });
}

function getCandidateTypeLabel(type: SalonImageType) {
  switch (type) {
    case "logo":
      return "logo";
    case "hero":
      return "imagem principal";
    case "interior":
      return "ambiente";
    case "service":
      return "servico";
    case "result":
      return "resultado";
    default:
      return "galeria";
  }
}

function toConfidence(score: number): SalonDataConfidence {
  if (score >= 72) {
    return "high";
  }

  if (score >= 52) {
    return "medium";
  }

  if (score > 0) {
    return "low";
  }

  return "unknown";
}

function normalizeCandidateUrl(url: string) {
  return url.trim().split("?")[0]?.toLowerCase() || "";
}

function ensureUniqueCandidateIds(candidates: SalonImageCandidate[]) {
  const usedIds = new Set<string>();

  return candidates.map((candidate, index) => {
    const baseId = normalizeCandidateId(candidate.id) || `candidate-${index + 1}`;
    let nextId = baseId;
    let suffix = 2;

    while (usedIds.has(nextId)) {
      nextId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(nextId);
    return { ...candidate, id: nextId };
  });
}

function normalizeCandidateId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function containsAny(value: string, patterns: string[]) {
  return patterns.some((pattern) => value.includes(pattern));
}

function clean(value?: string) {
  return value?.trim() || "";
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
