import { calculateLandingReadiness } from "@/lib/copy-generator";
import { normalizeCommercialStatus } from "@/lib/salon-commercial-status";
import { filterValidLandingImages } from "@/lib/salon-images";
import { ensureCompleteSalon } from "@/lib/salon-storage";
import type {
  Salon,
  SalonCopySuggestion,
  SalonGalleryImage,
  SalonService,
  SalonSocialLinks,
  SalonSourceProfile,
  SalonTestimonial,
} from "@/types/salon";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SupabaseSalonRow = {
  id: string;
  slug: string;
  name: string;
  status: string | null;
  commercial_status: string | null;
  language: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  headline: string | null;
  subheadline: string | null;
  booking_url: string | null;
  whatsapp: string | null;
  phone: string | null;
  website_url: string | null;
  instagram_url: string | null;
  google_maps_url: string | null;
  business_hours: string | null;
  notes: string | null;
  readiness_score: number | null;
  created_at: string;
  updated_at: string;
  services: Json | null;
  real_images: Json | null;
  real_reviews: Json | null;
  copy_suggestions: Json | null;
  copy_history: Json | null;
  generated_copy: Json | null;
  source_profile: Json | null;
  social_links: Json | null;
  cta: Json | null;
  seo: Json | null;
  metadata: Json | null;
};

export type SupabaseSalonWrite = Partial<SupabaseSalonRow> & {
  slug: string;
  name: string;
};

export function mapSalonToSupabaseRow(
  salon: Salon,
  options?: { compact?: boolean },
): SupabaseSalonWrite {
  const completeSalon = ensureCompleteSalon(salon);
  const compact = options?.compact === true;
  const readiness = calculateLandingReadiness(completeSalon);
  const realImages = filterValidLandingImages(completeSalon.galleryImages, {
    includeLogo: true,
    requireSelected: false,
  });
  const realReviews = completeSalon.testimonials.filter((review) => review.isReal);
  const sourceProfile: SalonSourceProfile = {
    ...completeSalon.sourceProfile,
    instagramProfileUrl:
      completeSalon.sourceProfile?.instagramProfileUrl ??
      completeSalon.instagramProfileUrl ??
      completeSalon.instagramUrl,
    googleBusinessUrl:
      completeSalon.sourceProfile?.googleBusinessUrl ??
      completeSalon.googleBusinessUrl ??
      completeSalon.googleMapsUrl,
    importedInstagramImages:
      completeSalon.sourceProfile?.importedInstagramImages ??
      completeSalon.importedInstagramImages ??
      realImages.filter((image) => image.source === "instagram"),
    instagramImportStatus:
      completeSalon.sourceProfile?.instagramImportStatus ??
      completeSalon.instagramImportStatus ??
      completeSalon.imagesSourceStatus,
    googleReviewsImportStatus:
      completeSalon.sourceProfile?.googleReviewsImportStatus ??
      completeSalon.googleReviewsImportStatus ??
      completeSalon.reviewsSourceStatus,
    lastImportAt:
      completeSalon.sourceProfile?.lastImportAt ?? completeSalon.lastImportAt,
    importErrors:
      completeSalon.sourceProfile?.importErrors ?? completeSalon.importErrors ?? [],
  };

  return {
    ...(isUuid(completeSalon.id) ? { id: completeSalon.id } : {}),
    slug: completeSalon.slug,
    name: completeSalon.name,
    status: normalizeStatusForWrite(completeSalon.status),
    commercial_status: completeSalon.commercialStatus,
    language: completeSalon.language,
    country: emptyToNull(completeSalon.country),
    city: emptyToNull(completeSalon.city),
    address: emptyToNull(completeSalon.address),
    description: emptyToNull(completeSalon.description),
    headline: emptyToNull(completeSalon.headline),
    subheadline: emptyToNull(completeSalon.subheadline),
    booking_url: emptyToNull(completeSalon.bookingUrl),
    whatsapp: emptyToNull(completeSalon.whatsapp),
    phone: emptyToNull(completeSalon.phone),
    website_url: emptyToNull(completeSalon.websiteUrl),
    instagram_url: emptyToNull(completeSalon.instagramUrl),
    google_maps_url: emptyToNull(
      completeSalon.googleMapsUrl ?? completeSalon.googleBusinessUrl,
    ),
    business_hours: emptyToNull(completeSalon.businessHours),
    notes: emptyToNull(completeSalon.notes),
    readiness_score: readiness.score,
    created_at: completeSalon.createdAt,
    updated_at: completeSalon.updatedAt,
    services: completeSalon.services as unknown as Json,
    real_images: realImages as unknown as Json,
    real_reviews: realReviews as unknown as Json,
    copy_suggestions: (completeSalon.copySuggestions ?? null) as unknown as Json,
    copy_history: (completeSalon.copyHistory ?? []) as unknown as Json,
    generated_copy: (completeSalon.generatedCopy ?? null) as unknown as Json,
    source_profile: sourceProfile as unknown as Json,
    social_links: completeSalon.socialLinks as unknown as Json,
    cta: {
      primary: completeSalon.ctaPrimary,
      secondary: completeSalon.ctaSecondary,
      title: completeSalon.ctaTitle,
      text: completeSalon.ctaText,
      bookingUrl: completeSalon.bookingUrl,
    } as unknown as Json,
    seo: {
      title: completeSalon.generatedCopy?.seoTitle,
      description: completeSalon.generatedCopy?.seoDescription,
      promptMetadata: completeSalon.promptMetadata,
    } as unknown as Json,
    metadata: compact
      ? ({
          visualStyle: completeSalon.visualStyle,
          brandTone: completeSalon.brandTone,
          sourceMode: completeSalon.sourceMode,
          generationStatus: completeSalon.generationStatus,
          generatedCopyStatus: completeSalon.generatedCopyStatus,
          aiBrief: completeSalon.aiBrief,
          promptMetadata: completeSalon.promptMetadata as unknown as Json | undefined,
          layoutImagePlan: completeSalon.layoutImagePlan,
          imageSelectionSummary: completeSalon.imageSelectionSummary,
          manualAssistantNotes: completeSalon.manualAssistantNotes,
          googleRating: completeSalon.googleRating,
          googleReviewCount: completeSalon.googleReviewCount,
          extractedBusinessInfo: completeSalon.extractedBusinessInfo,
        } as unknown as Json)
      : ({
          salon: completeSalon as unknown as Json,
          visualStyle: completeSalon.visualStyle,
          brandTone: completeSalon.brandTone,
          sourceMode: completeSalon.sourceMode,
          generationStatus: completeSalon.generationStatus,
          generatedCopyStatus: completeSalon.generatedCopyStatus,
          aiBrief: completeSalon.aiBrief,
          promptMetadata: completeSalon.promptMetadata as unknown as Json | undefined,
          layoutImagePlan: completeSalon.layoutImagePlan,
          imageSelectionSummary: completeSalon.imageSelectionSummary,
          manualAssistantNotes: completeSalon.manualAssistantNotes,
          googleRating: completeSalon.googleRating,
          googleReviewCount: completeSalon.googleReviewCount,
          extractedBusinessInfo: completeSalon.extractedBusinessInfo,
        } as unknown as Json),
  };
}

export function mapSupabaseRowToSalon(row: SupabaseSalonRow): Salon {
  const metadata = asRecord(row.metadata);
  const metadataSalon = asRecord(metadata?.salon) as Partial<Salon> | undefined;
  const metadataFallback = metadata as Partial<Salon> | undefined;
  const sourceProfile = asRecord(row.source_profile) as SalonSourceProfile | undefined;
  const cta = asRecord(row.cta);
  const rowGalleryImages = asArray<SalonGalleryImage>(
    row.real_images,
    metadataSalon?.galleryImages,
  );
  const rowTestimonials = asArray<SalonTestimonial>(
    row.real_reviews,
    metadataSalon?.testimonials,
  );

  return ensureCompleteSalon({
    ...(metadataSalon ?? metadataFallback ?? {}),
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: normalizeStatus(row.status),
    commercialStatus: normalizeCommercialStatus(
      row.commercial_status ?? metadataSalon?.commercialStatus,
    ),
    language: normalizeLanguage(row.language),
    landingLanguage: normalizeLanguage(row.language),
    country: row.country ?? metadataSalon?.country ?? "",
    city: row.city ?? metadataSalon?.city ?? "",
    location: metadataSalon?.location ?? buildLocation(row.city, row.country),
    address: row.address ?? metadataSalon?.address ?? "",
    description: row.description ?? metadataSalon?.description ?? "",
    headline: row.headline ?? metadataSalon?.headline ?? "",
    subheadline: row.subheadline ?? metadataSalon?.subheadline ?? "",
    bookingUrl: row.booking_url ?? "",
    whatsapp: row.whatsapp ?? "",
    phone: row.phone ?? "",
    websiteUrl: row.website_url ?? "",
    instagramUrl: row.instagram_url ?? "",
    instagramProfileUrl:
      sourceProfile?.instagramProfileUrl ?? row.instagram_url ?? "",
    googleMapsUrl: row.google_maps_url ?? "",
    googleBusinessUrl:
      sourceProfile?.googleBusinessUrl ?? row.google_maps_url ?? "",
    businessHours: row.business_hours ?? metadataSalon?.businessHours ?? "",
    notes: row.notes ?? metadataSalon?.notes,
    services: asArray<SalonService>(row.services, metadataSalon?.services),
    selectedServices:
      metadataSalon?.selectedServices ??
      asArray<SalonService>(row.services).map((service) => service.title),
    galleryImages: rowGalleryImages,
    testimonials: rowTestimonials,
    copySuggestions:
      asObject<SalonCopySuggestion>(row.copy_suggestions) ??
      metadataSalon?.copySuggestions,
    copyHistory:
      asArray<SalonCopySuggestion>(row.copy_history, metadataSalon?.copyHistory),
    generatedCopy:
      asObject<SalonCopySuggestion>(row.generated_copy) ??
      metadataSalon?.generatedCopy,
    sourceProfile,
    socialLinks:
      asObject<SalonSocialLinks>(row.social_links) ?? metadataSalon?.socialLinks,
    ctaPrimary: stringFromRecord(cta, "primary") ?? metadataSalon?.ctaPrimary,
    ctaSecondary:
      stringFromRecord(cta, "secondary") ?? metadataSalon?.ctaSecondary,
    ctaTitle: stringFromRecord(cta, "title") ?? metadataSalon?.ctaTitle,
    ctaText: stringFromRecord(cta, "text") ?? metadataSalon?.ctaText,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function asArray<T>(value: unknown, fallback?: T[]) {
  return Array.isArray(value) ? (value as T[]) : fallback ?? [];
}

function asObject<T>(value: unknown) {
  return asRecord(value) as T | undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function stringFromRecord(
  record: Record<string, unknown> | undefined,
  key: string,
) {
  const value = record?.[key];

  return typeof value === "string" ? value : undefined;
}

function emptyToNull(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function buildLocation(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(", ");
}

function normalizeStatus(value: string | null): Salon["status"] {
  const normalizedValue = value?.trim();

  if (
    normalizedValue === "draft" ||
    normalizedValue === "preview" ||
    normalizedValue === "published"
  ) {
    return normalizedValue;
  }

  return "preview";
}

function normalizeStatusForWrite(value: string | null | undefined): Salon["status"] {
  const normalizedValue = value?.trim();

  if (
    normalizedValue === "draft" ||
    normalizedValue === "preview" ||
    normalizedValue === "published"
  ) {
    return normalizedValue;
  }

  return "preview";
}

function normalizeLanguage(value: string | null): Salon["language"] {
  if (
    value === "pt-BR" ||
    value === "en" ||
    value === "es" ||
    value === "fr" ||
    value === "no"
  ) {
    return value;
  }

  return "en";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
