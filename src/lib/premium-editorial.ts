import { getValidImageUrl } from "@/lib/salon-images";
import type {
  Salon,
  SalonBeforeAfterItem,
  SalonFaqItem,
  SalonGalleryImage,
  SalonPremiumEditorial,
} from "@/types/salon";

export function createDefaultPremiumEditorial(
  salon?: Partial<Salon>,
): SalonPremiumEditorial {
  const name = salon?.name?.trim() || "Your beauty studio";
  const location = salon?.location?.trim();

  return {
    accentColor: "#9b7353",
    backgroundColor: "#f8f5f0",
    heroEyebrow: location || "Specialist beauty studio",
    heroTitle: name,
    heroDescription:
      salon?.subheadline?.trim() ||
      salon?.positioningLine?.trim() ||
      "Personalised beauty services with a thoughtful, modern approach.",
    heroImageId: undefined,
    aboutImageId: undefined,
    aboutTitle: "A considered approach to beauty",
    aboutRole: "Founder & specialist",
    aboutText:
      salon?.aboutText?.trim() ||
      salon?.description?.trim() ||
      "Every appointment is shaped around the person, the desired result, and the details that make the experience feel right.",
    methodEyebrow: "The experience",
    methodTitle: "Beauty with intention",
    methodText:
      "From the first conversation to the final detail, the focus is on thoughtful consultation, careful technique, and results that feel like you.",
    beforeAfterItems: [],
    faqItems: [],
    finalCtaTitle: "Ready for your next appointment?",
    finalCtaText:
      "Choose the channel that works best for you and let’s plan your visit.",
  };
}

export function normalizePremiumEditorial(
  value: Partial<SalonPremiumEditorial> | undefined,
  salon?: Partial<Salon>,
) {
  const defaults = createDefaultPremiumEditorial(salon);

  return {
    ...defaults,
    ...value,
    beforeAfterItems: normalizeBeforeAfterItems(value?.beforeAfterItems),
    faqItems: normalizeFaqItems(value?.faqItems),
  } satisfies SalonPremiumEditorial;
}

export function getPremiumEditorialImages(salon: Salon) {
  const source = salon.realImages.length
    ? salon.realImages
    : salon.galleryImages.length
      ? salon.galleryImages
      : salon.gallery;

  const byId = new Map<string, SalonGalleryImage>();

  for (const image of source) {
    if (getValidImageUrl(image)) {
      byId.set(image.id, image);
    }
  }

  return byId;
}

export function getPremiumImage(salon: Salon, imageId?: string) {
  if (!imageId) {
    return undefined;
  }

  return getPremiumEditorialImages(salon).get(imageId);
}

function normalizeBeforeAfterItems(value: SalonBeforeAfterItem[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is SalonBeforeAfterItem =>
        Boolean(item && typeof item === "object"),
    )
    .map((item, index) => ({
      id: item.id || `before-after-${index + 1}`,
      title: item.title?.trim() || `Transformation ${index + 1}`,
      description: item.description?.trim() || undefined,
      beforeImageId: item.beforeImageId?.trim() || "",
      afterImageId: item.afterImageId?.trim() || "",
      order: Number.isFinite(item.order) ? item.order : index,
      enabled: item.enabled !== false,
    }))
    .sort((a, b) => a.order - b.order);
}

function normalizeFaqItems(value: SalonFaqItem[] | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is SalonFaqItem =>
        Boolean(item && typeof item === "object"),
    )
    .map((item, index) => ({
      id: item.id || `faq-${index + 1}`,
      question: item.question?.trim() || "",
      answer: item.answer?.trim() || "",
      order: Number.isFinite(item.order) ? item.order : index,
      enabled: item.enabled !== false,
    }))
    .filter((item) => item.question && item.answer)
    .sort((a, b) => a.order - b.order);
}
