import type { SalonLayoutImagePlan } from "@/types/salon";

export type SalonImagePlanDestination =
  | "bank"
  | "logo"
  | "top"
  | "gallery"
  | "space"
  | "ignore";

type NormalizeSalonLayoutImagePlanOptions = {
  availableImageIds?: Iterable<string>;
};

type MoveImageToDestinationResult = {
  plan: SalonLayoutImagePlan;
  blockedReason?: string;
  replacedLogoImageId?: string | null;
};

const DEFAULT_SPACE_TITLE = "Nosso Espaco";
const DEFAULT_SPACE_DESCRIPTION =
  "Conheca um pouco do ambiente e dos detalhes do salao.";

export function normalizeSalonLayoutImagePlan(
  plan?: SalonLayoutImagePlan,
  options: NormalizeSalonLayoutImagePlanOptions = {},
) {
  if (!plan) {
    return undefined;
  }

  const warnings = new Set(filterStrings(plan.warnings));
  let correctedDuplicates = false;
  let trimmedTopImages = false;
  let removedUnavailableIds = false;

  const logoImageId = filterExistingPlanId(
    cleanString(plan.logoImageId),
    options.availableImageIds,
    () => {
      removedUnavailableIds = true;
    },
  );

  const explicitTopImageIds = toStringArray(plan.topImageIds);
  const topCandidates = collectPlanIds(
    explicitTopImageIds.length
      ? explicitTopImageIds
      : [
          cleanString(plan.heroImageId),
          ...toStringArray(plan.heroMosaicImageIds),
        ],
    options.availableImageIds,
    () => {
      removedUnavailableIds = true;
    },
  );

  const explicitSpaceImageIds = toStringArray(plan.spaceImageIds);
  const spaceCandidates = collectPlanIds(
    explicitSpaceImageIds.length
      ? explicitSpaceImageIds
      : toStringArray(plan.experienceImageIds),
    options.availableImageIds,
    () => {
      removedUnavailableIds = true;
    },
  );

  const explicitGalleryImageIds = toStringArray(plan.galleryImageIds);
  const galleryCandidates = collectPlanIds(
    explicitGalleryImageIds.length
      ? explicitGalleryImageIds
      : toStringArray(plan.resultImageIds),
    options.availableImageIds,
    () => {
      removedUnavailableIds = true;
    },
  );

  const ignoredCandidates = collectPlanIds(
    toStringArray(plan.ignoredImageIds),
    options.availableImageIds,
    () => {
      removedUnavailableIds = true;
    },
  );

  const topImageIds = excludeMatchingIds(topCandidates, [logoImageId].filter(Boolean) as string[]);
  if (topImageIds.length !== topCandidates.length) {
    correctedDuplicates = true;
  }
  if (topImageIds.length > 3) {
    trimmedTopImages = true;
  }
  const limitedTopImageIds = topImageIds.slice(0, 3);

  const spaceImageIds = excludeMatchingIds(spaceCandidates, [
    ...limitedTopImageIds,
    ...(logoImageId ? [logoImageId] : []),
  ]);
  if (spaceImageIds.length !== spaceCandidates.length) {
    correctedDuplicates = true;
  }

  const galleryImageIds = excludeMatchingIds(galleryCandidates, [
    ...limitedTopImageIds,
    ...spaceImageIds,
    ...(logoImageId ? [logoImageId] : []),
  ]);
  if (galleryImageIds.length !== galleryCandidates.length) {
    correctedDuplicates = true;
  }

  const ignoredImageIds = excludeMatchingIds(ignoredCandidates, [
    ...limitedTopImageIds,
    ...spaceImageIds,
    ...galleryImageIds,
    ...(logoImageId ? [logoImageId] : []),
  ]);
  if (ignoredImageIds.length !== ignoredCandidates.length) {
    correctedDuplicates = true;
  }

  if (correctedDuplicates) {
    warnings.add(
      "Plano de imagens corrigido automaticamente para evitar duplicacoes entre as secoes.",
    );
  }

  if (trimmedTopImages) {
    warnings.add(
      "Destaque inicial ajustado automaticamente: apenas 3 imagens podem ficar no topo.",
    );
  }

  if (removedUnavailableIds) {
    warnings.add(
      "Algumas imagens antigas foram removidas do plano porque nao existem mais no salao.",
    );
  }

  const spaceEnabled =
    typeof plan.spaceEnabled === "boolean"
      ? plan.spaceEnabled
      : spaceImageIds.length > 0;

  return {
    mode: plan.mode ?? "local_auto",
    logoImageId: logoImageId ?? null,
    topImageIds: limitedTopImageIds,
    heroImageId: limitedTopImageIds.length === 1 ? limitedTopImageIds[0] : null,
    heroMosaicImageIds: limitedTopImageIds.length > 1 ? limitedTopImageIds : [],
    galleryImageIds,
    spaceEnabled,
    spaceTitle: cleanString(plan.spaceTitle) || DEFAULT_SPACE_TITLE,
    spaceDescription:
      cleanString(plan.spaceDescription) || DEFAULT_SPACE_DESCRIPTION,
    spaceImageIds,
    experienceImageIds: spaceImageIds,
    resultImageIds: [],
    ignoredImageIds,
    summary: cleanString(plan.summary),
    warnings: Array.from(warnings),
    generatedAt: plan.generatedAt,
    appliedAt: plan.appliedAt,
    updatedAt: plan.updatedAt,
  } satisfies SalonLayoutImagePlan;
}

export function moveImageToDestination(
  plan: SalonLayoutImagePlan | undefined,
  imageId: string,
  destination: SalonImagePlanDestination,
  options: NormalizeSalonLayoutImagePlanOptions = {},
): MoveImageToDestinationResult {
  const normalizedPlan =
    normalizeSalonLayoutImagePlan(plan, options) ?? createEmptySalonLayoutImagePlan();
  const nextPlan = removeImageFromLayoutPlan(normalizedPlan, imageId, options) ??
    createEmptySalonLayoutImagePlan();
  const existingLogoId = nextPlan.logoImageId ?? null;

  if (
    destination === "top" &&
    (nextPlan.topImageIds ?? []).length >= 3 &&
    !containsMatchingPlanId(nextPlan.topImageIds ?? [], imageId)
  ) {
    return {
      plan: normalizedPlan,
      blockedReason:
        "Destaque inicial aceita no maximo 3 imagens. Remova uma antes de adicionar outra.",
    };
  }

  switch (destination) {
    case "bank":
      return {
        plan: touchLayoutImagePlan(nextPlan),
      };
    case "logo": {
      const ignoredImageIds = [...(nextPlan.ignoredImageIds ?? [])];

      if (existingLogoId && !imageIdMatchesPlanId(imageId, existingLogoId)) {
        pushUniquePlanId(ignoredImageIds, existingLogoId);
      }

      return {
        plan: touchLayoutImagePlan(
          normalizeSalonLayoutImagePlan(
            {
              ...nextPlan,
              logoImageId: imageId,
              ignoredImageIds,
            },
            options,
          ) ?? nextPlan,
        ),
        replacedLogoImageId:
          existingLogoId && !imageIdMatchesPlanId(imageId, existingLogoId)
            ? existingLogoId
            : null,
      };
    }
    case "top":
      return {
        plan: touchLayoutImagePlan(
          normalizeSalonLayoutImagePlan(
            {
              ...nextPlan,
              topImageIds: [...(nextPlan.topImageIds ?? []), imageId],
            },
            options,
          ) ?? nextPlan,
        ),
      };
    case "gallery":
      return {
        plan: touchLayoutImagePlan(
          normalizeSalonLayoutImagePlan(
            {
              ...nextPlan,
              galleryImageIds: [...(nextPlan.galleryImageIds ?? []), imageId],
            },
            options,
          ) ?? nextPlan,
        ),
      };
    case "space":
      return {
        plan: touchLayoutImagePlan(
          normalizeSalonLayoutImagePlan(
            {
              ...nextPlan,
              spaceEnabled: true,
              spaceImageIds: [...(nextPlan.spaceImageIds ?? []), imageId],
            },
            options,
          ) ?? nextPlan,
        ),
      };
    default:
      return {
        plan: touchLayoutImagePlan(
          normalizeSalonLayoutImagePlan(
            {
              ...nextPlan,
              ignoredImageIds: [...(nextPlan.ignoredImageIds ?? []), imageId],
            },
            options,
          ) ?? nextPlan,
        ),
      };
  }
}

export function removeImageFromLayoutPlan(
  plan: SalonLayoutImagePlan | undefined,
  imageId: string,
  options: NormalizeSalonLayoutImagePlanOptions = {},
) {
  if (!plan) {
    return undefined;
  }

  const normalizedPlan =
    normalizeSalonLayoutImagePlan(plan, options) ?? createEmptySalonLayoutImagePlan();

  return touchLayoutImagePlan(
    normalizeSalonLayoutImagePlan(
      {
        ...normalizedPlan,
        logoImageId:
          normalizedPlan.logoImageId &&
          imageIdMatchesPlanId(imageId, normalizedPlan.logoImageId)
            ? null
            : normalizedPlan.logoImageId,
        topImageIds: removeMatchingPlanIds(normalizedPlan.topImageIds ?? [], imageId),
        galleryImageIds: removeMatchingPlanIds(
          normalizedPlan.galleryImageIds ?? [],
          imageId,
        ),
        spaceImageIds: removeMatchingPlanIds(normalizedPlan.spaceImageIds ?? [], imageId),
        ignoredImageIds: removeMatchingPlanIds(
          normalizedPlan.ignoredImageIds ?? [],
          imageId,
        ),
      },
      options,
    ) ?? normalizedPlan,
  );
}

export function moveImageWithinDestination(
  plan: SalonLayoutImagePlan | undefined,
  imageId: string,
  direction: -1 | 1,
  options: NormalizeSalonLayoutImagePlanOptions = {},
) {
  if (!plan) {
    return plan;
  }

  const normalizedPlan =
    normalizeSalonLayoutImagePlan(plan, options) ?? createEmptySalonLayoutImagePlan();

  return touchLayoutImagePlan({
    ...normalizedPlan,
    topImageIds: movePlanIdInList(normalizedPlan.topImageIds ?? [], imageId, direction),
    galleryImageIds: movePlanIdInList(
      normalizedPlan.galleryImageIds ?? [],
      imageId,
      direction,
    ),
    spaceImageIds: movePlanIdInList(
      normalizedPlan.spaceImageIds ?? [],
      imageId,
      direction,
    ),
    experienceImageIds: movePlanIdInList(
      normalizedPlan.experienceImageIds,
      imageId,
      direction,
    ),
  });
}

export function updateLayoutPlanSpaceSettings(
  plan: SalonLayoutImagePlan | undefined,
  updates: Partial<
    Pick<SalonLayoutImagePlan, "spaceEnabled" | "spaceTitle" | "spaceDescription">
  >,
  options: NormalizeSalonLayoutImagePlanOptions = {},
) {
  return touchLayoutImagePlan(
    normalizeSalonLayoutImagePlan(
      {
        ...(normalizeSalonLayoutImagePlan(plan, options) ??
          createEmptySalonLayoutImagePlan()),
        ...updates,
      },
      options,
    ) ?? createEmptySalonLayoutImagePlan(),
  );
}

export function getImageDestinationFromPlan(
  imageId: string,
  plan?: SalonLayoutImagePlan,
): SalonImagePlanDestination | undefined {
  const normalizedPlan = normalizeSalonLayoutImagePlan(plan);

  if (!normalizedPlan) {
    return undefined;
  }

  if (
    normalizedPlan.logoImageId &&
    imageIdMatchesPlanId(imageId, normalizedPlan.logoImageId)
  ) {
    return "logo";
  }

  if (containsMatchingPlanId(normalizedPlan.topImageIds ?? [], imageId)) {
    return "top";
  }

  if (containsMatchingPlanId(normalizedPlan.galleryImageIds ?? [], imageId)) {
    return "gallery";
  }

  if (containsMatchingPlanId(normalizedPlan.spaceImageIds ?? [], imageId)) {
    return "space";
  }

  if (containsMatchingPlanId(normalizedPlan.ignoredImageIds ?? [], imageId)) {
    return "ignore";
  }

  return undefined;
}

export function imageIdMatchesPlanId(imageId: string, planId: string) {
  return imageId === planId || imageId === `image-${planId}` || imageId.endsWith(planId);
}

export function containsMatchingPlanId(imageIds: Iterable<string>, imageId: string) {
  for (const currentImageId of imageIds) {
    if (imageIdMatchesPlanId(imageId, currentImageId)) {
      return true;
    }
  }

  return false;
}

function createEmptySalonLayoutImagePlan(): SalonLayoutImagePlan {
  return {
    mode: "local_auto",
    logoImageId: null,
    topImageIds: [],
    heroImageId: null,
    heroMosaicImageIds: [],
    galleryImageIds: [],
    spaceEnabled: false,
    spaceTitle: DEFAULT_SPACE_TITLE,
    spaceDescription: DEFAULT_SPACE_DESCRIPTION,
    spaceImageIds: [],
    experienceImageIds: [],
    resultImageIds: [],
    ignoredImageIds: [],
    warnings: [],
  };
}

function collectPlanIds(
  values: Array<string | null | undefined>,
  availableImageIds?: Iterable<string>,
  onMissing?: () => void,
) {
  const ids: string[] = [];

  for (const value of values) {
    const normalizedValue = cleanString(value);

    if (!normalizedValue) {
      continue;
    }

    const matchesAvailable = filterExistingPlanId(
      normalizedValue,
      availableImageIds,
      onMissing,
    );

    if (!matchesAvailable || containsMatchingPlanId(ids, matchesAvailable)) {
      continue;
    }

    ids.push(matchesAvailable);
  }

  return ids;
}

function filterExistingPlanId(
  imageId: string | undefined,
  availableImageIds?: Iterable<string>,
  onMissing?: () => void,
) {
  if (!imageId) {
    return undefined;
  }

  if (!availableImageIds) {
    return imageId;
  }

  for (const availableImageId of availableImageIds) {
    if (imageIdMatchesPlanId(availableImageId, imageId)) {
      return imageId;
    }
  }

  onMissing?.();
  return undefined;
}

function excludeMatchingIds(source: string[], blockedIds: string[]) {
  const keptIds: string[] = [];

  for (const id of source) {
    if (containsMatchingPlanId(blockedIds, id)) {
      continue;
    }

    pushUniquePlanId(keptIds, id);
  }

  return keptIds;
}

function removeMatchingPlanIds(ids: string[], imageId: string) {
  return ids.filter((currentId) => !imageIdMatchesPlanId(imageId, currentId));
}

function movePlanIdInList(ids: string[], imageId: string, direction: -1 | 1) {
  const nextIds = [...ids];
  const index = nextIds.findIndex((currentId) => imageIdMatchesPlanId(imageId, currentId));

  if (index === -1) {
    return nextIds;
  }

  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= nextIds.length) {
    return nextIds;
  }

  const [movedId] = nextIds.splice(index, 1);
  nextIds.splice(nextIndex, 0, movedId);
  return nextIds;
}

function pushUniquePlanId(ids: string[], imageId: string) {
  if (!containsMatchingPlanId(ids, imageId)) {
    ids.push(imageId);
  }
}

function filterStrings(values: Array<string | null | undefined> | undefined) {
  return (values ?? []).map(cleanString).filter(Boolean) as string[];
}

function toStringArray(values: string[] | undefined) {
  return filterStrings(values);
}

function cleanString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function touchLayoutImagePlan(plan: SalonLayoutImagePlan) {
  return {
    ...plan,
    updatedAt: new Date().toISOString(),
  };
}
