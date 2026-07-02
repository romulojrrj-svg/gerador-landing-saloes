import { applyLayoutImagePlan, createLocalImagePlan } from "@/lib/image-intelligence";
import { mergeImageCandidates } from "@/lib/image-curation";
import type {
  Salon,
  SalonImageCandidate,
  SalonLayoutImagePlan,
  SalonSourceStatus,
} from "@/types/salon";

export type InstagramImageProviderOptions = {
  maxPosts?: number;
  maxScrolls?: number;
  maxOpenedPosts?: number;
};

export type InstagramImageFetchResult =
  | {
      ok: true;
      candidates: SalonImageCandidate[];
      debug?: unknown;
    }
  | {
      ok: false;
      candidates: SalonImageCandidate[];
      error: string;
      errorType?: string;
      debug?: unknown;
    };

export type InstagramImageEnrichmentResult = {
  ok: boolean;
  salon: Salon;
  instagramUrl: string;
  candidatesFound: number;
  imagesSaved: number;
  heroSelected: boolean;
  galleryCount: number;
  experienceCount: number;
  resultCount: number;
  plan?: SalonLayoutImagePlan;
  error?: string;
  errorType?: string;
  debug?: unknown;
};

export async function fetchInstagramImagesForSalon(
  salon: Salon,
  options: InstagramImageProviderOptions = {},
): Promise<InstagramImageFetchResult> {
  const instagramUrl = salon.instagramUrl?.trim() || salon.instagramProfileUrl?.trim() || "";

  if (!instagramUrl) {
    return {
      ok: false,
      candidates: [],
      error: "Salao sem Instagram informado.",
      errorType: "missing_url",
    };
  }

  try {
    const response = await fetch("/api/import/browser-instagram-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: instagramUrl,
        maxPosts: options.maxPosts ?? 12,
        maxScrolls: options.maxScrolls ?? 3,
        maxOpenedPosts: options.maxOpenedPosts ?? 3,
      }),
    });
    const payload = (await response.json()) as {
      success?: boolean;
      candidates?: SalonImageCandidate[];
      error?: string;
      errorType?: string;
      debug?: unknown;
    };
    const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];

    if (!response.ok || !payload.success || !candidates.length) {
      return {
        ok: false,
        candidates,
        error:
          payload.error ||
          "Instagram nao retornou imagens aproveitaveis para este salao.",
        errorType: payload.errorType,
        debug: payload.debug,
      };
    }

    return {
      ok: true,
      candidates,
      debug: payload.debug,
    };
  } catch (error) {
    return {
      ok: false,
      candidates: [],
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao buscar imagens do Instagram.",
      errorType: "internal",
    };
  }
}

export async function enrichImportedSalonWithImages(
  salon: Salon,
  options: InstagramImageProviderOptions = {},
): Promise<InstagramImageEnrichmentResult> {
  const instagramUrl = salon.instagramUrl?.trim() || salon.instagramProfileUrl?.trim() || "";
  const fetched = await fetchInstagramImagesForSalon(salon, options);

  if (!fetched.ok) {
    return {
      ok: false,
      salon: withInstagramImportStatus(salon, "failed", fetched.error),
      instagramUrl,
      candidatesFound: fetched.candidates.length,
      imagesSaved: 0,
      heroSelected: false,
      galleryCount: 0,
      experienceCount: 0,
      resultCount: 0,
      error: fetched.error,
      errorType: fetched.errorType,
      debug: fetched.debug,
    };
  }

  const mergedCandidates = mergeImageCandidates(
    salon.imageCandidates ?? [],
    fetched.candidates,
  );
  const { analyzedCandidates, plan } = createLocalImagePlan(mergedCandidates);
  const applied = applyLayoutImagePlan({
    currentImages: salon.galleryImages ?? [],
    candidates: analyzedCandidates,
    plan,
    salonName: salon.name,
  });
  const instagramImages = applied.images.filter((image) => image.source === "instagram");
  const savedImages = instagramImages.filter(
    (image) => image.selectedForLanding && image.type !== "logo",
  );
  const enrichedSalon: Salon = {
    ...salon,
    galleryImages: applied.images,
    gallery: applied.images,
    imageCandidates: applied.updatedCandidates,
    imageSelectionSummary: applied.selectionSummary,
    layoutImagePlan: applied.plan,
    importedInstagramImages: instagramImages,
    instagramImportStatus: "imported",
    imagesSourceStatus: savedImages.length ? "imported" : salon.imagesSourceStatus,
    hasRealImages: salon.hasRealImages || savedImages.length > 0,
    lastImportAt: new Date().toISOString(),
    sourceProfile: {
      ...salon.sourceProfile,
      instagramProfileUrl: instagramUrl,
      importedInstagramImages: instagramImages,
      instagramImportStatus: "imported",
      lastImportAt: new Date().toISOString(),
      importErrors: salon.sourceProfile?.importErrors ?? salon.importErrors ?? [],
    },
  };

  if (!savedImages.length) {
    const error =
      fetched.candidates.length > 0
        ? `Instagram retornou ${fetched.candidates.length} candidata(s), mas nenhuma passou na curadoria automatica para a landing.`
        : "Instagram nao retornou imagens aproveitaveis para este salao.";

    return {
      ok: false,
      salon: withInstagramImportStatus(enrichedSalon, "failed", error),
      instagramUrl,
      candidatesFound: fetched.candidates.length,
      imagesSaved: 0,
      heroSelected: false,
      galleryCount: 0,
      experienceCount: 0,
      resultCount: 0,
      plan,
      error,
      errorType: "no_selected_images",
      debug: fetched.debug,
    };
  }

  return {
    ok: true,
    salon: enrichedSalon,
    instagramUrl,
    candidatesFound: fetched.candidates.length,
    imagesSaved: savedImages.length,
    heroSelected: Boolean(plan.heroImageId || plan.heroMosaicImageIds.length),
    galleryCount: plan.galleryImageIds.length + plan.heroMosaicImageIds.length,
    experienceCount: plan.experienceImageIds.length,
    resultCount: plan.resultImageIds.length,
    plan,
    debug: fetched.debug,
  };
}

function withInstagramImportStatus(
  salon: Salon,
  status: SalonSourceStatus,
  error: string,
): Salon {
  const importErrors = Array.from(
    new Set([...(salon.importErrors ?? []), error].filter(Boolean)),
  );

  return {
    ...salon,
    instagramImportStatus: status,
    importErrors,
    lastImportAt: new Date().toISOString(),
    sourceProfile: {
      ...salon.sourceProfile,
      instagramProfileUrl: salon.instagramUrl ?? salon.instagramProfileUrl,
      instagramImportStatus: status,
      lastImportAt: new Date().toISOString(),
      importErrors,
    },
  };
}
