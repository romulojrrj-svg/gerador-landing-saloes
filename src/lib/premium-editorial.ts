import { getValidImageUrl } from "@/lib/salon-images";
import { normalizeInteractiveQuizConfig } from "@/lib/interactive-quiz";
import type {
  Salon,
  SalonBeforeAfterItem,
  SalonFaqItem,
  SalonGalleryImage,
  SalonPremiumEditorial,
  SalonPremiumReviewScreenshot,
  SalonReviewDisplayType,
  SalonTemplateVersion,
} from "@/types/salon";

export const PREMIUM_EDITORIAL_V1: SalonTemplateVersion = "premium_editorial_v1";
export const PREMIUM_EDITORIAL_V2: SalonTemplateVersion = "premium_editorial_v2";

export type PremiumEditorialV2Preset = {
  fields: Record<string, string>;
  selectedServices: string[];
  serviceDescriptions: Record<string, string>;
  premiumEditorial: SalonPremiumEditorial;
};

const premiumEditorialV2PresetFields = {
  location: "Alvorada, RS",
  city: "Alvorada",
  country: "RS",
  language: "pt-BR",
  positioningLine: "",
  description: "",
  heroOverlayTitle: "",
  heroOverlaySubtitle: "",
  visualStyle: "Luxo suave",
  brandTone: "Premium e acolhedor",
  whatsappMessage:
    "Ol\u00e1!\nVim pelo site e gostaria de marcar uma avalia\u00e7\u00e3o com a Dra. Kerollem",
  googleMapsUrl: "",
  websiteUrl: "",
  bookingUrl: "",
  businessHours: "",
  address: "",
  observedServices:
    "Harmoniza\u00e7\u00e3o Facial Full Face, Perfiloplastia, Preenchimento Labial, Hiperpigmenta\u00e7\u00e3o, Avalia\u00e7\u00e3o Facial Personalizada",
  differentiators: "",
  visualNotes: "",
  manualAssistantNotes: "",
  notes: "",
} as const;

const premiumEditorialV2PresetServices = [
  "Harmoniza\u00e7\u00e3o Facial Full Face",
  "Perfiloplastia",
  "Preenchimento Labial",
  "Hiperpigmenta\u00e7\u00e3o",
  "Avalia\u00e7\u00e3o Facial Personalizada",
];

const premiumEditorialV2PresetContent: SalonPremiumEditorial = {
  accentColor: "#9b7353",
  backgroundColor: "#f8f5f0",
  heroEyebrow: "Harmoniza\u00e7\u00e3o Facial com Naturalidade",
  heroTitle: "Realce sua beleza sem mudar quem voc\u00ea \u00e9",
  heroDescription:
    "Tratamentos personalizados para valorizar seus tra\u00e7os, preservar sua identidade e alcan\u00e7ar resultados naturais e harmoniosos.",
  heroImageId: undefined,
  aboutImageId: undefined,
  aboutTitle: "Beleza, cuidado e naturalidade",
  aboutRole:
    "Dra. Kerollem Oliveira - Especialista em Harmoniza\u00e7\u00e3o Facial e Melasma",
  aboutText:
    "Cada paciente possui tra\u00e7os, necessidades e expectativas pr\u00f3prias. Por isso, o atendimento \u00e9 planejado de forma personalizada, considerando a harmonia facial e aquilo que a pessoa deseja valorizar.\n\nO objetivo \u00e9 proporcionar resultados sutis e equilibrados, que realcem a beleza de maneira natural, sem apagar a ess\u00eancia e a individualidade de cada paciente.",
  methodEyebrow: "Atendimento personalizado",
  methodTitle: "Cada detalhe pensado para voc\u00ea",
  methodText:
    "Desde a avalia\u00e7\u00e3o inicial at\u00e9 o acompanhamento ap\u00f3s o procedimento, cada etapa \u00e9 conduzida com aten\u00e7\u00e3o e cuidado. O objetivo \u00e9 compreender suas expectativas e indicar tratamentos que proporcionem resultados naturais, seguros e compat\u00edveis com o seu rosto.",
  beforeAfterItems: [
    {
      id: "premium-v2-before-after-1",
      order: 0,
      title: "Hiperpigmenta\u00e7\u00e3o",
      description: "",
      beforeImageId: "",
      afterImageId: "",
      enabled: true,
    },
    {
      id: "premium-v2-before-after-2",
      order: 1,
      title: "Harmoniza\u00e7\u00e3o Full Face",
      description: "",
      beforeImageId: "",
      afterImageId: "",
      enabled: true,
    },
    {
      id: "premium-v2-before-after-3",
      order: 2,
      title: "Preenchimento Labial",
      description: "",
      beforeImageId: "",
      afterImageId: "",
      enabled: true,
    },
    {
      id: "premium-v2-before-after-4",
      order: 3,
      title: "Clareamento e remo\u00e7\u00e3o de manchas",
      description: "",
      beforeImageId: "",
      afterImageId: "",
      enabled: true,
    },
  ],
  faqItems: [
    {
      id: "premium-v2-faq-1",
      order: 0,
      answer:
        "A melhor op\u00e7\u00e3o \u00e9 realizar uma avalia\u00e7\u00e3o personalizada. Nela, a Dra. Kerollem analisa suas caracter\u00edsticas e entende o resultado que voc\u00ea deseja antes de indicar qualquer procedimento.",
      enabled: true,
      question: "Como saber qual procedimento \u00e9 indicado para mim?",
    },
    {
      id: "premium-v2-faq-2",
      order: 1,
      answer:
        "Os atendimentos s\u00e3o realizados no consult\u00f3rio da Dra. Kerollem, em Alvorada. O endere\u00e7o e a disponibilidade podem ser confirmados pelo WhatsApp no momento do agendamento.",
      enabled: true,
      question: "Onde s\u00e3o realizados os atendimentos?",
    },
    {
      id: "premium-v2-faq-3",
      order: 2,
      answer:
        "Voc\u00ea pode entrar em contato diretamente pelo bot\u00e3o do WhatsApp dispon\u00edvel na p\u00e1gina para tirar d\u00favidas, consultar hor\u00e1rios e solicitar o agendamento.",
      enabled: true,
      question: "Como posso agendar uma avalia\u00e7\u00e3o?",
    },
    {
      id: "premium-v2-faq-4",
      order: 3,
      answer:
        "A avalia\u00e7\u00e3o \u00e9 realizada de forma individual, considerando as caracter\u00edsticas do seu rosto, suas propor\u00e7\u00f5es, necessidades e objetivos. A partir disso, a Dra. Kerollem indica o melhor protocolo para o seu rosto.",
      enabled: true,
      question: "Como funciona a avalia\u00e7\u00e3o facial personalizada?",
    },
  ],
  reviewDisplayType: "google",
  reviewEyebrow: "O que dizem as pacientes",
  reviewTitle: "Experi\u00eancias que refletem nosso cuidado",
  reviewDescription:
    "Confira alguns relatos de pacientes que compartilharam suas experi\u00eancias ap\u00f3s o atendimento.",
  reviewScreenshotImages: [],
  finalCtaTitle: "Ready for your next appointment?",
  finalCtaText:
    "Agende sua avalia\u00e7\u00e3o com a Dra. Beatriz Dias e descubra quais tratamentos s\u00e3o mais indicados para voc\u00ea.",
  finalCtaBackgroundColor: "#281916",
  finalWhatsappButtonColor: "#25D366",
  finalWhatsappButtonTextColor: "#ffffff",
  bookingButtonTextColor: "#ffffff",
  instagramButtonTextColor: "#281916",
  finalSecondaryButtonTextColor: "#281916",
  aboutLabel: "Sobre",
  servicesLabel: "Procedimentos",
  servicesTitle: "Tratamentos pensados para valorizar voc\u00ea",
  resultsLabel: "Resultados",
  contactLabel: "Contato",
  bookAppointmentLabel: "Agendar avalia\u00e7\u00e3o",
  bookViaWhatsappLabel: "Agendar pelo WhatsApp",
  reservationsLabel: "Agendamento",
  chatOnWhatsappLabel: "Falar com a Dra.Kerollem",
  bookOnFreshaLabel: "B",
};

function getPremiumEditorialV2NameParts(name?: string) {
  const fullName = name?.trim() || "Dra. Kerollem Oliveira";
  const nameWithoutTitle = fullName.replace(/^(?:dra|dr)\.?\s*/i, "").trim();
  const firstName = nameWithoutTitle.split(/\s+/)[0] || "Kerollem";

  return {
    fullName,
    shortName: `Dra. ${firstName}`,
  };
}

export function createPremiumEditorialV2Preset(
  salonName?: string,
): PremiumEditorialV2Preset {
  const { fullName, shortName } = getPremiumEditorialV2NameParts(salonName);

  return {
    fields: {
      ...premiumEditorialV2PresetFields,
      whatsappMessage:
        `Olá!\nVim pelo site e gostaria de marcar uma avaliação com a ${shortName}`,
    },
    selectedServices: [...premiumEditorialV2PresetServices],
    serviceDescriptions: Object.fromEntries(
      premiumEditorialV2PresetServices.map((service) => [service, ""]),
    ),
    premiumEditorial: {
      ...premiumEditorialV2PresetContent,
      aboutRole: premiumEditorialV2PresetContent.aboutRole.replace(
        "Dra. Kerollem Oliveira",
        fullName,
      ),
      faqItems: premiumEditorialV2PresetContent.faqItems.map((item) => ({
        ...item,
        answer: item.answer.replaceAll("Dra. Kerollem", shortName),
      })),
      finalCtaTitle: "Pronta para valorizar sua beleza?",
      finalCtaText: premiumEditorialV2PresetContent.finalCtaText
        .replace("Dra. Beatriz Dias", shortName)
        .replace("Dra. Kerollem", shortName),
      chatOnWhatsappLabel: `Falar com a ${shortName}`,
      beforeAfterItems: premiumEditorialV2PresetContent.beforeAfterItems.map(
        (item) => ({ ...item }),
      ),
    },
  };
}

export function normalizePremiumEditorialVersion(
  value?: SalonTemplateVersion | string | null,
): SalonTemplateVersion {
  return value === PREMIUM_EDITORIAL_V2 ? PREMIUM_EDITORIAL_V2 : PREMIUM_EDITORIAL_V1;
}

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
    bookingButtonTextColor: "#ffffff",
    instagramButtonTextColor: "#281916",
    finalSecondaryButtonTextColor: "#281916",
  };
}

export function normalizePremiumEditorial(
  value: Partial<SalonPremiumEditorial> | undefined,
  salon?: Partial<Salon>,
) {
  const defaults = createDefaultPremiumEditorial(salon);
  const interactiveQuiz = normalizeInteractiveQuizConfig(value?.interactiveQuiz);

  return {
    ...defaults,
    ...value,
    ...(interactiveQuiz ? { interactiveQuiz } : {}),
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
    bookingButtonTextColor:
      value?.bookingButtonTextColor?.trim() ||
      value?.finalSecondaryButtonTextColor?.trim() ||
      defaults.bookingButtonTextColor,
    instagramButtonTextColor:
      value?.instagramButtonTextColor?.trim() ||
      value?.finalSecondaryButtonTextColor?.trim() ||
      defaults.instagramButtonTextColor,
    finalSecondaryButtonTextColor:
      value?.finalSecondaryButtonTextColor?.trim() ||
      defaults.finalSecondaryButtonTextColor,
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
