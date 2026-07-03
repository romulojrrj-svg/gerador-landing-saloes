import {
  buildGalleryImageFromCandidate,
  mapSuggestedUseToImageType,
} from "@/lib/image-curation";
import { normalizeSalonLayoutImagePlan } from "@/lib/salon-image-plan";
import type {
  Salon,
  SalonDataConfidence,
  SalonGalleryImage,
  SalonImageCandidate,
  SalonImageSelectionSummary,
  SalonImageSuggestedUse,
  SalonLayoutImagePlan,
} from "@/types/salon";

type ChatGptPlanPayload = {
  logoImageId?: string | null;
  topImageIds?: string[];
  spaceEnabled?: boolean;
  spaceTitle?: string;
  spaceDescription?: string;
  spaceImageIds?: string[];
  heroImageId?: string | null;
  heroMosaicImageIds?: string[];
  galleryImageIds?: string[];
  experienceImageIds?: string[];
  resultImageIds?: string[];
  ignoredImageIds?: string[];
  summary?: string;
  warnings?: string[];
};

type ValidationResult =
  | {
      ok: true;
      plan: SalonLayoutImagePlan;
      summary: {
        logo: string | null;
        topCount: number;
        galleryCount: number;
        spaceCount: number;
        ignoredCount: number;
      };
    }
  | { ok: false; error: string };

export function analyzeImageCandidates(
  candidates: SalonImageCandidate[],
): SalonImageCandidate[] {
  const seen = new Map<string, number>();

  return candidates
    .map((candidate) => {
      const normalizedUrl = normalizeUrl(candidate.imageUrl);
      const duplicateCount = seen.get(normalizedUrl) ?? 0;
      seen.set(normalizedUrl, duplicateCount + 1);

      const width = candidate.width ?? 0;
      const height = candidate.height ?? 0;
      const ratio = width > 0 && height > 0 ? width / height : undefined;
      const area = width * height;
      const titleText = `${candidate.title ?? ""} ${candidate.alt ?? ""} ${
        candidate.collectorContext ?? ""
      } ${candidate.sourceUrl ?? ""}`.toLowerCase();

      let score = Math.max(0, Math.min(100, candidate.score ?? 40));
      let suggestedUse: SalonImageSuggestedUse =
        candidate.suggestedUse ?? candidate.detectedType ?? "gallery";
      const reasons = new Set(candidate.reasons ?? []);
      const warnings = new Set(candidate.warnings ?? []);
      let shouldReject = candidate.status === "rejected";

      if (candidate.collectorOrigin === "highlight") {
        score = Math.min(score, 8);
        suggestedUse = "ignore";
        shouldReject = true;
        reasons.add("Imagem parece ser capa de destaque/story, nao foto do feed.");
      }

      if (candidate.collectorOrigin === "avatar") {
        score = Math.min(score, 10);
        suggestedUse = "ignore";
        shouldReject = true;
        reasons.add("Imagem parece avatar ou foto de perfil, sem valor para a landing.");
      }

      if (candidate.collectorOrigin === "feed") {
        score += 10;
        reasons.add("Imagem coletada da grade principal do feed.");
      }

      if (candidate.collectorOrigin === "post") {
        score += 12;
        reasons.add("Imagem coletada de post aberto, com contexto mais forte.");
      }

      if (candidate.collectorOrigin === "carousel") {
        score += 9;
        reasons.add("Imagem coletada de carrossel, boa para variedade visual.");
      }

      if (ratio && ratio >= 1.28 && area >= 180000) {
        if (!shouldReject) {
          suggestedUse = suggestedUse === "logo" ? "logo" : "top";
          score += 12;
          reasons.add("Composicao ampla, boa candidata para o destaque inicial.");
        }
      } else if (ratio && ratio >= 0.8 && ratio <= 1.2 && area >= 120000) {
        if (!shouldReject && suggestedUse !== "logo") {
          suggestedUse = "top";
          score += 7;
          reasons.add("Formato quadrado, bom para destaque inicial em mosaico ou galeria.");
        }
      } else if (ratio && ratio < 0.8 && area >= 120000) {
        if (!shouldReject && suggestedUse !== "logo") {
          suggestedUse = "gallery";
          score += 5;
          reasons.add("Formato vertical favorece galeria.");
        }
      }

      if (area > 0 && area < 40000) {
        score -= 18;
        warnings.add("Resolucao baixa para uma landing principal.");
      } else if (area > 0 && area < 90000) {
        score -= 8;
        warnings.add("Resolucao mediana; melhor usar como apoio.");
      }

      if (
        containsAny(titleText, [
          "logo",
          "avatar",
          "profile",
          "perfil",
          "icon",
          "highlight",
          "story",
          "destaque",
        ])
      ) {
        if (containsAny(titleText, ["logo"])) {
          suggestedUse = "logo";
          reasons.add("Possivel logo ou marca do salao.");
        } else if (!shouldReject) {
          score -= 22;
          warnings.add("Parece elemento de perfil, destaque ou asset de interface.");
        }
      }

      if (
        containsAny(titleText, [
          "promo",
          "sale",
          "offer",
          "desconto",
          "book now",
          "agende",
          "whatsapp",
        ])
      ) {
        score -= 12;
        warnings.add("Pode conter texto promocional demais para o visual principal.");
      }

      if (duplicateCount > 0) {
        score -= 16;
        warnings.add("Imagem duplicada ou muito parecida com outra candidata.");
      }

      if (
        !shouldReject &&
        suggestedUse !== "logo" &&
        candidate.source === "instagram" &&
        (candidate.collectorOrigin === "feed" ||
          candidate.collectorOrigin === "post" ||
          candidate.collectorOrigin === "carousel")
      ) {
        score += 4;
        reasons.add("Foto real do Instagram com contexto util para prospeccao.");
      }

      if (!shouldReject && score < 24) {
        suggestedUse = "ignore";
        shouldReject = true;
        reasons.add("Baixa qualidade ou pouco contexto comercial; nao recomendada.");
      }

      suggestedUse = simplifySuggestedUse(suggestedUse);

      const confidence = getConfidence(score);
      const shouldUse = !shouldReject && score >= 52 && suggestedUse !== "ignore";

      return {
        ...candidate,
        score: clampScore(score),
        confidence,
        suggestedUse,
        reasons: Array.from(reasons),
        warnings: Array.from(warnings),
        shouldUse,
        shouldReject,
        status:
          candidate.status === "applied"
            ? ("applied" as const)
            : shouldReject
              ? ("rejected" as const)
              : candidate.status,
      };
    })
    .sort((first, second) => second.score - first.score);
}

export function createLocalImagePlan(
  candidates: SalonImageCandidate[],
): {
  analyzedCandidates: SalonImageCandidate[];
  plan: SalonLayoutImagePlan;
  selectionSummary: SalonImageSelectionSummary;
} {
  const analyzedCandidates = analyzeImageCandidates(candidates);
  const eligible = analyzedCandidates.filter(
    (candidate) =>
      candidate.status !== "rejected" &&
      !candidate.shouldReject &&
      candidate.suggestedUse !== "ignore",
  );
  const usedIds = new Set<string>();

  const logoCandidate = pickFirst(
    eligible,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "logo" &&
      candidate.score >= 48,
  );

  const topCandidates = pickMany(
    eligible,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "top" &&
      candidate.score >= 56 &&
      candidate.collectorOrigin !== "highlight" &&
      candidate.collectorOrigin !== "avatar",
    3,
  );

  if (topCandidates.length < 2) {
    const fallbackTopCandidates = pickMany(
      eligible,
      usedIds,
      (candidate) =>
        candidate.suggestedUse === "gallery" &&
        candidate.score >= 62 &&
        candidate.collectorOrigin !== "highlight" &&
        candidate.collectorOrigin !== "avatar",
      3 - topCandidates.length,
    );
    topCandidates.push(...fallbackTopCandidates);
  }

  const spaceCandidates = pickMany(
    eligible,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "space" &&
      candidate.score >= 44,
    3,
  );

  const galleryCandidates = pickMany(
    eligible,
    usedIds,
    (candidate) =>
      candidate.suggestedUse === "gallery" || candidate.suggestedUse === "top",
    8,
  );

  const ignoredImageIds = analyzedCandidates
    .filter((candidate) => candidate.shouldReject || candidate.suggestedUse === "ignore")
    .map((candidate) => candidate.id);

  const warnings: string[] = [];

  if (topCandidates.length < 1) {
    warnings.push(
      "Nenhuma imagem forte o suficiente para destaque inicial. Escolha manualmente ou adicione uma foto melhor por URL/upload.",
    );
  }

  if (galleryCandidates.length < 3) {
    warnings.push(
      "Poucas imagens consistentes para galeria. Vale revisar as candidatas manualmente.",
    );
  }

  const plan = normalizeSalonLayoutImagePlan({
    mode: "local_auto",
    logoImageId: logoCandidate?.id ?? null,
    topImageIds: topCandidates.map((candidate) => candidate.id),
    heroImageId: topCandidates.length === 1 ? topCandidates[0].id : null,
    heroMosaicImageIds:
      topCandidates.length > 1 ? topCandidates.map((candidate) => candidate.id) : [],
    galleryImageIds: galleryCandidates.map((candidate) => candidate.id),
    spaceEnabled: spaceCandidates.length > 0,
    spaceTitle: "Nosso Espaço",
    spaceDescription: "Conheça um pouco do ambiente e dos detalhes do salão.",
    spaceImageIds: spaceCandidates.map((candidate) => candidate.id),
    experienceImageIds: spaceCandidates.map((candidate) => candidate.id),
    resultImageIds: [],
    ignoredImageIds,
    summary:
      "Plano local simplificado: logo, destaque inicial, galeria e Nosso Espaço quando houver fotos adequadas.",
    warnings,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as SalonLayoutImagePlan;

  return {
    analyzedCandidates: markCandidatesFromPlan(analyzedCandidates, plan),
    plan,
    selectionSummary: {
      heroId: topCandidates[0]?.id,
      logoId: logoCandidate?.id,
      interiorIds: spaceCandidates.map((candidate) => candidate.id),
      resultIds: [],
      galleryIds: galleryCandidates.map((candidate) => candidate.id),
      ignoredIds: ignoredImageIds,
      selectedAt: new Date().toISOString(),
    },
  };
}

export function buildChatGptCurationPrompt(
  salon: Salon,
  candidates: SalonImageCandidate[],
) {
  const analyzed = analyzeImageCandidates(candidates);
  const candidateLines = analyzed
    .map((candidate) => {
      const orientation = getOrientation(candidate.width, candidate.height);
      return [
        `imageId: ${candidate.id}`,
        `imageUrl: ${candidate.imageUrl}`,
        `source: ${candidate.source}`,
        `sourceContext: ${candidate.collectorOrigin ?? "unknown"}`,
        `localSuggestedUse: ${candidate.suggestedUse}`,
        `localScore: ${candidate.score}`,
        `localConfidence: ${candidate.confidence}`,
        `orientation: ${orientation}`,
        `size: ${candidate.width ?? "?"}x${candidate.height ?? "?"}`,
        `reasons: ${candidate.reasons.join(" | ") || "nenhuma"}`,
        `warnings: ${(candidate.warnings ?? []).join(" | ") || "nenhum"}`,
        `originalPostUrl: ${candidate.originalPostUrl ?? candidate.pageUrl ?? ""}`,
      ].join("\n");
    })
    .join("\n\n");

  const objectiveByLanguage = {
    "pt-BR":
      "Objetivo da landing: apresentar o salao de forma comercial, elegante e convincente para prospeccao.",
    en: "Landing goal: present the salon in a commercial, elegant, and convincing way for outreach.",
    es: "Objetivo de la landing: presentar el salon de forma comercial, elegante y convincente para prospeccion.",
    fr: "Objectif de la landing: presenter le salon de facon commerciale, elegante et convaincante pour la prospection.",
    no: "Maal for landingssiden: presentere salongen pa en kommersiell, elegant og overbevisende mate for outreach.",
  } as const;

  return [
    "Voce e um especialista em landing pages para saloes de beleza.",
    "Analise estas imagens e monte um plano de uso para a landing.",
    "Escolha apenas logoImageId, topImageIds, galleryImageIds, spaceImageIds e ignoredImageIds.",
    "Responda apenas JSON valido.",
    "",
    "REGRAS:",
    "- use ate 3 imagens em topImageIds para o destaque inicial;",
    "- use no maximo 8 imagens na galeria;",
    "- use spaceImageIds apenas para fotos claras de ambiente, espaco fisico ou detalhes do salao;",
    "- se nao houver fotos claras do espaco, use spaceEnabled false;",
    "- nao use highlight/story/avatar;",
    "- nao use logo no destaque inicial, galeria ou Nosso Espaco;",
    "- evite imagens repetidas;",
    "- priorize fotos reais do feed/post;",
    "- use imagens verticais/quadradas no destaque inicial em mosaico ou galeria;",
    "- nao invente IDs;",
    "",
    "JSON esperado:",
`{
  "logoImageId": "id-ou-null",
  "topImageIds": ["id1", "id2", "id3"],
  "galleryImageIds": ["id1", "id2"],
  "spaceEnabled": true,
  "spaceTitle": "Nosso Espaço",
  "spaceDescription": "Texto curto opcional",
  "spaceImageIds": ["id1", "id2"],
  "ignoredImageIds": ["id1", "id2"],
  "summary": "Resumo da decisao",
  "warnings": ["Aviso se houver"]
}`,
    "",
    "DADOS DO SALAO:",
    `nome: ${salon.name}`,
    `cidade: ${salon.city || "-"}`,
    `pais: ${salon.country || "-"}`,
    `location: ${salon.location || "-"}`,
    `descricao curta: ${salon.description || "-"}`,
    `servicos principais: ${
      salon.extractedBusinessInfo?.observedServices ||
      salon.services.map((service) => service.title).join(", ") ||
      "-"
    }`,
    objectiveByLanguage[salon.language] ?? objectiveByLanguage.en,
    "",
    "IMAGENS COLETADAS:",
    candidateLines,
  ].join("\n");
}

export function validateChatGptCurationJson(
  rawJson: string,
  candidates: SalonImageCandidate[],
): ValidationResult {
  if (!rawJson.trim()) {
    return { ok: false, error: "Cole o JSON da curadoria antes de validar." };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { ok: false, error: "O JSON informado nao e valido." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "A curadoria precisa ser um objeto JSON valido." };
  }

  const payload = parsed as ChatGptPlanPayload;
  const analyzed = analyzeImageCandidates(candidates);
  const candidateMap = new Map(analyzed.map((candidate) => [candidate.id, candidate]));
  const logoImageId =
    payload.logoImageId === null || payload.logoImageId === undefined
      ? null
      : String(payload.logoImageId);
  const legacyHeroImageId =
    payload.heroImageId === null || payload.heroImageId === undefined
      ? null
      : String(payload.heroImageId);
  const topImageIds = uniqueStrings([
    ...toStringArray(payload.topImageIds),
    ...(payload.topImageIds?.length
      ? []
      : [
          ...(legacyHeroImageId ? [legacyHeroImageId] : []),
          ...toStringArray(payload.heroMosaicImageIds),
        ]),
  ]);
  const galleryImageIds = uniqueStrings([
    ...toStringArray(payload.galleryImageIds),
    ...toStringArray(payload.resultImageIds),
  ]);
  const spaceImageIds = uniqueStrings([
    ...toStringArray(payload.spaceImageIds),
    ...(payload.spaceImageIds?.length
      ? []
      : toStringArray(payload.experienceImageIds)),
  ]);
  const spaceEnabled =
    typeof payload.spaceEnabled === "boolean"
      ? payload.spaceEnabled
      : spaceImageIds.length > 0;
  const ignoredImageIds = toStringArray(payload.ignoredImageIds);
  const activeIds = [
    ...(logoImageId ? [logoImageId] : []),
    ...topImageIds,
    ...galleryImageIds,
    ...(spaceEnabled ? spaceImageIds : []),
  ];
  const unknownIds = activeIds.filter((id) => !candidateMap.has(id));

  if (unknownIds.length) {
    return {
      ok: false,
      error: `A curadoria usa IDs inexistentes: ${unknownIds.join(", ")}.`,
    };
  }

  if (topImageIds.length > 3) {
    return {
      ok: false,
      error: "Use no maximo 3 imagens em topImageIds.",
    };
  }

  const ignoredActiveIds = activeIds.filter((id) => ignoredImageIds.includes(id));

  if (ignoredActiveIds.length) {
    return {
      ok: false,
      error: `Imagens ignoradas nao podem aparecer em grupos ativos: ${ignoredActiveIds.join(", ")}.`,
    };
  }

  for (const id of activeIds) {
    const candidate = candidateMap.get(id);

    if (!candidate) {
      continue;
    }

    if (
      candidate.collectorOrigin === "highlight" ||
      candidate.collectorOrigin === "avatar" ||
      candidate.suggestedUse === "ignore"
    ) {
      return {
        ok: false,
        error: `A imagem ${id} foi marcada como inadequada para landing e nao pode ser aplicada.`,
      };
    }

    if (
      candidate.suggestedUse === "logo" &&
      (topImageIds.includes(id) ||
        galleryImageIds.includes(id) ||
        spaceImageIds.includes(id))
    ) {
      return {
        ok: false,
        error: `A imagem ${id} parece ser logo e nao pode ser usada no destaque, galeria ou Nosso Espaco.`,
      };
    }
  }

  if (
    logoImageId &&
    (topImageIds.includes(logoImageId) ||
      galleryImageIds.includes(logoImageId) ||
      spaceImageIds.includes(logoImageId))
  ) {
    return {
      ok: false,
      error: "A logo nao pode ser repetida no destaque, galeria ou Nosso Espaco.",
    };
  }

  const unique = new Set(activeIds);
  if (unique.size !== activeIds.length) {
    return {
      ok: false,
      error: "A curadoria repetiu a mesma imagem em varios grupos. Ajuste antes de aplicar.",
    };
  }

  const plan = normalizeSalonLayoutImagePlan({
    mode: "chatgpt_manual",
    logoImageId,
    topImageIds,
    heroImageId: topImageIds.length === 1 ? topImageIds[0] : null,
    heroMosaicImageIds: topImageIds.length > 1 ? topImageIds : [],
    galleryImageIds,
    spaceEnabled,
    spaceTitle: cleanString(payload.spaceTitle) || "Nosso Espaço",
    spaceDescription:
      cleanString(payload.spaceDescription) ||
      "Conheça um pouco do ambiente e dos detalhes do salão.",
    spaceImageIds: spaceEnabled ? spaceImageIds : [],
    experienceImageIds: spaceEnabled ? spaceImageIds : [],
    resultImageIds: [],
    ignoredImageIds,
    summary: cleanString(payload.summary),
    warnings: toStringArray(payload.warnings),
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }) as SalonLayoutImagePlan;

  return {
    ok: true,
    plan,
    summary: {
      logo: logoImageId,
      topCount: topImageIds.length,
      galleryCount: galleryImageIds.length,
      spaceCount: spaceEnabled ? spaceImageIds.length : 0,
      ignoredCount: ignoredImageIds.length,
    },
  };
}

export function applyLayoutImagePlan(params: {
  currentImages: SalonGalleryImage[];
  candidates: SalonImageCandidate[];
  plan: SalonLayoutImagePlan;
  salonName: string;
}) {
  const { currentImages, candidates, plan, salonName } = params;
  const normalizedPlan = normalizeSalonLayoutImagePlan(plan) ?? plan;
  const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const nextImages = [...currentImages];
  const activeIds = [
    ...(normalizedPlan.logoImageId ? [normalizedPlan.logoImageId] : []),
    ...(normalizedPlan.topImageIds ?? [
      ...(normalizedPlan.heroImageId ? [normalizedPlan.heroImageId] : []),
      ...normalizedPlan.heroMosaicImageIds,
    ]),
    ...normalizedPlan.galleryImageIds,
    ...(normalizedPlan.spaceEnabled
      ? normalizedPlan.spaceImageIds ?? normalizedPlan.experienceImageIds
      : []),
  ];

  for (const candidateId of activeIds) {
    const candidate = candidateMap.get(candidateId);

    if (!candidate) {
      continue;
    }

    const existingIndex = nextImages.findIndex(
      (image) => normalizeUrl(image.src) === normalizeUrl(candidate.imageUrl),
    );
    const imageType = resolveImageTypeFromPlan(candidateId, candidate, normalizedPlan);
    const image = buildGalleryImageFromCandidate(candidate, imageType, salonName);

    if (existingIndex >= 0) {
      nextImages[existingIndex] = {
        ...nextImages[existingIndex],
        ...image,
        id: nextImages[existingIndex].id,
      };
    } else {
      nextImages.push(image);
    }
  }

  const updatedCandidates = markCandidatesFromPlan(candidates, {
    ...normalizedPlan,
    appliedAt: new Date().toISOString(),
  }).map((candidate) =>
    activeIds.includes(candidate.id)
      ? { ...candidate, status: "applied" as const }
      : candidate,
  ) as SalonImageCandidate[];

  const selectionSummary: SalonImageSelectionSummary = {
    heroId: (normalizedPlan.topImageIds ?? [normalizedPlan.heroImageId ?? ""]).filter(Boolean)[0],
    logoId: normalizedPlan.logoImageId ?? undefined,
    interiorIds: normalizedPlan.spaceEnabled
      ? normalizedPlan.spaceImageIds ?? normalizedPlan.experienceImageIds
      : [],
    resultIds: [],
    galleryIds: normalizedPlan.galleryImageIds,
    ignoredIds: normalizedPlan.ignoredImageIds,
    selectedAt: normalizedPlan.generatedAt ?? new Date().toISOString(),
    appliedAt: new Date().toISOString(),
  };

  return {
    images: normalizeHeroImages(nextImages),
    updatedCandidates,
    selectionSummary,
    plan: {
      ...normalizedPlan,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function markCandidatesFromPlan(
  candidates: SalonImageCandidate[],
  plan: SalonLayoutImagePlan,
): SalonImageCandidate[] {
  const activeIds = new Set([
    ...(plan.logoImageId ? [plan.logoImageId] : []),
    ...(plan.topImageIds ?? [
      ...(plan.heroImageId ? [plan.heroImageId] : []),
      ...plan.heroMosaicImageIds,
    ]),
    ...plan.galleryImageIds,
    ...(plan.spaceEnabled ? plan.spaceImageIds ?? plan.experienceImageIds : []),
  ]);
  const ignoredIds = new Set(plan.ignoredImageIds);

  return candidates.map((candidate) => ({
    ...candidate,
    status: activeIds.has(candidate.id)
      ? ("selected" as const)
      : ignoredIds.has(candidate.id) || candidate.shouldReject
        ? ("rejected" as const)
        : candidate.status === "applied"
          ? ("applied" as const)
          : ("new" as const),
  }));
}

function resolveImageTypeFromPlan(
  candidateId: string,
  candidate: SalonImageCandidate,
  plan: SalonLayoutImagePlan,
) {
  if (plan.logoImageId === candidateId) {
    return "logo";
  }

  const topImageIds = plan.topImageIds ?? [
    ...(plan.heroImageId ? [plan.heroImageId] : []),
    ...plan.heroMosaicImageIds,
  ];

  if (topImageIds.includes(candidateId)) {
    return candidateId === topImageIds[0] ? "hero" : "gallery";
  }

  if ((plan.spaceImageIds ?? plan.experienceImageIds).includes(candidateId)) {
    return "interior";
  }

  if (plan.galleryImageIds.includes(candidateId)) {
    return "gallery";
  }

  return mapSuggestedUseToImageType(candidate.suggestedUse, candidate.id);
}

function pickFirst(
  candidates: SalonImageCandidate[],
  usedIds: Set<string>,
  predicate: (candidate: SalonImageCandidate) => boolean,
) {
  const candidate = candidates.find(
    (item) => !usedIds.has(item.id) && predicate(item),
  );

  if (candidate) {
    usedIds.add(candidate.id);
  }

  return candidate;
}

function pickMany(
  candidates: SalonImageCandidate[],
  usedIds: Set<string>,
  predicate: (candidate: SalonImageCandidate) => boolean,
  limit: number,
) {
  const selected: SalonImageCandidate[] = [];

  for (const candidate of candidates) {
    if (selected.length >= limit) {
      break;
    }

    if (usedIds.has(candidate.id) || !predicate(candidate)) {
      continue;
    }

    usedIds.add(candidate.id);
    selected.push(candidate);
  }

  return selected;
}

function getConfidence(score: number): SalonDataConfidence {
  if (score >= 76) {
    return "high";
  }

  if (score >= 58) {
    return "medium";
  }

  return "low";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function containsAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function simplifySuggestedUse(value: SalonImageSuggestedUse): SalonImageSuggestedUse {
  switch (value) {
    case "logo":
    case "top":
    case "gallery":
    case "space":
    case "ignore":
      return value;
    case "hero":
    case "hero_mosaic":
      return "top";
    case "experience":
    case "interior":
    case "facade":
      return "space";
    default:
      return "gallery";
  }
}

function normalizeUrl(value: string) {
  return value.trim().toLowerCase();
}

function getOrientation(width?: number, height?: number) {
  if (!width || !height) {
    return "unknown";
  }

  const ratio = width / height;

  if (ratio >= 1.2) {
    return "horizontal";
  }

  if (ratio <= 0.82) {
    return "vertical";
  }

  return "square";
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeHeroImages(images: SalonGalleryImage[]): SalonGalleryImage[] {
  let heroAssigned = false;

  return images.map((image) => {
    if (image.type === "logo") {
      return image;
    }

    if (image.type === "hero") {
      if (!heroAssigned) {
        heroAssigned = true;
        return { ...image, selectedForLanding: true };
      }

      return { ...image, type: "gallery" };
    }

    return image;
  }) as SalonGalleryImage[];
}
