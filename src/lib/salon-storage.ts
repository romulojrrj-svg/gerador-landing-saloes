import type {
  Salon,
  SalonCommercialStatus,
  SalonCopySuggestion,
  SalonExtractedBusinessInfo,
  SalonFormInput,
  SalonGalleryImage,
  SalonImageCandidate,
  SalonImageSelectionSummary,
  SalonImageSuggestedUse,
  SalonLayoutImagePlan,
  SalonLanguage,
  SalonService,
  SalonSourceMaterial,
  SalonSourceMode,
  SalonStatus,
  SalonTestimonial,
} from "@/types/salon";
import { applyCopySuggestionToServices } from "./copy-generator";
import { getLandingCopy } from "./landing-copy";
import { normalizeCommercialStatus } from "./salon-commercial-status";
import { normalizeSalonLayoutImagePlan } from "./salon-image-plan";

const STORAGE_PREFIX = "salon-lg:salons:";
const STORAGE_INDEX_KEY = "salon-lg:salons:index";
const STORAGE_CHANGED_EVENT = "salon-lg:salons:changed";

export type SalonIndexItem = {
  slug: string;
  name: string;
  status: SalonStatus;
  updatedAt: string;
};

export type SalonStorageResult =
  | { ok: true; salon: Salon }
  | { ok: false; error: string };

export const landingLanguageLabels: Record<string, string> = {
  "pt-BR": "PortuguÃªs do Brasil",
  en: "InglÃªs",
  es: "Espanhol",
  fr: "FrancÃªs",
};

const serviceDescriptions: Record<string, string> = {
  "Design de cabelo":
    "Personalized cut, finish, and styling direction planned around face shape, lifestyle, and texture.",
  "Coloracao":
    "Dimensional color, glossing, and tone correction for a luminous result that looks polished in natural and studio light.",
  "Rituais de pele":
    "A calm skin ritual combining cleansing, sculpting massage, and glow-focused finishing products.",
  "Noivas e eventos":
    "Camera-ready styling for weddings, dinners, launches, and private event preparation.",
  "AteliÃª de unhas":
    "Detailed nail care with refined shaping, long-wear color, and a clean editorial finish.",
  "Maquiagem":
    "Soft, elevated makeup for photos, events, and clients who want a polished but breathable finish.",
};

const defaultGalleryImages: SalonGalleryImage[] = [
  {
    id: "hero",
    url: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=2200&q=88",
    src: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=2200&q=88",
    alt: "Premium salon interior",
    title: "Imagem principal",
    type: "hero",
    source: "placeholder",
    isReal: false,
    selectedForLanding: true,
  },
  {
    id: "interior",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
    alt: "Soft salon interior with styling chairs",
    title: "Imagem do ambiente",
    type: "interior",
    source: "placeholder",
    isReal: false,
    selectedForLanding: true,
  },
  {
    id: "service",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
    alt: "Hair stylist finishing a luxury look",
    title: "Imagem de serviÃ§o",
    type: "service",
    source: "placeholder",
    isReal: false,
    selectedForLanding: true,
  },
  {
    id: "result",
    url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
    src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
    alt: "Client receiving a calming facial treatment",
    title: "Imagem de resultado",
    type: "result",
    source: "placeholder",
    isReal: false,
    selectedForLanding: true,
  },
];

export function getSalonStorageKey(slug: string) {
  return `${STORAGE_PREFIX}${slug}`;
}

export function getSalonStorageChangedEvent() {
  return STORAGE_CHANGED_EVENT;
}

export function getSalonIndexStorageKey() {
  return STORAGE_INDEX_KEY;
}

export function normalizeSlug(name: string) {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "novo-salao";
}

export function generateUniqueSlug(name: string, currentSlug?: string) {
  const baseSlug = normalizeSlug(name);

  if (!isBrowser()) {
    return baseSlug;
  }

  let nextSlug = baseSlug;
  let suffix = 2;

  while (slugExists(nextSlug) && nextSlug !== currentSlug) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
}

export function createSalon(data: SalonFormInput): SalonStorageResult {
  const slug = generateUniqueSlug(data.name);
  const now = new Date().toISOString();
  const salon = buildCompleteSalon({
    ...dataToPartialSalon(data),
    id: createId(),
    slug,
    status: data.status ?? "preview",
    sourceMode: "manual",
    generationStatus: "idle",
    createdAt: now,
    updatedAt: now,
  });

  return saveSalon(salon);
}

export function updateSalon(
  slug: string,
  data: SalonFormInput,
): SalonStorageResult {
  const existingSalon = getSalonBySlug(slug);

  if (!existingSalon) {
    return {
      ok: false,
      error: "SalÃ£o nÃ£o encontrado no armazenamento local.",
    };
  }

  const updatedSalon = mergeSalonUpdates(existingSalon, dataToPartialSalon(data));

  return saveSalon(updatedSalon);
}

export function saveSalon(salon: Salon): SalonStorageResult {
  if (!isBrowser()) {
    return {
      ok: false,
      error: "O armazenamento local sÃ³ estÃ¡ disponÃ­vel no navegador.",
    };
  }

  try {
    const completeSalon = ensureCompleteSalon(salon);
    const key = getSalonStorageKey(completeSalon.slug);

    window.localStorage.setItem(key, JSON.stringify(completeSalon));
    updateSalonIndex(completeSalon);
    notifySalonStorageChanged(key, completeSalon);
    debugSalonStorage("saved", {
      key,
      slug: completeSalon.slug,
      name: completeSalon.name,
    });

    return { ok: true, salon: completeSalon };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "NÃ£o foi possÃ­vel salvar o salÃ£o.";

    debugSalonStorage("save-failed", { slug: salon.slug, message });

    return { ok: false, error: message };
  }
}

export function getSalonBySlug(slug: string) {
  if (!isBrowser()) {
    return null;
  }

  try {
    const key = getSalonStorageKey(slug);
    const rawSalon = window.localStorage.getItem(key);

    if (!rawSalon) {
      debugSalonStorage("not-found", { key });

      return null;
    }

    const parsedSalon = JSON.parse(rawSalon) as Partial<Salon>;
    const salon = ensureCompleteSalon(parsedSalon);

    debugSalonStorage("loaded", { key, slug: salon.slug, name: salon.name });

    return salon;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "JSON invÃ¡lido no localStorage.";

    debugSalonStorage("load-failed", { slug, message });

    return null;
  }
}

export function listSalons() {
  return getSalonIndex()
    .map((item) => getSalonBySlug(item.slug))
    .filter((salon): salon is Salon => Boolean(salon));
}

export function deleteSalon(slug: string) {
  if (!isBrowser()) {
    return false;
  }

  try {
    const key = getSalonStorageKey(slug);

    window.localStorage.removeItem(key);
    const nextIndex = getSalonIndex().filter((item) => item.slug !== slug);
    window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(nextIndex));
    notifySalonStorageChanged(key, null);

    return true;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao deletar salÃ£o.";

    debugSalonStorage("delete-failed", { slug, message });

    return false;
  }
}

export function duplicateSalon(slug: string): SalonStorageResult {
  const existingSalon = getSalonBySlug(slug);

  if (!existingSalon) {
    return {
      ok: false,
      error: "SalÃ£o nÃ£o encontrado para duplicaÃ§Ã£o.",
    };
  }

  const now = new Date().toISOString();
  const duplicatedSalon = ensureCompleteSalon({
    ...existingSalon,
    id: createId(),
    name: `${existingSalon.name} (cÃ³pia)`,
    slug: generateUniqueSlug(`${existingSalon.name} copia`),
    status: "draft",
    sourceMode: "manual",
    createdAt: now,
    updatedAt: now,
  });

  return saveSalon(duplicatedSalon);
}

export function getSalonIndex(): SalonIndexItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const rawIndex = window.localStorage.getItem(STORAGE_INDEX_KEY);

    if (!rawIndex) {
      return [];
    }

    const parsedIndex = JSON.parse(rawIndex);

    if (!Array.isArray(parsedIndex)) {
      return [];
    }

    return parsedIndex
      .filter(isSalonIndexItem)
      .filter((item, index, indexItems) => {
        return indexItems.findIndex((candidate) => candidate.slug === item.slug) === index;
      });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ãndice local corrompido.";

    debugSalonStorage("index-load-failed", { message });

    return [];
  }
}

export function updateSalonIndex(salon: Salon) {
  if (!isBrowser()) {
    return;
  }

  const nextItem: SalonIndexItem = {
    slug: salon.slug,
    name: salon.name,
    status: salon.status,
    updatedAt: salon.updatedAt,
  };
  const nextIndex = [
    nextItem,
    ...getSalonIndex().filter((item) => item.slug !== salon.slug),
  ];

  window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(nextIndex));
}

export function buildSalonFromFormData(
  formData: FormData,
  existingSalon?: Salon,
) {
  const input = formDataToInput(formData);

  return existingSalon
    ? mergeSalonUpdates(existingSalon, dataToPartialSalon(input))
    : buildCompleteSalon({
        ...dataToPartialSalon(input),
        id: createId(),
        slug: generateUniqueSlug(input.name),
        status: input.status ?? "preview",
        sourceMode: "manual",
        generationStatus: "idle",
      });
}

export function mergeSalonUpdates(
  existingSalon: Salon,
  updates: Partial<Salon>,
) {
  const cleanedUpdates = removeUndefinedValues(updates);

  return buildCompleteSalon({
    ...existingSalon,
    ...cleanedUpdates,
    id: existingSalon.id,
    slug: existingSalon.slug,
    createdAt: existingSalon.createdAt,
    status: cleanedUpdates.status ?? existingSalon.status ?? "preview",
    sourceMode: cleanedUpdates.sourceMode ?? existingSalon.sourceMode ?? "manual",
    generationStatus:
      cleanedUpdates.generationStatus ?? existingSalon.generationStatus ?? "idle",
    updatedAt: new Date().toISOString(),
  });
}

export function createSalonDefaults(partialSalon: Partial<Salon> = {}) {
  return buildCompleteSalon(partialSalon);
}

export function ensureCompleteSalon(partialSalon: Partial<Salon>) {
  return buildCompleteSalon(partialSalon);
}

export function salonFormInputToPartialSalon(data: SalonFormInput) {
  return dataToPartialSalon(data);
}

export function formDataToInput(formData: FormData): SalonFormInput {
  return {
    name: getString(formData, "name", ""),
    location: getString(formData, "location", ""),
    city: getString(formData, "city", ""),
    country: getString(formData, "country", ""),
    status: getStatus(formData),
    commercialStatus: getCommercialStatus(formData),
    language: getLanguage(formData),
    positioningLine: getString(formData, "positioningLine", ""),
    description: getString(formData, "description", ""),
    visualStyle: getString(formData, "visualStyle", "Luxo suave"),
    brandTone: getString(formData, "brandTone", "Premium e acolhedor"),
    instagramUrl: getOptionalString(formData, "instagramUrl"),
    googleMapsUrl:
      getOptionalString(formData, "googleMapsUrl") ??
      getOptionalString(formData, "googleBusinessUrl"),
    websiteUrl: getOptionalString(formData, "websiteUrl"),
    bookingUrl: getOptionalString(formData, "bookingUrl"),
    whatsapp: getOptionalString(formData, "whatsapp"),
    phone: getOptionalString(formData, "phone"),
    businessHours: getOptionalString(formData, "businessHours"),
    address: getOptionalString(formData, "address"),
    extractedBusinessInfo: {
      businessHours: getOptionalString(formData, "businessHours"),
      address: getOptionalString(formData, "address"),
      observedServices: getOptionalString(formData, "observedServices"),
      differentiators: getOptionalString(formData, "differentiators"),
      visualNotes: getOptionalString(formData, "visualNotes"),
    },
    manualAssistantNotes: getOptionalString(formData, "manualAssistantNotes"),
    selectedServices: formData
      .getAll("services")
      .map((service) => String(service))
      .filter(Boolean),
    notes: getOptionalString(formData, "notes"),
  };
}

function buildCompleteSalon(partialSalon: Partial<Salon>): Salon {
  const now = new Date().toISOString();
  const name = clean(partialSalon.name) || "Novo SalÃ£o";
  const slug = clean(partialSalon.slug) || normalizeSlug(name);
  const language = partialSalon.language ?? partialSalon.landingLanguage ?? "en";
  const landingCopy = getLandingCopy(language);
  const commercialStatus = normalizeCommercialStatus(
    partialSalon.commercialStatus,
  );
  const location =
    clean(partialSalon.location) ||
    formatLocation(partialSalon.city, partialSalon.country);
  const city = clean(partialSalon.city) || inferCity(location);
  const country = clean(partialSalon.country) || inferCountry(location);
  const positioningLine =
    clean(partialSalon.positioningLine) || clean(partialSalon.tagline);
  const description = clean(partialSalon.description);
  const visualStyle = clean(partialSalon.visualStyle) || "Luxo suave";
  const brandTone = clean(partialSalon.brandTone) || "Premium e acolhedor";
  const galleryImages = normalizeGalleryImages(
    partialSalon.galleryImages ?? partialSalon.gallery ?? defaultGalleryImages,
    name,
  );
  const availableLayoutImageIds = galleryImages.some((image) => image.isReal)
    ? galleryImages.filter((image) => image.isReal).map((image) => image.id)
    : galleryImages.map((image) => image.id);
  const imageCandidates = normalizeImageCandidates(partialSalon.imageCandidates);
  const imageSelectionSummary = normalizeImageSelectionSummary(
    partialSalon.imageSelectionSummary,
  );
  const layoutImagePlan = normalizeLayoutImagePlan(
    partialSalon.layoutImagePlan,
    availableLayoutImageIds,
  );
  const realImages = galleryImages.filter((image) => image.isReal);
  const hasRealImages = realImages.length > 0;
  const landingReadyImages = galleryImages.filter(
    (image) => image.selectedForLanding && image.type !== "logo",
  );
  const selectedHeroImage = galleryImages.find(
    (image) =>
      image.isReal &&
      image.selectedForLanding &&
      image.type !== "logo" &&
      (image.type === "hero" || image.type === "interior"),
  );
  const heroImage =
    selectedHeroImage?.src ||
    landingReadyImages[0]?.src ||
    clean(partialSalon.heroImage) ||
    defaultGalleryImages.find((image) => image.type === "hero")?.src ||
    defaultGalleryImages[0].src;
  const selectedServices = normalizeSelectedServices(
    partialSalon.selectedServices,
    partialSalon.services,
  );
  const copySuggestions = normalizeCopySuggestion(partialSalon.copySuggestions);
  const generatedCopy = normalizeCopySuggestion(partialSalon.generatedCopy);
  const copyHistory = normalizeCopyHistory(partialSalon.copyHistory);
  const appliedCopy =
    generatedCopy?.status === "applied"
      ? generatedCopy
      : copySuggestions?.status === "applied"
        ? copySuggestions
        : undefined;
  const normalizedServices = normalizeServices(
    partialSalon.services,
    selectedServices,
    language,
  );
  const services = appliedCopy
    ? applyCopySuggestionToServices(normalizedServices, appliedCopy)
    : normalizedServices;
  const serviceCategories = Array.from(
    new Set([
      ...(partialSalon.serviceCategories ?? []),
      ...services.map((service) => service.category).filter(Boolean),
    ] as string[]),
  );
  const featuredServices =
    partialSalon.featuredServices?.length
      ? partialSalon.featuredServices
      : services.filter((service) => service.featured).map((service) => service.title);
  const headline =
    clean(appliedCopy?.headline) ||
    clean(partialSalon.headline) ||
    clean(partialSalon.ctaTitle) ||
    name;
  const subheadline =
    clean(appliedCopy?.subheadline) ||
    clean(partialSalon.subheadline) ||
    clean(partialSalon.tagline) ||
    positioningLine;
  const aboutText =
    clean(appliedCopy?.aboutText) ||
    clean(partialSalon.aboutText) ||
    clean(partialSalon.summary);
  const ctaPrimary =
    clean(appliedCopy?.ctaTitle) ||
    clean(partialSalon.ctaPrimary) ||
    clean(partialSalon.ctaTitle) ||
    landingCopy.requestBooking;
  const ctaSecondary =
    clean(appliedCopy?.ctaButtonLabel) ||
    clean(partialSalon.ctaSecondary) ||
    landingCopy.exploreServices;
  const testimonials = normalizeTestimonials(partialSalon.testimonials);
  const realReviews = testimonials.filter((review) => review.isReal);
  const hasRealReviews = realReviews.length > 0;
  const sourceBusinessInfo = partialSalon.extractedBusinessInfo;
  const extractedBusinessInfo = {
    ...partialSalon.extractedBusinessInfo,
    businessHours:
      cleanBusinessInfoField(sourceBusinessInfo, "businessHours") ??
      clean(partialSalon.businessHours),
    address:
      cleanBusinessInfoField(sourceBusinessInfo, "address") ??
      clean(partialSalon.address),
    observedServices:
      cleanBusinessInfoField(sourceBusinessInfo, "observedServices") ?? "",
    differentiators:
      cleanBusinessInfoField(sourceBusinessInfo, "differentiators") ?? "",
    visualNotes: cleanBusinessInfoField(sourceBusinessInfo, "visualNotes") ?? "",
  };
  const businessHours = extractedBusinessInfo.businessHours ?? "";
  const address = extractedBusinessInfo.address ?? "";
  const instagramUrl = clean(partialSalon.instagramUrl);
  const instagramProfileUrl = clean(partialSalon.instagramProfileUrl) || instagramUrl;
  const googleMapsUrl = hasOwnKey(partialSalon, "googleMapsUrl")
    ? clean(partialSalon.googleMapsUrl)
    : clean(partialSalon.googleBusinessUrl);
  const websiteUrl = clean(partialSalon.websiteUrl);
  const bookingUrl = clean(partialSalon.bookingUrl);
  const whatsapp = clean(partialSalon.whatsapp);
  const phone = clean(partialSalon.phone);
  const notes = partialSalon.notes;
  const manualAssistantNotes = hasOwnKey(partialSalon, "manualAssistantNotes")
    ? clean(partialSalon.manualAssistantNotes)
    : clean(partialSalon.notes);
  const googleRating =
    normalizeOptionalNumber(partialSalon.googleRating) ??
    extractGoogleRating(notes) ??
    extractGoogleRating(manualAssistantNotes);
  const googleReviewCount =
    normalizeOptionalInteger(partialSalon.googleReviewCount) ??
    extractGoogleReviewCount(notes) ??
    extractGoogleReviewCount(manualAssistantNotes);

  return {
    id: clean(partialSalon.id) || createId(),
    slug,
    name,
    location,
    city,
    country,
    language,
    landingLanguage: language,
    positioningLine,
    description,
    visualStyle,
    brandTone,
    instagramUrl,
    instagramProfileUrl,
    googleMapsUrl,
    googleBusinessUrl: googleMapsUrl,
    websiteUrl,
    bookingUrl,
    whatsapp,
    phone,
    googleRating,
    googleReviewCount,
    services,
    selectedServices,
    serviceCategories,
    featuredServices,
    headline,
    subheadline,
    aboutText,
    ctaPrimary,
    ctaSecondary,
    testimonials,
    galleryImages,
    gallery: galleryImages,
    realImages,
    imageCandidates,
    imageSelectionSummary,
    layoutImagePlan,
    realReviews,
    heroImage,
    images: galleryImages.map((image) => ({
      ...image,
      id: image.id,
    })),
    businessHours,
    address,
    extractedBusinessInfo,
    sourceMaterials: normalizeSourceMaterials(partialSalon.sourceMaterials),
    socialLinks: {
      ...partialSalon.socialLinks,
      instagram: instagramUrl,
      googleMaps: googleMapsUrl,
      website: websiteUrl,
      booking: bookingUrl,
      whatsapp,
      phone,
    },
    status: normalizeSalonStatus(partialSalon.status),
    commercialStatus,
    createdAt: partialSalon.createdAt ?? now,
    updatedAt: partialSalon.updatedAt ?? now,
    sourceMode: partialSalon.sourceMode ?? "manual",
    generationStatus: partialSalon.generationStatus ?? "idle",
    dataConfidence: partialSalon.dataConfidence ?? "low",
    imagesSourceStatus:
      partialSalon.imagesSourceStatus ?? (hasRealImages ? "imported" : "placeholder"),
    reviewsSourceStatus:
      partialSalon.reviewsSourceStatus ?? (hasRealReviews ? "imported" : "placeholder"),
    hasRealImages,
    hasRealReviews,
    generatedCopyStatus: partialSalon.generatedCopyStatus ?? "not_started",
    notes,
    lastGeneratedAt: partialSalon.lastGeneratedAt ?? generatedCopy?.generatedAt,
    lastAppliedAt: partialSalon.lastAppliedAt ?? generatedCopy?.appliedAt,
    sourceSummary: partialSalon.sourceSummary,
    sourceProfile: {
      ...partialSalon.sourceProfile,
      instagramProfileUrl:
        partialSalon.sourceProfile?.instagramProfileUrl ?? instagramProfileUrl,
      googleBusinessUrl:
        partialSalon.sourceProfile?.googleBusinessUrl ?? googleMapsUrl,
      importedInstagramImages:
        partialSalon.sourceProfile?.importedInstagramImages ??
        partialSalon.importedInstagramImages ??
        realImages.filter((image) => image.source === "instagram"),
      instagramImportStatus:
        partialSalon.sourceProfile?.instagramImportStatus ??
        partialSalon.instagramImportStatus ??
        partialSalon.imagesSourceStatus ??
        "not_connected",
      googleReviewsImportStatus:
        partialSalon.sourceProfile?.googleReviewsImportStatus ??
        partialSalon.googleReviewsImportStatus ??
        partialSalon.reviewsSourceStatus ??
        "not_connected",
      lastImportAt:
        partialSalon.sourceProfile?.lastImportAt ?? partialSalon.lastImportAt,
      importErrors:
        partialSalon.sourceProfile?.importErrors ?? partialSalon.importErrors ?? [],
    },
    extractedInsights: partialSalon.extractedInsights ?? [],
    suggestedServices: partialSalon.suggestedServices ?? [],
    suggestedImages: partialSalon.suggestedImages ?? [],
    importedInstagramImages:
      partialSalon.importedInstagramImages ??
      realImages.filter((image) => image.source === "instagram"),
    instagramImportStatus:
      partialSalon.instagramImportStatus ??
      partialSalon.sourceProfile?.instagramImportStatus ??
      partialSalon.imagesSourceStatus ??
      "not_connected",
    googleReviewsImportStatus:
      partialSalon.googleReviewsImportStatus ??
      partialSalon.sourceProfile?.googleReviewsImportStatus ??
      partialSalon.reviewsSourceStatus ??
      "not_connected",
    lastImportAt: partialSalon.lastImportAt ?? partialSalon.sourceProfile?.lastImportAt,
    importErrors:
      partialSalon.importErrors ?? partialSalon.sourceProfile?.importErrors ?? [],
    suggestedCopy: partialSalon.suggestedCopy ?? {},
    copySuggestions,
    generatedCopy,
    copyHistory,
    aiBrief: partialSalon.aiBrief,
    promptMetadata: partialSalon.promptMetadata,
    manualAssistantNotes,
    eyebrow: clean(partialSalon.eyebrow) || location || visualStyle,
    tagline: subheadline,
    summary: aboutText,
    stats: partialSalon.stats?.length
      ? partialSalon.stats
      : [
          { value: location, label: "location" },
          {
            value: landingLanguageLabels[language] ?? landingCopy.languageLabel,
            label: "landing language",
          },
          { value: visualStyle, label: "visual direction" },
        ],
    ctaTitle: ctaPrimary,
    ctaText: clean(appliedCopy?.ctaText) || clean(partialSalon.ctaText),
  };
}

function dataToPartialSalon(data: SalonFormInput): Partial<Salon> {
  const location =
    clean(data.location) || formatLocation(data.city, data.country) || "";
  const landingCopy = getLandingCopy(data.language);
  const commercialStatus =
    data.commercialStatus !== undefined
      ? normalizeCommercialStatus(data.commercialStatus)
      : undefined;

  return {
    name: data.name,
    location,
    city: data.city,
    country: data.country,
    language: data.language,
    landingLanguage: data.language,
    ...(commercialStatus !== undefined ? { commercialStatus } : {}),
    positioningLine: data.positioningLine,
    description: data.description,
    visualStyle: data.visualStyle,
    brandTone: data.brandTone,
    instagramUrl: data.instagramUrl,
    googleMapsUrl: data.googleMapsUrl,
    googleBusinessUrl: data.googleMapsUrl,
    websiteUrl: data.websiteUrl,
    bookingUrl: data.bookingUrl,
    whatsapp: data.whatsapp,
    phone: data.phone,
    selectedServices: data.selectedServices,
    services: selectedServicesToSalonServices(data.selectedServices, data.language),
    galleryImages: data.galleryImages,
    testimonials: data.testimonials,
    businessHours: data.businessHours,
    address: data.address,
    extractedBusinessInfo: data.extractedBusinessInfo,
    sourceMaterials: data.sourceMaterials,
    imageCandidates: data.imageCandidates,
    imageSelectionSummary: data.imageSelectionSummary,
    layoutImagePlan: data.layoutImagePlan,
    manualAssistantNotes: data.manualAssistantNotes,
    notes: data.notes,
    copySuggestions: data.copySuggestions,
    generatedCopy: data.generatedCopy,
    copyHistory: data.copyHistory,
    lastGeneratedAt: data.lastGeneratedAt,
    lastAppliedAt: data.lastAppliedAt,
    sourceMode: "manual" satisfies SalonSourceMode,
    generationStatus: "needs_review",
    status: normalizeSalonStatus(data.status),
    headline: data.generatedCopy?.headline ?? data.name,
    subheadline: data.generatedCopy?.subheadline ?? data.positioningLine,
    aboutText: data.generatedCopy?.aboutText ?? data.description,
    ctaPrimary: data.generatedCopy?.ctaTitle ?? landingCopy.requestBooking,
    ctaSecondary: data.generatedCopy?.ctaButtonLabel ?? landingCopy.exploreServices,
    dataConfidence: "low",
    imagesSourceStatus: data.galleryImages
      ? data.galleryImages.some((image) => image.isReal)
        ? "imported"
        : "placeholder"
      : undefined,
    reviewsSourceStatus: data.testimonials
      ? data.testimonials.some((review) => review.isReal)
        ? "imported"
        : "placeholder"
      : undefined,
    hasRealImages: data.galleryImages?.some((image) => image.isReal),
    hasRealReviews: data.testimonials?.some((review) => review.isReal),
    generatedCopyStatus:
      data.generatedCopy?.status === "applied"
        ? "reviewed"
        : data.copySuggestions
          ? "generated"
          : "not_started",
  };
}

export function selectedServicesToSalonServices(
  selectedServices: string[] | undefined,
  language: SalonLanguage = "en",
): SalonService[] {
  const normalizedSelectedServices = selectedServices ?? [];
  const services = normalizedSelectedServices.length
    ? normalizedSelectedServices
    : [getFallbackServiceTitle(language)];

  return services.map((service) => ({
    id: normalizeSlug(service),
    title: service,
    description: getServiceDescription(service, language),
    price: getServicePriceLabel(language),
    category: inferServiceCategory(service),
    featured: true,
  }));
}

function normalizeServices(
  services: SalonService[] | undefined,
  selectedServices: string[],
  language: SalonLanguage,
) {
  if (services?.length) {
    return services.map((service) => ({
      ...service,
      id: service.id || normalizeSlug(service.title),
      description:
        service.description ||
        getServiceDescription(service.title, language),
      category: service.category || inferServiceCategory(service.title),
      featured: service.featured ?? selectedServices.includes(service.title),
    }));
  }

  return selectedServicesToSalonServices(selectedServices, language);
}

function normalizeSelectedServices(
  selectedServices?: string[],
  services?: SalonService[],
) {
  if (selectedServices?.length) {
    return selectedServices;
  }

  if (services?.length) {
    return services.map((service) => service.title);
  }

  return [];
}

function getFallbackServiceTitle(language: SalonLanguage) {
  const fallbackTitles: Record<SalonLanguage, string> = {
    "pt-BR": "Atendimento de beleza",
    en: "Beauty appointment",
    es: "Servicio de belleza",
    fr: "Service beautÃ©",
    no: "SkjÃ¸nnhetsbehandling",
  };

  return fallbackTitles[language] ?? fallbackTitles.en;
}

function normalizeGalleryImages(
  images: SalonGalleryImage[] | undefined,
  salonName: string,
) {
  const normalizedImages = images?.length ? images : defaultGalleryImages;
  let hasHeroImage = false;

  return normalizedImages.map((image, index) => {
    const fallback = defaultGalleryImages[index % defaultGalleryImages.length];
    const source = image.source ?? "placeholder";
    const src = image.src || image.url || fallback.src;
    const isReal =
      image.isReal ??
      (source === "instagram" ||
        source === "google" ||
        source === "website" ||
        source === "manual" ||
        source === "print" ||
        source === "url");
    const type =
      image.type === "hero" && hasHeroImage ? "gallery" : image.type ?? fallback.type ?? "gallery";

    if (type === "hero") {
      hasHeroImage = true;
    }

    return {
      id: image.id || `image-${index + 1}`,
      url: image.url || src,
      src,
      alt: image.alt || `${salonName} - imagem ${index + 1}`,
      title: image.title,
      type,
      source,
      sourceUrl: image.sourceUrl,
      originalPostUrl: image.originalPostUrl,
      isReal,
      selectedForLanding: image.selectedForLanding ?? true,
      createdAt: image.createdAt,
    };
  });
}

function normalizeTestimonials(
  testimonials: SalonTestimonial[] | undefined,
) {
  const normalizedTestimonials: Partial<SalonTestimonial>[] = testimonials?.length
    ? testimonials
    : buildTestimonials();

  return normalizedTestimonials.map((testimonial, index) => {
    const source = testimonial.source ?? "placeholder";
    const text = testimonial.text || testimonial.quote || "";
    const authorName =
      testimonial.authorName || testimonial.name || `Cliente ${index + 1}`;

    return {
      id: testimonial.id || `review-${index + 1}`,
      authorName,
      rating: testimonial.rating,
      text,
      source,
      sourceUrl: testimonial.sourceUrl,
      reviewDate: testimonial.reviewDate,
      isReal:
        testimonial.isReal ?? (source === "google" || source === "manual"),
      selectedForLanding: testimonial.selectedForLanding ?? true,
      quote: testimonial.quote || text,
      name: testimonial.name || authorName,
      role: testimonial.role || (source === "google" ? "Google" : "Exemplo"),
    };
  });
}

function normalizeSourceMaterials(materials?: SalonSourceMaterial[]) {
  if (!materials?.length) {
    return [];
  }

  return materials
    .filter((material) => material.title || material.notes || material.sourceUrl)
    .map((material, index) => ({
      ...material,
      id: material.id || `material-${index + 1}`,
      createdAt: material.createdAt || new Date().toISOString(),
    }));
}

function normalizeImageCandidates(candidates?: SalonImageCandidate[]) {
  if (!candidates?.length) {
    return [];
  }

  return candidates
    .filter((candidate) => candidate.imageUrl)
    .map((candidate, index) => ({
      ...candidate,
      id: candidate.id || `candidate-${index + 1}`,
      imageUrl: candidate.imageUrl,
      collectorOrigin: candidate.collectorOrigin ?? "unknown",
      collectorContext: clean(candidate.collectorContext),
      title: clean(candidate.title),
      alt: clean(candidate.alt),
      score: Number.isFinite(candidate.score) ? candidate.score : 0,
      confidence: candidate.confidence ?? "unknown",
      suggestedUse: simplifyImageDestination(
        candidate.suggestedUse ?? candidate.detectedType ?? "gallery",
      ),
      detectedType: candidate.detectedType ?? candidate.suggestedUse ?? "gallery",
      status: candidate.status ?? "new",
      reasons: Array.isArray(candidate.reasons)
        ? candidate.reasons.filter(Boolean)
        : [],
      warnings: Array.isArray(candidate.warnings)
        ? candidate.warnings.filter(Boolean)
        : [],
      shouldUse: Boolean(candidate.shouldUse),
      shouldReject: Boolean(candidate.shouldReject),
      collectedAt: candidate.collectedAt || new Date().toISOString(),
    }))
    .sort((first, second) => second.score - first.score);
}

function normalizeLayoutImagePlan(
  plan?: SalonLayoutImagePlan,
  availableImageIds?: string[],
) {
  return normalizeSalonLayoutImagePlan(plan, { availableImageIds });
}


function simplifyImageDestination(value: SalonImageSuggestedUse): SalonImageSuggestedUse {
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

function normalizeImageSelectionSummary(
  selection?: SalonImageSelectionSummary,
) {
  if (!selection) {
    return undefined;
  }

  return {
    logoId: clean(selection.logoId) || undefined,
    heroId: clean(selection.heroId) || undefined,
    interiorIds: selection.interiorIds ?? [],
    resultIds: selection.resultIds ?? [],
    galleryIds: selection.galleryIds ?? [],
    ignoredIds: selection.ignoredIds ?? [],
    selectedAt: selection.selectedAt,
    appliedAt: selection.appliedAt,
  };
}

function normalizeCopySuggestion(
  copySuggestion?: SalonCopySuggestion,
): SalonCopySuggestion | undefined {
  if (!copySuggestion) {
    return undefined;
  }

  return {
    ...copySuggestion,
    id: clean(copySuggestion.id) || `copy-${Date.now().toString(36)}`,
    headline: clean(copySuggestion.headline),
    subheadline: clean(copySuggestion.subheadline),
    aboutTitle: clean(copySuggestion.aboutTitle),
    aboutText: clean(copySuggestion.aboutText),
    servicesIntroTitle: clean(copySuggestion.servicesIntroTitle),
    servicesIntroText: clean(copySuggestion.servicesIntroText),
    serviceDescriptions: copySuggestion.serviceDescriptions ?? [],
    whyChooseTitle: clean(copySuggestion.whyChooseTitle),
    whyChooseItems: copySuggestion.whyChooseItems ?? [],
    ctaTitle: clean(copySuggestion.ctaTitle),
    ctaText: clean(copySuggestion.ctaText),
    ctaButtonLabel: clean(copySuggestion.ctaButtonLabel),
    seoTitle: clean(copySuggestion.seoTitle),
    seoDescription: clean(copySuggestion.seoDescription),
    prospectingMessage: clean(copySuggestion.prospectingMessage),
    businessSummary: clean(copySuggestion.businessSummary),
    generatedAt: copySuggestion.generatedAt || new Date().toISOString(),
    language: copySuggestion.language ?? "en",
    source: copySuggestion.source ?? "assisted",
    status: copySuggestion.status ?? "draft",
  };
}

function normalizeCopyHistory(copyHistory?: SalonCopySuggestion[]) {
  if (!copyHistory?.length) {
    return [];
  }

  return copyHistory
    .map((copySuggestion) => normalizeCopySuggestion(copySuggestion))
    .filter((copySuggestion): copySuggestion is SalonCopySuggestion =>
      Boolean(copySuggestion),
    )
    .slice(0, 8);
}

function getServiceDescription(service: string, language: SalonLanguage) {
  const copyByLanguage: Record<SalonLanguage, string> = {
    "pt-BR":
      "Atendimento personalizado, planejado de acordo com perfil, objetivo, rotina e preferencia de agendamento da cliente.",
    en:
      "A tailored appointment shaped around the client profile, beauty goals, and preferred booking window.",
    es:
      "Una cita personalizada segÃºn el perfil, los objetivos de belleza, la rutina y el horario preferido de la clienta.",
    fr:
      "Un rendez-vous personnalisÃ© selon le profil, les objectifs beautÃ©, le rythme et le crÃ©neau prÃ©fÃ©rÃ© de la cliente.",
    no:
      "En personlig avtale tilpasset kundens profil, mÃ¥l, rutine og Ã¸nsket bookingtid.",
  };

  if (language === "en" && serviceDescriptions[service]) {
    return serviceDescriptions[service];
  }

  return copyByLanguage[language] ?? copyByLanguage.en;
}

function getServicePriceLabel(language: SalonLanguage) {
  const priceLabels: Record<SalonLanguage, string> = {
    "pt-BR": "sob consulta",
    en: "on request",
    es: "bajo consulta",
    fr: "sur demande",
    no: "pÃ¥ forespÃ¸rsel",
  };

  return priceLabels[language] ?? priceLabels.en;
}

function slugExists(slug: string) {
  if (!isBrowser()) {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(getSalonStorageKey(slug)) !== null ||
      getSalonIndex().some((item) => item.slug === slug)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao verificar slug.";

    debugSalonStorage("slug-check-failed", { slug, message });

    return false;
  }
}

function notifySalonStorageChanged(key: string, salon: Salon | null) {
  window.dispatchEvent(
    new CustomEvent(STORAGE_CHANGED_EVENT, {
      detail: {
        key,
        slug: salon?.slug,
        name: salon?.name,
      },
    }),
  );
}

function isSalonIndexItem(item: unknown): item is SalonIndexItem {
  if (!item || typeof item !== "object") {
    return false;
  }

  const candidate = item as SalonIndexItem;

  return (
    typeof candidate.slug === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.updatedAt === "string"
  );
}

function getString(formData: FormData, key: string, fallback: string) {
  return clean(formData.get(key)) || fallback;
}

function getOptionalString(formData: FormData, key: string) {
  if (!formData.has(key)) {
    return undefined;
  }

  return clean(formData.get(key));
}

function getLanguage(formData: FormData): SalonLanguage {
  const language = String(
    formData.get("language") ?? formData.get("landingLanguage") ?? "en",
  );

  if (
    language === "pt-BR" ||
    language === "en" ||
    language === "es" ||
    language === "fr" ||
    language === "no"
  ) {
    return language;
  }

  return "en";
}

function getStatus(formData: FormData): SalonStatus {
  const status = String(formData.get("status") ?? "draft").trim();

  if (status === "draft" || status === "preview" || status === "published") {
    return status;
  }

  return "draft";
}

function normalizeSalonStatus(status: string | null | undefined): SalonStatus {
  const normalizedStatus = status?.trim();

  if (
    normalizedStatus === "draft" ||
    normalizedStatus === "preview" ||
    normalizedStatus === "published"
  ) {
    return normalizedStatus;
  }

  return "draft";
}

function getCommercialStatus(
  formData: FormData,
): SalonCommercialStatus | undefined {
  if (!formData.has("commercialStatus")) {
    return undefined;
  }

  return normalizeCommercialStatus(formData.get("commercialStatus")?.toString());
}

function formatLocation(city?: string, country?: string) {
  return [clean(city), clean(country)].filter(Boolean).join(", ");
}

function inferCity(location: string) {
  return location.split(",")[0]?.trim() || "";
}

function inferCountry(location: string) {
  return location.split(",").slice(1).join(",").trim();
}

function inferServiceCategory(service: string) {
  const normalized = service.toLowerCase();

  if (normalized.includes("pele") || normalized.includes("facial")) {
    return "Skin";
  }

  if (normalized.includes("noiva") || normalized.includes("evento")) {
    return "Events";
  }

  if (normalized.includes("unha")) {
    return "Nails";
  }

  if (normalized.includes("maquiagem")) {
    return "Makeup";
  }

  return "Hair";
}

function buildTestimonials() {
  return [];
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeOptionalInteger(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : undefined;
}

function extractGoogleRating(value: unknown) {
  const text = clean(value);

  if (!text) {
    return undefined;
  }

  const match = text.match(/nota do google:\s*([0-9]+(?:[.,][0-9]+)?)/i);

  if (!match) {
    return undefined;
  }

  const rating = Number(match[1].replace(",", "."));

  return Number.isFinite(rating) ? rating : undefined;
}

function extractGoogleReviewCount(value: unknown) {
  const text = clean(value);

  if (!text) {
    return undefined;
  }

  const match = text.match(/quantidade de avalia[cç][õo]es:\s*([0-9][0-9.,]*)/i);

  if (!match) {
    return undefined;
  }

  const count = Number(match[1].replace(/[^\d]/g, ""));

  return Number.isFinite(count) ? count : undefined;
}

function removeUndefinedValues(value: Partial<Salon>) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as Partial<Salon>;
}

function hasOwnKey(value: object, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function cleanBusinessInfoField(
  value: Partial<SalonExtractedBusinessInfo> | undefined,
  key: keyof SalonExtractedBusinessInfo,
) {
  if (!value || !hasOwnKey(value, key)) {
    return undefined;
  }

  return clean(value[key]);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `salon-${Date.now().toString(36)}`;
}

function isBrowser() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function debugSalonStorage(event: string, payload: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.debug(`[salon-lg] ${event} ${JSON.stringify(payload)}`);
}
