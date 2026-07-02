import { createSalonDefaults, normalizeSlug } from "@/lib/salon-storage";
import type {
  Salon,
  SalonExtractedBusinessInfo,
  SalonFormInput,
  SalonGalleryImage,
  SalonLanguage,
  SalonReviewSource,
  SalonStatus,
  SalonTestimonial,
} from "@/types/salon";

type ImportFieldKey =
  | "query"
  | "name"
  | "category"
  | "phone"
  | "address"
  | "city"
  | "county"
  | "state"
  | "rating"
  | "reviews"
  | "photo"
  | "logo"
  | "reservation_links"
  | "booking_appointment_link"
  | "description"
  | "posts"
  | "location_link"
  | "instagram_url"
  | "instagram_verified"
  | "instagram_notes"
  | "website_url"
  | "booking_url"
  | "opening_hours"
  | "main_services"
  | "short_description"
  | "data_quality_notes";

export type OutscraperRawRow = Record<string, string>;

export type OutscraperDetectedColumn = {
  header: string;
  normalizedHeader: string;
  recognized: boolean;
  field?: ImportFieldKey | `review_${1 | 2 | 3 | 4 | 5}_${"author" | "text" | "rating"}`;
};

export type OutscraperMappedSalon = {
  name: string;
  category: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  county: string;
  state: string;
  location: string;
  rating: string;
  reviewsCount: string;
  description: string;
  shortDescription: string;
  instagramUrl: string;
  websiteUrl: string;
  googleMapsUrl: string;
  bookingUrl: string;
  bookingAppointmentUrl: string;
  reservationLinks: string;
  openingHours: string;
  mainServices: string;
  query: string;
  instagramVerified: string;
  instagramNotes: string;
  dataQualityNotes: string;
  photoUrl: string;
  logoUrl: string;
  selectedServices: string[];
  galleryImages: SalonGalleryImage[];
  testimonials: SalonTestimonial[];
  notes: string;
  manualAssistantNotes: string;
  sourceSummary: string;
  extractedBusinessInfo: SalonExtractedBusinessInfo;
  hasInstagram: boolean;
  hasPhoto: boolean;
  hasLogo: boolean;
  hasBookingUrl: boolean;
  hasOpeningHours: boolean;
  hasMainServices: boolean;
  hasReviews: boolean;
};

export type OutscraperImportPreviewRow = {
  id: string;
  rowNumber: number;
  raw: OutscraperRawRow;
  mapped: OutscraperMappedSalon;
  valid: boolean;
  importable: boolean;
  invalidReasons: string[];
  duplicateReasons: string[];
  duplicateKeys: string[];
  hasInstagram: boolean;
  hasPhoto: boolean;
  hasLogo: boolean;
  hasBookingUrl: boolean;
  hasOpeningHours: boolean;
  hasMainServices: boolean;
  hasReviews: boolean;
  defaultSelected: boolean;
  predictedSlug: string;
};

export type OutscraperImportStats = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importableRows: number;
  withoutInstagram: number;
  duplicateRows: number;
  withPhoto: number;
  withLogo: number;
  withBookingUrl: number;
  withOpeningHours: number;
  withMainServices: number;
  withReviews: number;
};

export type OutscraperImportReport = {
  totalRows: number;
  created: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  withInstagram: number;
  withoutInstagram: number;
  withPhoto: number;
  withLogo: number;
  withBookingUrl: number;
  withOpeningHours: number;
  withMainServices: number;
  withReviews: number;
  createdSlugs: string[];
  instagramImages?: OutscraperInstagramImageImportReport;
};

export type OutscraperInstagramImageImportItem = {
  name: string;
  slug: string;
  instagramUrl: string;
  status: "skipped" | "success" | "failed";
  candidatesFound: number;
  imagesSaved: number;
  heroSelected: boolean;
  galleryCount: number;
  experienceCount: number;
  resultCount: number;
  error?: string;
  errorType?: string;
};

export type OutscraperInstagramImageImportReport = {
  enabled: boolean;
  salonsWithInstagram: number;
  attempted: number;
  withImages: number;
  failed: number;
  totalCandidatesFound: number;
  totalImagesSaved: number;
  averageImagesPerSalon: number;
  items: OutscraperInstagramImageImportItem[];
};

const FIELD_ALIASES: Record<ImportFieldKey, string[]> = {
  query: ["query"],
  name: ["name"],
  category: ["category"],
  phone: ["phone", "telephone", "tel"],
  address: ["address"],
  city: ["city"],
  county: ["county"],
  state: ["state", "country"],
  rating: ["rating"],
  reviews: ["reviews", "review_count"],
  photo: ["photo", "image", "cover_photo"],
  logo: ["logo"],
  reservation_links: ["reservation_links", "reservation_links_"],
  booking_appointment_link: [
    "booking_appointment_link",
    "booking_appointment_url",
  ],
  description: ["description"],
  posts: ["posts"],
  location_link: ["location_link", "google_maps_url", "google_link"],
  instagram_url: ["instagram_url", "instagram", "instagram_link"],
  instagram_verified: ["instagram_verified"],
  instagram_notes: ["instagram_notes"],
  website_url: ["website_url", "website", "site"],
  booking_url: ["booking_url", "booking"],
  opening_hours: ["opening_hours", "hours"],
  main_services: ["main_services", "services"],
  short_description: ["short_description", "summary"],
  data_quality_notes: ["data_quality_notes", "quality_notes"],
};

export function detectOutscraperColumns(headers: string[]) {
  return headers.map((header) => {
    const normalizedHeader = normalizeHeader(header);
    const field = matchField(normalizedHeader);

    return {
      header,
      normalizedHeader,
      recognized: Boolean(field),
      field: field ?? undefined,
    } satisfies OutscraperDetectedColumn;
  });
}

export function buildOutscraperPreview(
  rows: OutscraperRawRow[],
  existingSalons: Salon[],
) {
  const existingLocationLinks = new Set<string>();
  const existingInstagramUrls = new Set<string>();
  const existingNameCity = new Set<string>();

  for (const salon of existingSalons) {
    const locationLinkKey = normalizeExternalUrl(salon.googleMapsUrl);
    const instagramKey = normalizeExternalUrl(salon.instagramUrl);
    const nameCityKey = buildNameCityKey(salon.name, salon.city || salon.location);

    if (locationLinkKey) {
      existingLocationLinks.add(locationLinkKey);
    }

    if (instagramKey) {
      existingInstagramUrls.add(instagramKey);
    }

    if (nameCityKey) {
      existingNameCity.add(nameCityKey);
    }
  }

  const keyOccurrences = {
    location: new Map<string, number>(),
    instagram: new Map<string, number>(),
    nameCity: new Map<string, number>(),
  };

  const mappedRows = rows.map((raw, index) => {
    const mapped = mapOutscraperRow(raw);
    const duplicateCandidateKeys = {
      location: normalizeExternalUrl(mapped.googleMapsUrl),
      instagram: normalizeExternalUrl(mapped.instagramUrl),
      nameCity: buildNameCityKey(mapped.name, mapped.city || mapped.location),
    };

    incrementOccurrence(keyOccurrences.location, duplicateCandidateKeys.location);
    incrementOccurrence(keyOccurrences.instagram, duplicateCandidateKeys.instagram);
    incrementOccurrence(keyOccurrences.nameCity, duplicateCandidateKeys.nameCity);

    return {
      id: `import-row-${index + 1}`,
      rowNumber: index + 2,
      raw,
      mapped,
      duplicateCandidateKeys,
    };
  });

  const previewRows: OutscraperImportPreviewRow[] = mappedRows.map((row) => {
    const invalidReasons: string[] = [];
    const duplicateReasons: string[] = [];
    const duplicateKeys: string[] = [];

    if (!row.mapped.name) {
      invalidReasons.push("Nome do salão ausente.");
    }

    if (
      row.duplicateCandidateKeys.location &&
      (existingLocationLinks.has(row.duplicateCandidateKeys.location) ||
        (keyOccurrences.location.get(row.duplicateCandidateKeys.location) ?? 0) > 1)
    ) {
      duplicateReasons.push("Possível duplicado por location_link.");
      duplicateKeys.push("location_link");
    }

    if (
      row.duplicateCandidateKeys.instagram &&
      (existingInstagramUrls.has(row.duplicateCandidateKeys.instagram) ||
        (keyOccurrences.instagram.get(row.duplicateCandidateKeys.instagram) ?? 0) > 1)
    ) {
      duplicateReasons.push("Possível duplicado por Instagram_url.");
      duplicateKeys.push("Instagram_url");
    }

    if (
      row.duplicateCandidateKeys.nameCity &&
      (existingNameCity.has(row.duplicateCandidateKeys.nameCity) ||
        (keyOccurrences.nameCity.get(row.duplicateCandidateKeys.nameCity) ?? 0) > 1)
    ) {
      duplicateReasons.push("Possível duplicado por nome + cidade.");
      duplicateKeys.push("name_city");
    }

    const valid = invalidReasons.length === 0;
    const importable = valid && duplicateReasons.length === 0;
    const predictedSlug = normalizeSlug(row.mapped.name || `linha-${row.rowNumber}`);

    return {
      id: row.id,
      rowNumber: row.rowNumber,
      raw: row.raw,
      mapped: row.mapped,
      valid,
      importable,
      invalidReasons,
      duplicateReasons,
      duplicateKeys,
      hasInstagram: row.mapped.hasInstagram,
      hasPhoto: row.mapped.hasPhoto,
      hasLogo: row.mapped.hasLogo,
      hasBookingUrl: row.mapped.hasBookingUrl,
      hasOpeningHours: row.mapped.hasOpeningHours,
      hasMainServices: row.mapped.hasMainServices,
      hasReviews: row.mapped.hasReviews,
      defaultSelected: importable,
      predictedSlug,
    };
  });

  const stats: OutscraperImportStats = {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.valid).length,
    invalidRows: previewRows.filter((row) => !row.valid).length,
    importableRows: previewRows.filter((row) => row.importable).length,
    withoutInstagram: previewRows.filter((row) => !row.hasInstagram).length,
    duplicateRows: previewRows.filter((row) => row.duplicateReasons.length > 0).length,
    withPhoto: previewRows.filter((row) => row.hasPhoto).length,
    withLogo: previewRows.filter((row) => row.hasLogo).length,
    withBookingUrl: previewRows.filter((row) => row.hasBookingUrl).length,
    withOpeningHours: previewRows.filter((row) => row.hasOpeningHours).length,
    withMainServices: previewRows.filter((row) => row.hasMainServices).length,
    withReviews: previewRows.filter((row) => row.hasReviews).length,
  };

  return {
    previewRows,
    stats,
  };
}

export function buildSalonForOutscraperImport(
  mapped: OutscraperMappedSalon,
  slug: string,
  language: SalonLanguage,
  status: SalonStatus = "draft",
) {
  const now = new Date().toISOString();

  return createSalonDefaults({
    id: createId(),
    slug,
    name: mapped.name,
    location: mapped.location,
    city: mapped.city,
    country: mapped.state,
    language,
    landingLanguage: language,
    status,
    sourceMode: "imported",
    generationStatus: "needs_review",
    dataConfidence:
      mapped.hasInstagram || mapped.hasPhoto || mapped.hasReviews ? "medium" : "low",
    imagesSourceStatus: mapped.galleryImages.length ? "imported" : "placeholder",
    reviewsSourceStatus: mapped.testimonials.length ? "imported" : "placeholder",
    positioningLine: mapped.shortDescription,
    description: mapped.description || mapped.shortDescription,
    instagramUrl: mapped.instagramUrl,
    googleMapsUrl: mapped.googleMapsUrl,
    googleBusinessUrl: mapped.googleMapsUrl,
    websiteUrl: mapped.websiteUrl,
    bookingUrl:
      mapped.bookingUrl || mapped.bookingAppointmentUrl || firstUrl(mapped.reservationLinks),
    phone: mapped.phone,
    whatsapp: mapped.whatsapp,
    selectedServices: mapped.selectedServices,
    galleryImages: mapped.galleryImages,
    testimonials: mapped.testimonials,
    businessHours: mapped.openingHours,
    address: mapped.address,
    extractedBusinessInfo: mapped.extractedBusinessInfo,
    notes: mapped.notes,
    manualAssistantNotes: mapped.manualAssistantNotes,
    sourceSummary: mapped.sourceSummary,
    createdAt: now,
    updatedAt: now,
  });
}

export function mapOutscraperRowToFormInput(
  mapped: OutscraperMappedSalon,
  language: SalonLanguage,
): SalonFormInput {
  return {
    name: mapped.name,
    location: mapped.location,
    city: mapped.city,
    country: mapped.state,
    status: "draft",
    language,
    positioningLine: mapped.shortDescription,
    description: mapped.description || mapped.shortDescription,
    visualStyle: "Luxo suave",
    brandTone: "Premium e acolhedor",
    instagramUrl: mapped.instagramUrl || undefined,
    googleMapsUrl: mapped.googleMapsUrl || undefined,
    websiteUrl: mapped.websiteUrl || undefined,
    bookingUrl:
      mapped.bookingUrl ||
      mapped.bookingAppointmentUrl ||
      firstUrl(mapped.reservationLinks) ||
      undefined,
    whatsapp: mapped.whatsapp || undefined,
    phone: mapped.phone || undefined,
    selectedServices: mapped.selectedServices,
    galleryImages: mapped.galleryImages,
    testimonials: mapped.testimonials,
    businessHours: mapped.openingHours || undefined,
    address: mapped.address || undefined,
    extractedBusinessInfo: mapped.extractedBusinessInfo,
    manualAssistantNotes: mapped.manualAssistantNotes || undefined,
    notes: mapped.notes || undefined,
  };
}

export function buildImportReport(
  allRows: OutscraperImportPreviewRow[],
  createdRows: OutscraperImportPreviewRow[],
  createdSlugs: string[],
  skippedDuplicates: number,
  skippedInvalid: number,
  instagramImages?: OutscraperInstagramImageImportReport,
): OutscraperImportReport {
  return {
    totalRows: allRows.length,
    created: createdRows.length,
    skippedDuplicates,
    skippedInvalid,
    withInstagram: allRows.filter((row) => row.hasInstagram).length,
    withoutInstagram: allRows.filter((row) => !row.hasInstagram).length,
    withPhoto: allRows.filter((row) => row.hasPhoto).length,
    withLogo: allRows.filter((row) => row.hasLogo).length,
    withBookingUrl: allRows.filter((row) => row.hasBookingUrl).length,
    withOpeningHours: allRows.filter((row) => row.hasOpeningHours).length,
    withMainServices: allRows.filter((row) => row.hasMainServices).length,
    withReviews: allRows.filter((row) => row.hasReviews).length,
    createdSlugs,
    instagramImages,
  };
}

export function makeUniqueSlug(baseName: string, takenSlugs: Set<string>) {
  const baseSlug = normalizeSlug(baseName || "novo-salao");
  let slug = baseSlug;
  let suffix = 2;

  while (takenSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  takenSlugs.add(slug);
  return slug;
}

function mapOutscraperRow(raw: OutscraperRawRow): OutscraperMappedSalon {
  const name = getField(raw, "name");
  const category = getField(raw, "category");
  const phone = getField(raw, "phone");
  const address = getField(raw, "address");
  const city = getField(raw, "city");
  const county = getField(raw, "county");
  const state = getField(raw, "state");
  const rating = getField(raw, "rating");
  const reviewsCount = getField(raw, "reviews");
  const photoUrl = getField(raw, "photo");
  const logoUrl = getField(raw, "logo");
  const reservationLinks = getField(raw, "reservation_links");
  const bookingAppointmentUrl = getField(raw, "booking_appointment_link");
  const bookingUrl = getField(raw, "booking_url");
  const description = getField(raw, "description");
  const query = getField(raw, "query");
  const locationLink = getField(raw, "location_link");
  const instagramUrl = getField(raw, "instagram_url");
  const instagramVerified = getField(raw, "instagram_verified");
  const instagramNotes = getField(raw, "instagram_notes");
  const websiteUrl = getField(raw, "website_url");
  const openingHours = getField(raw, "opening_hours");
  const mainServices = getField(raw, "main_services");
  const shortDescription = getField(raw, "short_description");
  const dataQualityNotes = getField(raw, "data_quality_notes");
  const whatsapp = phone;
  const selectedServices = parseServices(mainServices);
  const galleryImages = buildImportedImages(photoUrl, logoUrl, locationLink, websiteUrl);
  const testimonials = buildImportedReviews(raw);

  const location = [city, county, state].filter(Boolean).join(", ") || address;
  const notes = joinLines([
    category ? `Categoria: ${category}` : "",
    rating ? `Nota do Google: ${rating}` : "",
    reviewsCount ? `Quantidade de avaliações: ${reviewsCount}` : "",
    county ? `Região/County: ${county}` : "",
    state ? `Estado/País: ${state}` : "",
    reservationLinks ? `Links extras de reserva: ${reservationLinks}` : "",
    instagramVerified ? `Instagram verificado: ${instagramVerified}` : "",
    dataQualityNotes ? `Notas de qualidade: ${dataQualityNotes}` : "",
  ]);
  const manualAssistantNotes = joinLines([
    "Importado do Outscraper.",
    query ? `Query de origem: ${query}` : "",
    instagramNotes ? `Notas do Instagram: ${instagramNotes}` : "",
    reservationLinks ? `Links extras de reserva: ${reservationLinks}` : "",
    dataQualityNotes ? `Notas de qualidade dos dados: ${dataQualityNotes}` : "",
  ]);
  const sourceSummary = joinLines([
    "Importado de planilha do Outscraper.",
    query ? `Busca: ${query}` : "",
    category ? `Categoria: ${category}` : "",
  ]);

  return {
    name,
    category,
    phone,
    whatsapp,
    address,
    city,
    county,
    state,
    location,
    rating,
    reviewsCount,
    description,
    shortDescription,
    instagramUrl,
    websiteUrl,
    googleMapsUrl: locationLink,
    bookingUrl,
    bookingAppointmentUrl,
    reservationLinks,
    openingHours,
    mainServices,
    query,
    instagramVerified,
    instagramNotes,
    dataQualityNotes,
    photoUrl,
    logoUrl,
    selectedServices,
    galleryImages,
    testimonials,
    notes,
    manualAssistantNotes,
    sourceSummary,
    extractedBusinessInfo: {
      businessHours: openingHours || undefined,
      address: address || undefined,
      observedServices: mainServices || undefined,
      differentiators: category || undefined,
      visualNotes: instagramNotes || undefined,
    },
    hasInstagram: Boolean(instagramUrl),
    hasPhoto: Boolean(photoUrl),
    hasLogo: Boolean(logoUrl),
    hasBookingUrl: Boolean(bookingUrl || bookingAppointmentUrl || firstUrl(reservationLinks)),
    hasOpeningHours: Boolean(openingHours),
    hasMainServices: Boolean(mainServices),
    hasReviews: testimonials.length > 0,
  };
}

function buildImportedReviews(raw: OutscraperRawRow) {
  const reviews: SalonTestimonial[] = [];

  for (let index = 1 as const; index <= 5; index += 1) {
    const text = getReviewField(raw, index, "text");

    if (!text) {
      continue;
    }

    const authorName = getReviewField(raw, index, "author") || `Cliente ${index}`;
    const ratingValue = Number(getReviewField(raw, index, "rating"));
    const rating = Number.isFinite(ratingValue) ? ratingValue : undefined;
    const source = "google" satisfies SalonReviewSource;

    reviews.push({
      id: `import-review-${index}-${normalizeSlug(authorName)}`,
      authorName,
      rating,
      text,
      source,
      isReal: true,
      selectedForLanding: true,
      quote: text,
      name: authorName,
      role: source === "google" ? "Google" : "Manual",
    });
  }

  return reviews;
}

function buildImportedImages(
  photoUrl: string,
  logoUrl: string,
  locationLink: string,
  websiteUrl: string,
) {
  const images: SalonGalleryImage[] = [];

  if (logoUrl) {
    images.push({
      id: `import-logo-${normalizeSlug(logoUrl).slice(0, 18)}`,
      url: logoUrl,
      src: logoUrl,
      alt: "Logo importada do cadastro",
      type: "logo",
      source: inferImageSource(logoUrl),
      sourceUrl: websiteUrl || locationLink || undefined,
      isReal: true,
      selectedForLanding: true,
      createdAt: new Date().toISOString(),
    });
  }

  if (photoUrl) {
    images.push({
      id: `import-photo-${normalizeSlug(photoUrl).slice(0, 18)}`,
      url: photoUrl,
      src: photoUrl,
      alt: "Foto inicial importada do cadastro",
      type: "hero",
      source: inferImageSource(photoUrl),
      sourceUrl: locationLink || websiteUrl || undefined,
      isReal: true,
      selectedForLanding: true,
      createdAt: new Date().toISOString(),
    });
  }

  return images;
}

function getField(raw: OutscraperRawRow, field: ImportFieldKey) {
  for (const [header, value] of Object.entries(raw)) {
    const normalizedHeader = normalizeHeader(header);

    if (FIELD_ALIASES[field].includes(normalizedHeader)) {
      return cleanValue(value);
    }
  }

  return "";
}

function getReviewField(
  raw: OutscraperRawRow,
  index: 1 | 2 | 3 | 4 | 5,
  field: "author" | "text" | "rating",
) {
  const lookup = `review_${index}_${field}`;

  for (const [header, value] of Object.entries(raw)) {
    if (normalizeHeader(header) === lookup) {
      return cleanValue(value);
    }
  }

  return "";
}

function matchField(normalizedHeader: string) {
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as Array<
    [ImportFieldKey, string[]]
  >) {
    if (aliases.includes(normalizedHeader)) {
      return field;
    }
  }

  if (/^review_[1-5]_(author|text|rating)$/.test(normalizedHeader)) {
    return normalizedHeader as OutscraperDetectedColumn["field"];
  }

  return null;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanValue(value: string) {
  return String(value ?? "").trim();
}

function parseServices(value: string) {
  if (!value.trim()) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,;|]+/g)
        .map((service) => service.trim())
        .filter(Boolean),
    ),
  );
}

function joinLines(lines: string[]) {
  return lines.filter(Boolean).join("\n");
}

function normalizeExternalUrl(value?: string) {
  const raw = cleanValue(value ?? "");

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

function buildNameCityKey(name?: string, cityOrLocation?: string) {
  const left = normalizeText(name);
  const right = normalizeText(cityOrLocation);

  if (!left || !right) {
    return "";
  }

  return `${left}::${right}`;
}

function normalizeText(value?: string) {
  return cleanValue(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function incrementOccurrence(map: Map<string, number>, key: string) {
  if (!key) {
    return;
  }

  map.set(key, (map.get(key) ?? 0) + 1);
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `import-${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`;
}

function inferImageSource(url: string): SalonGalleryImage["source"] {
  const normalized = url.toLowerCase();

  if (normalized.includes("instagram")) {
    return "instagram";
  }

  if (
    normalized.includes("google") ||
    normalized.includes("gstatic") ||
    normalized.includes("googleusercontent")
  ) {
    return "google";
  }

  if (normalized.includes("http")) {
    return "url";
  }

  return "website";
}

function firstUrl(value: string) {
  const match = value.match(/https?:\/\/[^\s,;]+/i);
  return match?.[0] ?? "";
}
