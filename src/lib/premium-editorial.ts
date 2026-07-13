import { getValidImageUrl } from "@/lib/salon-images";
import type {
  Salon,
  SalonBeforeAfterItem,
  SalonFaqItem,
  SalonGalleryImage,
  SalonPremiumEditorial,
  SalonPremiumReviewScreenshot,
  SalonReviewDisplayType,
} from "@/types/salon";

export type PremiumEditorialLabels = {
  about: string;
  services: string;
  servicesTitle: string;
  results: string;
  contact: string;
  bookAppointment: string;
  bookViaWhatsapp: string;
  reservations: string;
  chatOnWhatsapp: string;
  bookOnFresha: string;
  serviceCta: string;
  before: string;
  after: string;
  beforeAfterTitle: string;
  beforeAfterDescription: string;
  adjustComparison: string;
};

export function getPremiumEditorialLabels(
  salon?: Partial<Pick<Salon, "language" | "landingLanguage">>,
  content?: Partial<SalonPremiumEditorial>,
): PremiumEditorialLabels {
  const language = salon?.landingLanguage ?? salon?.language;
  const isPortuguese = language === "pt-BR";
  const defaults: PremiumEditorialLabels = isPortuguese
    ? {
        about: "Sobre",
        services: "Serviços",
        servicesTitle: "Um menu pensado para cada mulher",
        results: "Resultados",
        contact: "Contato",
        bookAppointment: "Agendar atendimento",
        bookViaWhatsapp: "Agendar pelo WhatsApp",
        reservations: "Agendamentos",
        chatOnWhatsapp: "Conversar no WhatsApp",
        bookOnFresha: "Agendar pelo Fresha",
        serviceCta: "Agendar",
        before: "Antes",
        after: "Depois",
        beforeAfterTitle: "Antes e depois",
        beforeAfterDescription: "Arraste para comparar as transformações selecionadas.",
        adjustComparison: "Ajustar comparação entre antes e depois",
      }
    : {
        about: "About",
        services: "Services",
        servicesTitle: "A menu crafted for every woman",
        results: "Results",
        contact: "Contact",
        bookAppointment: "Book an appointment",
        bookViaWhatsapp: "Book via WhatsApp",
        reservations: "Reservations",
        chatOnWhatsapp: "Chat on WhatsApp",
        bookOnFresha: "Book on Fresha",
        serviceCta: "Book",
        before: "Before",
        after: "After",
        beforeAfterTitle: "Before & after",
        beforeAfterDescription: "Drag to compare selected transformations.",
        adjustComparison: "Adjust before and after comparison",
      };

  return {
    ...defaults,
    about: content?.aboutLabel?.trim() || defaults.about,
    services: content?.servicesLabel?.trim() || defaults.services,
    servicesTitle: content?.servicesTitle?.trim() || defaults.servicesTitle,
    results: content?.resultsLabel?.trim() || defaults.results,
    contact: content?.contactLabel?.trim() || defaults.contact,
    bookAppointment:
      content?.bookAppointmentLabel?.trim() || defaults.bookAppointment,
    bookViaWhatsapp:
      content?.bookViaWhatsappLabel?.trim() || defaults.bookViaWhatsapp,
    reservations:
      content?.reservationsLabel?.trim() || defaults.reservations,
    chatOnWhatsapp:
      content?.chatOnWhatsappLabel?.trim() || defaults.chatOnWhatsapp,
    bookOnFresha:
      content?.bookOnFreshaLabel?.trim() || defaults.bookOnFresha,
  };
}

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
    reviewDisplayType: "google",
    reviewEyebrow: "O que dizem as pacientes",
    reviewTitle: "Experiências que refletem nosso cuidado",
    reviewDescription:
      "Confira alguns relatos de pacientes que compartilharam suas experiências após o atendimento.",
    reviewScreenshotImages: [],
    finalCtaTitle: "Ready for your next appointment?",
    finalCtaText:
      "Choose the channel that works best for you and let’s plan your visit.",
    finalCtaBackgroundColor: "#281916",
    finalWhatsappButtonColor: "#25D366",
    finalWhatsappButtonTextColor: "#ffffff",
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
    reviewDisplayType: normalizeReviewDisplayType(value?.reviewDisplayType),
    reviewEyebrow: value?.reviewEyebrow?.trim() || defaults.reviewEyebrow,
    reviewTitle: value?.reviewTitle?.trim() || defaults.reviewTitle,
    reviewDescription:
      value?.reviewDescription?.trim() || defaults.reviewDescription,
    finalCtaBackgroundColor:
      value?.finalCtaBackgroundColor?.trim() || defaults.finalCtaBackgroundColor,
    finalWhatsappButtonColor:
      value?.finalWhatsappButtonColor?.trim() ||
      defaults.finalWhatsappButtonColor,
    finalWhatsappButtonTextColor:
      value?.finalWhatsappButtonTextColor?.trim() ||
      defaults.finalWhatsappButtonTextColor,
    reviewScreenshotImages: normalizeReviewScreenshotImages(
      value?.reviewScreenshotImages,
    ),
    aboutLabel: normalizeOptionalLabel(value?.aboutLabel),
    servicesLabel: normalizeOptionalLabel(value?.servicesLabel),
    servicesTitle: normalizeOptionalLabel(value?.servicesTitle),
    resultsLabel: normalizeOptionalLabel(value?.resultsLabel),
    contactLabel: normalizeOptionalLabel(value?.contactLabel),
    bookAppointmentLabel: normalizeOptionalLabel(value?.bookAppointmentLabel),
    bookViaWhatsappLabel: normalizeOptionalLabel(value?.bookViaWhatsappLabel),
    reservationsLabel: normalizeOptionalLabel(value?.reservationsLabel),
    chatOnWhatsappLabel: normalizeOptionalLabel(value?.chatOnWhatsappLabel),
    bookOnFreshaLabel: normalizeOptionalLabel(value?.bookOnFreshaLabel),
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

function normalizeReviewDisplayType(
  value: SalonReviewDisplayType | undefined,
): SalonReviewDisplayType {
  return value === "screenshots" ? "screenshots" : "google";
}

function normalizeOptionalLabel(value: string | undefined) {
  return value?.trim() || undefined;
}

function normalizeReviewScreenshotImages(
  value: SalonPremiumReviewScreenshot[] | undefined,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is SalonPremiumReviewScreenshot =>
        Boolean(item && typeof item === "object"),
    )
    .map((item, index) => ({
      id: item.id?.trim() || `review-screenshot-${index + 1}`,
      imageId: item.imageId?.trim() || undefined,
      imageUrl: item.imageUrl?.trim() || undefined,
      imageAlt: item.imageAlt?.trim() || "Feedback de paciente",
      order: Number.isFinite(item.order) ? item.order : index,
    }))
    .filter((item) => item.imageId || item.imageUrl)
    .sort((first, second) => first.order - second.order);
}
