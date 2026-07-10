import type { SalonGalleryImage } from "@/types/salon";

type ImageLike =
  | string
  | (Partial<SalonGalleryImage> &
      Record<string, unknown> & {
      src?: unknown;
      url?: unknown;
      publicUrl?: unknown;
      remoteUrl?: unknown;
    });

type FilterLandingImagesOptions = {
  includeLogo?: boolean;
  requireReal?: boolean;
  requireSelected?: boolean;
};

export function getValidImageUrl(image: ImageLike | null | undefined) {
  const candidates =
    typeof image === "string"
      ? [image]
      : [image?.src, image?.url, image?.publicUrl, image?.remoteUrl];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const url = candidate.trim();

    if (isValidImageUrl(url)) {
      return url;
    }
  }

  return undefined;
}

export function isValidImageUrl(url: string | null | undefined) {
  const value = url?.trim();

  if (!value || value.includes("\u0000")) {
    return false;
  }

  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  if (/^data:image\/(?:avif|gif|jpeg|png|webp);base64,/i.test(value)) {
    return true;
  }

  try {
    const parsed = new URL(value);

    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function isRemoteImageUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function filterValidLandingImages(
  images: SalonGalleryImage[] | null | undefined,
  options: FilterLandingImagesOptions = {},
) {
  const {
    includeLogo = false,
    requireReal = true,
    requireSelected = true,
  } = options;

  return (images ?? []).flatMap((image) => {
    const validUrl = getValidImageUrl(image);

    if (
      !validUrl ||
      (requireReal && !image.isReal) ||
      (requireSelected && !image.selectedForLanding) ||
      (!includeLogo && image.type === "logo")
    ) {
      return [];
    }

    return [
      {
        ...image,
        src: validUrl,
        url: validUrl,
      },
    ];
  });
}

const loggedFilters = new Set<string>();

export function logFilteredLandingImages({
  slug,
  section,
  sourceImages,
  validImages,
}: {
  slug: string;
  section: string;
  sourceImages: SalonGalleryImage[];
  validImages: SalonGalleryImage[];
}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const validIds = new Set(validImages.map((image) => image.id));
  const filtered = sourceImages.filter((image) => !validIds.has(image.id));

  if (!filtered.length) {
    return;
  }

  const logKey = `${slug}:${section}:${filtered.map((image) => image.id).join(",")}`;

  if (loggedFilters.has(logKey)) {
    return;
  }

  loggedFilters.add(logKey);
  console.warn("[landing-images] imagens filtradas", {
    slug,
    section,
    filteredCount: filtered.length,
    validCount: validImages.length,
    images: filtered.map((image) => ({
      imageId: image.id,
      reason: getValidImageUrl(image) ? "not-selected-for-section" : "missing-or-invalid-url",
      url: getValidImageUrl(image) ?? "[ausente/invalida]",
    })),
  });
}
