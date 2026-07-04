import type {
  Salon,
  SalonGalleryImage,
  SalonLanguage,
  SalonService,
  SalonTestimonial,
} from "@/types/salon";
import { normalizeSalonLayoutImagePlan } from "./salon-image-plan";

type PublicServiceKey =
  | "hair"
  | "color"
  | "nails"
  | "makeup"
  | "brows"
  | "skin"
  | "bridal"
  | "lashes"
  | "waxing"
  | "generic";

export type PublicService = {
  id: string;
  title: string;
  description: string;
};

export type PublicHeroCard = {
  label: string;
  value: string;
};

export type PublicCta = {
  href?: string;
  label: string;
  title: string;
  text: string;
  noContactText: string;
  external: boolean;
};

export type PublicContactAction = {
  href?: string;
  external: boolean;
};

export type PublicContactLink = {
  id: "booking" | "whatsapp" | "phone" | "instagram" | "google" | "website";
  label: string;
  href: string;
  external: boolean;
  primary?: boolean;
};

export type PublicReviewMetrics = {
  averageRating?: number;
  reviewCount: number;
  source: "google" | "testimonials" | "none";
};

export type PublicBenefit = {
  title: string;
  description: string;
};

type PublicText = {
  salonIn: (location: string) => string;
  bookAppointment: string;
  exploreServices: string;
  locationLabel: string;
  appointmentLabel: string;
  appointmentValue: string;
  contactLabel: string;
  whatsappAvailable: string;
  phoneAvailable: string;
  instagramAvailable: string;
  mapsAvailable: string;
  servicesLabel: string;
  servicesTitle: string;
  servicesDescription: string;
  serviceCta: string;
  aboutTitle: string;
  aboutFallback: (salonName: string, location?: string) => string;
  galleryTitle: string;
  galleryDescription: string;
  experienceTitle: string;
  experienceText: string;
  reviewsTitle: string;
  googleReviewsTitle: string;
  reviewsDescription: string;
  whyTitle: string;
  whyDescription: string;
  benefits: PublicBenefit[];
  ctaTitle: string;
  ctaText: string;
  ctaLabel: string;
  noContactText: string;
  spaceTitle: string;
  spaceDescription: string;
  genericServiceDescription: string;
  serviceCatalog: Record<PublicServiceKey, PublicService>;
  serviceSummaryLabels: Record<PublicServiceKey, string>;
};

const publicText: Record<SalonLanguage, PublicText> = {
  "pt-BR": {
    salonIn: (location) => `Salão em ${location}`,
    bookAppointment: "Agendar horário",
    exploreServices: "Ver serviços",
    locationLabel: "Localização",
    appointmentLabel: "Atendimento",
    appointmentValue: "Com hora marcada",
    contactLabel: "Contato",
    whatsappAvailable: "WhatsApp disponível",
    phoneAvailable: "Telefone disponível",
    instagramAvailable: "Instagram disponível",
    mapsAvailable: "Rotas disponíveis",
    servicesLabel: "Serviços",
    servicesTitle: "Serviços para cuidar da sua beleza",
    servicesDescription:
      "Escolha o atendimento ideal para a sua rotina, evento ou momento de cuidado.",
    serviceCta: "Consultar",
    aboutTitle: "Sobre o salão",
    aboutFallback: (salonName, location) =>
      location
        ? `Localizado em ${location}, o ${salonName} oferece atendimentos de beleza com foco em cuidado, praticidade e atenção aos detalhes.`
        : `${salonName} oferece atendimentos de beleza com foco em cuidado, praticidade e atenção aos detalhes.`,
    galleryTitle: "Galeria",
    galleryDescription:
      "Conheça o espaço, os detalhes e alguns resultados do salão.",
    experienceTitle: "Experiência pensada para você",
    experienceText:
      "Atendimento com cuidado, organização e atenção aos detalhes em cada etapa.",
    reviewsTitle: "Avaliações",
    googleReviewsTitle: "Avaliações do Google",
    reviewsDescription:
      "Opiniões reais de clientes que já passaram pelo salão.",
    whyTitle: "Por que escolher este salão",
    whyDescription:
      "Benefícios pensados para tornar seu atendimento mais simples, bonito e confortável.",
    benefits: [
      {
        title: "Atendimento personalizado",
        description:
          "Cuidado adaptado ao estilo, à rotina e ao resultado desejado por cada cliente.",
      },
      {
        title: "Serviços para rotina e eventos",
        description:
          "Opções para o dia a dia, ocasiões especiais, fotos e momentos importantes.",
      },
      {
        title: "Facilidade para agendar",
        description:
          "Canais de contato claros para combinar o melhor horário de atendimento.",
      },
      {
        title: "Cuidado com os detalhes",
        description:
          "Atenção ao acabamento, à higiene e à experiência durante o atendimento.",
      },
      {
        title: "Localização prática",
        description:
          "Um endereço pensado para facilitar a chegada e a organização da sua visita.",
      },
    ],
    ctaTitle: "Agende seu horário",
    ctaText:
      "Fale com o salão e escolha o melhor horário para o seu atendimento.",
    ctaLabel: "Agendar agora",
    noContactText: "Entre em contato pelo canal informado pelo salão.",
    spaceTitle: "Nosso Espaço",
    spaceDescription: "Conheça um pouco do ambiente e dos detalhes do salão.",
    genericServiceDescription:
      "Atendimento personalizado, com cuidado nos detalhes e foco no resultado desejado.",
    serviceCatalog: {
      hair: {
        id: "hair",
        title: "Cortes e escovas",
        description:
          "Cortes, escovas e finalizações pensadas para valorizar o rosto, o estilo e a rotina de cada cliente.",
      },
      color: {
        id: "color",
        title: "Coloração",
        description:
          "Técnicas de cor, tonalização e iluminação para realçar o visual com naturalidade.",
      },
      nails: {
        id: "nails",
        title: "Manicure e pedicure",
        description:
          "Cuidados completos para unhas, com acabamento delicado, higiene e atenção aos detalhes.",
      },
      makeup: {
        id: "makeup",
        title: "Maquiagem profissional",
        description:
          "Produções para eventos, fotos e ocasiões especiais, com acabamento bonito e duradouro.",
      },
      brows: {
        id: "brows",
        title: "Design de sobrancelhas",
        description:
          "Modelagem cuidadosa para valorizar a expressão do rosto com equilíbrio e naturalidade.",
      },
      skin: {
        id: "skin",
        title: "Tratamentos faciais",
        description:
          "Cuidados para a pele com foco em bem-estar, renovação e aparência saudável.",
      },
      bridal: {
        id: "bridal",
        title: "Noivas e eventos",
        description:
          "Atendimento para datas especiais, com produção alinhada ao estilo, ao horário e à ocasião.",
      },
      lashes: {
        id: "lashes",
        title: "Extensão de cílios",
        description:
          "Aplicação de cílios para realçar o olhar com conforto, leveza e acabamento natural.",
      },
      waxing: {
        id: "waxing",
        title: "Depilação",
        description:
          "Atendimento cuidadoso para depilação, com foco em higiene, conforto e praticidade.",
      },
      generic: {
        id: "generic",
        title: "Atendimento personalizado",
        description:
          "Atendimento personalizado, com cuidado nos detalhes e foco no resultado desejado.",
      },
    },
    serviceSummaryLabels: {
      hair: "Cabelo",
      color: "Coloração",
      nails: "unhas",
      makeup: "maquiagem",
      brows: "sobrancelhas",
      skin: "pele",
      bridal: "eventos",
      lashes: "cílios",
      waxing: "depilação",
      generic: "beleza",
    },
  },
  en: {
    salonIn: (location) => `Salon in ${location}`,
    bookAppointment: "Book appointment",
    exploreServices: "Explore services",
    locationLabel: "Location",
    appointmentLabel: "Appointments",
    appointmentValue: "By appointment",
    contactLabel: "Contact",
    whatsappAvailable: "WhatsApp available",
    phoneAvailable: "Phone available",
    instagramAvailable: "Instagram available",
    mapsAvailable: "Maps available",
    servicesLabel: "Services",
    servicesTitle: "Beauty services for routine and special moments",
    servicesDescription:
      "Choose the appointment that best fits your routine, event, or beauty goals.",
    serviceCta: "Ask about this",
    aboutTitle: "About the salon",
    aboutFallback: (salonName, location) =>
      location
        ? `Located in ${location}, ${salonName} offers beauty appointments focused on care, practicality, and attention to detail.`
        : `${salonName} offers beauty appointments focused on care, practicality, and attention to detail.`,
    galleryTitle: "Gallery",
    galleryDescription:
      "See the space, details, and selected salon results.",
    experienceTitle: "An experience designed around you",
    experienceText:
      "Careful service, clear organization, and attention to detail at every step.",
    reviewsTitle: "Reviews",
    googleReviewsTitle: "Google reviews",
    reviewsDescription: "Real feedback from clients who visited the salon.",
    whyTitle: "Why choose this salon",
    whyDescription:
      "Clear reasons to choose a beauty appointment with more care and less friction.",
    benefits: [
      {
        title: "Personalized service",
        description:
          "Care shaped around each client's style, routine, and desired result.",
      },
      {
        title: "Routine and event services",
        description:
          "Options for everyday beauty, special occasions, photos, and important moments.",
      },
      {
        title: "Easy booking",
        description:
          "Clear contact paths to choose the best appointment time.",
      },
      {
        title: "Attention to detail",
        description:
          "A focus on finish, hygiene, and comfort throughout the appointment.",
      },
      {
        title: "Practical location",
        description:
          "A location that helps make the visit easier to plan.",
      },
    ],
    ctaTitle: "Book your appointment",
    ctaText: "Contact the salon and choose the best time for your visit.",
    ctaLabel: "Book now",
    noContactText: "Contact the salon through the channel they provide.",
    spaceTitle: "Our Space",
    spaceDescription: "Take a look at the salon environment and details.",
    genericServiceDescription:
      "Personalized service with attention to detail and focus on the desired result.",
    serviceCatalog: {
      hair: {
        id: "hair",
        title: "Haircuts and styling",
        description:
          "Cuts, blowouts, and finishes designed around face shape, style, and daily routine.",
      },
      color: {
        id: "color",
        title: "Hair color",
        description:
          "Color, toning, and lightening techniques to enhance the look with softness and balance.",
      },
      nails: {
        id: "nails",
        title: "Manicure and pedicure",
        description:
          "Complete nail care with delicate finishing, hygiene, and attention to detail.",
      },
      makeup: {
        id: "makeup",
        title: "Professional makeup",
        description:
          "Makeup for events, photos, and special occasions with a beautiful, lasting finish.",
      },
      brows: {
        id: "brows",
        title: "Brow design",
        description:
          "Careful brow shaping to enhance facial expression with balance and naturalness.",
      },
      skin: {
        id: "skin",
        title: "Facial treatments",
        description:
          "Skin care focused on wellbeing, renewal, and a healthy appearance.",
      },
      bridal: {
        id: "bridal",
        title: "Bridal and events",
        description:
          "Beauty support for special dates, aligned with the style, timing, and occasion.",
      },
      lashes: {
        id: "lashes",
        title: "Lash extensions",
        description:
          "Lash application to enhance the eyes with comfort, lightness, and a natural finish.",
      },
      waxing: {
        id: "waxing",
        title: "Waxing",
        description:
          "Careful waxing service focused on hygiene, comfort, and practicality.",
      },
      generic: {
        id: "generic",
        title: "Personalized service",
        description:
          "Personalized service with attention to detail and focus on the desired result.",
      },
    },
    serviceSummaryLabels: {
      hair: "Hair",
      color: "color",
      nails: "nails",
      makeup: "makeup",
      brows: "brows",
      skin: "skin",
      bridal: "events",
      lashes: "lashes",
      waxing: "waxing",
      generic: "beauty",
    },
  },
  es: {
    salonIn: (location) => `Salón en ${location}`,
    bookAppointment: "Reservar cita",
    exploreServices: "Ver servicios",
    locationLabel: "Ubicación",
    appointmentLabel: "Atención",
    appointmentValue: "Con cita previa",
    contactLabel: "Contacto",
    whatsappAvailable: "WhatsApp disponible",
    phoneAvailable: "Teléfono disponible",
    instagramAvailable: "Instagram disponible",
    mapsAvailable: "Mapa disponible",
    servicesLabel: "Servicios",
    servicesTitle: "Servicios de belleza para rutina y ocasiones especiales",
    servicesDescription:
      "Elige el servicio ideal para tu rutina, evento o momento de cuidado.",
    serviceCta: "Consultar",
    aboutTitle: "Sobre el salón",
    aboutFallback: (salonName, location) =>
      location
        ? `Ubicado en ${location}, ${salonName} ofrece servicios de belleza con foco en cuidado, practicidad y atención a los detalles.`
        : `${salonName} ofrece servicios de belleza con foco en cuidado, practicidad y atención a los detalles.`,
    galleryTitle: "Galería",
    galleryDescription:
      "Conoce el espacio, los detalles y algunos resultados del salón.",
    experienceTitle: "Una experiencia pensada para ti",
    experienceText:
      "Atención cuidada, organización y detalle en cada etapa.",
    reviewsTitle: "Reseñas",
    googleReviewsTitle: "Reseñas de Google",
    reviewsDescription: "Opiniones reales de clientes que visitaron el salón.",
    whyTitle: "Por qué elegir este salón",
    whyDescription:
      "Motivos claros para elegir una experiencia de belleza más cómoda y cuidada.",
    benefits: [
      {
        title: "Atención personalizada",
        description:
          "Cuidado adaptado al estilo, rutina y resultado deseado por cada cliente.",
      },
      {
        title: "Servicios para rutina y eventos",
        description:
          "Opciones para el día a día, ocasiones especiales, fotos y momentos importantes.",
      },
      {
        title: "Reserva sencilla",
        description:
          "Canales claros para elegir el mejor horario de atención.",
      },
      {
        title: "Cuidado en los detalles",
        description:
          "Atención al acabado, higiene y comodidad durante el servicio.",
      },
      {
        title: "Ubicación práctica",
        description:
          "Un lugar pensado para facilitar la organización de tu visita.",
      },
    ],
    ctaTitle: "Reserva tu cita",
    ctaText: "Habla con el salón y elige el mejor horario para tu atención.",
    ctaLabel: "Reservar ahora",
    noContactText: "Contacta el salón por el canal informado.",
    spaceTitle: "Nuestro Espacio",
    spaceDescription: "Mira un poco el ambiente y los detalles del salón.",
    genericServiceDescription:
      "Atención personalizada, con cuidado en los detalles y foco en el resultado deseado.",
    serviceCatalog: {} as Record<PublicServiceKey, PublicService>,
    serviceSummaryLabels: {} as Record<PublicServiceKey, string>,
  },
  fr: {} as PublicText,
  no: {} as PublicText,
};

Object.assign(publicText.fr, {
  spaceTitle: "Our Space",
  spaceDescription: "Take a look at the salon environment and details.",
});

publicText.es.serviceCatalog = publicText["pt-BR"].serviceCatalog;
publicText.es.serviceSummaryLabels = publicText["pt-BR"].serviceSummaryLabels;
publicText.fr = publicText.en;
publicText.no = {
  ...publicText.en,
  salonIn: (location) => `Salong i ${location}`,
  bookAppointment: "Bestill time",
  exploreServices: "Se tjenester",
  appointmentValue: "Etter avtale",
  whatsappAvailable: "WhatsApp tilgjengelig",
  ctaTitle: "Bestill time",
  ctaText: "Kontakt salongen og velg tidspunktet som passer best.",
  ctaLabel: "Bestill nå",
};

Object.assign(publicText.es, {
  serviceCatalog: {
    hair: {
      id: "hair",
      title: "Cortes y peinados",
      description:
        "Cortes, brushing y acabados pensados para realzar el rostro, el estilo y la rutina de cada clienta.",
    },
    color: {
      id: "color",
      title: "Coloración",
      description:
        "Técnicas de color, matización e iluminación para realzar el look con naturalidad.",
    },
    nails: {
      id: "nails",
      title: "Manicura y pedicura",
      description:
        "Cuidado completo de uñas, con acabado delicado, higiene y atención al detalle.",
    },
    makeup: {
      id: "makeup",
      title: "Maquillaje profesional",
      description:
        "Producciones para eventos, fotos y ocasiones especiales, con un acabado bonito y duradero.",
    },
    brows: {
      id: "brows",
      title: "Diseño de cejas",
      description:
        "Diseño cuidadoso para realzar la expresión del rostro con equilibrio y naturalidad.",
    },
    skin: {
      id: "skin",
      title: "Tratamientos faciales",
      description:
        "Cuidados para la piel con foco en bienestar, renovación y apariencia saludable.",
    },
    bridal: {
      id: "bridal",
      title: "Novias y eventos",
      description:
        "Atención para fechas especiales, alineada con el estilo, el horario y la ocasión.",
    },
    lashes: {
      id: "lashes",
      title: "Extensión de pestañas",
      description:
        "Aplicación de pestañas para realzar la mirada con comodidad, ligereza y acabado natural.",
    },
    waxing: {
      id: "waxing",
      title: "Depilación",
      description:
        "Servicio de depilación cuidadoso, con foco en higiene, comodidad y practicidad.",
    },
    generic: {
      id: "generic",
      title: "Atención personalizada",
      description:
        "Atención personalizada, con cuidado en los detalles y foco en el resultado deseado.",
    },
  },
  serviceSummaryLabels: {
    hair: "Cabello",
    color: "color",
    nails: "uñas",
    makeup: "maquillaje",
    brows: "cejas",
    skin: "piel",
    bridal: "eventos",
    lashes: "pestañas",
    waxing: "depilación",
    generic: "belleza",
  },
});

Object.assign(publicText.no, {
  locationLabel: "Sted",
  appointmentLabel: "Timebestilling",
  contactLabel: "Kontakt",
  phoneAvailable: "Telefon tilgjengelig",
  instagramAvailable: "Instagram tilgjengelig",
  mapsAvailable: "Kart tilgjengelig",
  servicesLabel: "Tjenester",
  servicesTitle: "Skjønnhetstjenester for hverdag og spesielle anledninger",
  servicesDescription:
    "Velg behandlingen som passer best for rutinen, arrangementet eller skjønnhetsmålet ditt.",
  serviceCta: "Spør om dette",
  aboutTitle: "Om salongen",
  aboutFallback: (salonName: string, location?: string) =>
    location
      ? `${salonName} ligger i ${location} og tilbyr skjønnhetsbehandlinger med fokus på omsorg, praktiske løsninger og detaljer.`
      : `${salonName} tilbyr skjønnhetsbehandlinger med fokus på omsorg, praktiske løsninger og detaljer.`,
  galleryTitle: "Galleri",
  galleryDescription:
    "Se salongen, detaljene og utvalgte resultater.",
  experienceTitle: "En opplevelse laget for deg",
  experienceText:
    "Omsorgsfull service, tydelig organisering og oppmerksomhet på detaljer i hvert steg.",
  reviewsTitle: "Anmeldelser",
  googleReviewsTitle: "Google-anmeldelser",
  reviewsDescription: "Ekte tilbakemeldinger fra kunder som har besøkt salongen.",
  whyTitle: "Hvorfor velge denne salongen",
  whyDescription:
    "Tydelige grunner til å velge en skjønnhetsopplevelse med mer omsorg og mindre friksjon.",
  benefits: [
    {
      title: "Personlig service",
      description:
        "Omsorg tilpasset hver kundes stil, rutine og ønskede resultat.",
    },
    {
      title: "Tjenester for hverdag og eventer",
      description:
        "Alternativer for hverdagspleie, spesielle anledninger, bilder og viktige øyeblikk.",
    },
    {
      title: "Enkel booking",
      description:
        "Tydelige kontaktmuligheter for å finne tidspunktet som passer best.",
    },
    {
      title: "Fokus på detaljer",
      description:
        "Vekt på finish, hygiene og komfort gjennom hele behandlingen.",
    },
    {
      title: "Praktisk beliggenhet",
      description:
        "Et sted som gjør besøket enklere å planlegge.",
    },
  ],
  noContactText: "Kontakt salongen via kanalen de har oppgitt.",
  genericServiceDescription:
    "Personlig service med oppmerksomhet på detaljer og fokus på ønsket resultat.",
  serviceCatalog: {
    hair: {
      id: "hair",
      title: "Klipp og styling",
      description:
        "Klipp, føn og finish tilpasset ansiktsform, stil og daglig rutine.",
    },
    color: {
      id: "color",
      title: "Hårfarge",
      description:
        "Farge, toning og lysningsteknikker for å fremheve uttrykket med balanse.",
    },
    nails: {
      id: "nails",
      title: "Manikyr og pedikyr",
      description:
        "Komplett neglepleie med delikat finish, hygiene og oppmerksomhet på detaljer.",
    },
    makeup: {
      id: "makeup",
      title: "Profesjonell makeup",
      description:
        "Makeup for eventer, bilder og spesielle anledninger med vakker og holdbar finish.",
    },
    brows: {
      id: "brows",
      title: "Brynforming",
      description:
        "Nøye forming av bryn for å fremheve ansiktet med balanse og naturlighet.",
    },
    skin: {
      id: "skin",
      title: "Ansiktsbehandlinger",
      description:
        "Hudpleie med fokus på velvære, fornyelse og et sunt uttrykk.",
    },
    bridal: {
      id: "bridal",
      title: "Brud og eventer",
      description:
        "Skjønnhetsforberedelse for spesielle datoer, tilpasset stil, tid og anledning.",
    },
    lashes: {
      id: "lashes",
      title: "Vippeextensions",
      description:
        "Vippebehandling som fremhever blikket med komfort, letthet og naturlig finish.",
    },
    waxing: {
      id: "waxing",
      title: "Voksing",
      description:
        "Skånsom voksing med fokus på hygiene, komfort og praktisk gjennomføring.",
    },
    generic: {
      id: "generic",
      title: "Personlig behandling",
      description:
        "Personlig service med oppmerksomhet på detaljer og fokus på ønsket resultat.",
    },
  },
  serviceSummaryLabels: {
    hair: "Hår",
    color: "farge",
    nails: "negler",
    makeup: "makeup",
    brows: "bryn",
    skin: "hud",
    bridal: "eventer",
    lashes: "vipper",
    waxing: "voksing",
    generic: "skjønnhet",
  },
});

export function getPublicText(language: SalonLanguage) {
  return publicText[language] ?? publicText.en;
}

const legacySpaceTitleValues = ["nosso espaco", "nosso espaço"];
const legacySpaceDescriptionValues = [
  "conheca o ambiente, os detalhes e a atmosfera do salao.",
  "conheça o ambiente, os detalhes e a atmosfera do salão.",
  "conheca um pouco do ambiente e dos detalhes do salao.",
  "conheça um pouco do ambiente e dos detalhes do salão.",
];

function normalizeLocalTextValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveLocalizedSpaceText(
  savedValue: string | undefined,
  fallbackText: string,
  legacyValues: string[],
) {
  const trimmedValue = clean(savedValue);

  if (!trimmedValue) {
    return fallbackText;
  }

  const normalizedValue = normalizeLocalTextValue(trimmedValue);

  if (legacyValues.some((value) => normalizedValue === normalizeLocalTextValue(value))) {
    return fallbackText;
  }

  return trimmedValue;
}

export function getPublicSpaceSectionCopy(
  language: SalonLanguage,
  title?: string,
  description?: string,
) {
  const copy = getPublicText(language);

  return {
    title: resolveLocalizedSpaceText(title, copy.spaceTitle, legacySpaceTitleValues),
    description: resolveLocalizedSpaceText(
      description,
      copy.spaceDescription,
      legacySpaceDescriptionValues,
    ),
  };
}

export function getPublicHeroEyebrow(salon: Salon) {
  const text = getPublicText(salon.language);

  return salon.location ? text.salonIn(salon.location) : undefined;
}

export function getAppliedCopy(salon: Salon) {
  if (salon.generatedCopy?.status === "applied") {
    return salon.generatedCopy;
  }

  if (salon.copySuggestions?.status === "applied") {
    return salon.copySuggestions;
  }

  return undefined;
}

export function getPublicHeroHeadline(salon: Salon) {
  const appliedCopy = getAppliedCopy(salon);

  return (
    clean(appliedCopy?.headline) ||
    clean(salon.positioningLine) ||
    clean(salon.tagline) ||
    clean(salon.headline)
  );
}

export function getPublicHeroDescription(salon: Salon) {
  const appliedCopy = getAppliedCopy(salon);

  return (
    clean(appliedCopy?.subheadline) ||
    clean(salon.description) ||
    getPublicText(salon.language).aboutFallback(salon.name, salon.location)
  );
}

export function getPublicAboutText(salon: Salon) {
  const text = getPublicText(salon.language);
  const appliedCopy = getAppliedCopy(salon);
  const description = clean(salon.description);

  if (appliedCopy?.aboutText) {
    return appliedCopy.aboutText;
  }

  if (description) {
    return salon.location
      ? `${text.aboutFallback(salon.name, salon.location)} ${description}`
      : description;
  }

  return text.aboutFallback(salon.name, salon.location);
}

export function getPublicServices(
  services: SalonService[],
  language: SalonLanguage,
  preferServiceCopy = false,
) {
  const text = getPublicText(language);
  const seen = new Set<string>();
  const broadGenericService = getBroadGenericService(language);
  const normalizedServices = services.length
    ? services
    : [{ id: "generic", title: "beauty", description: "" }];

  return normalizedServices
    .map((service) => {
      const key = classifyService(service.title);
      const catalogService = text.serviceCatalog[key] ?? text.serviceCatalog.generic;
      const publicService =
        preferServiceCopy && clean(service.title) && clean(service.description)
          ? {
              id: service.id || catalogService.id,
              title: service.title,
              description: service.description,
            }
          : key === "generic"
            ? {
                id: service.id || "generic",
                title:
                  clean(service.title) && normalizeText(service.title) !== "beauty"
                    ? service.title
                    : broadGenericService.title,
                description:
                  clean(service.description) || broadGenericService.description,
              }
            : catalogService;

      return {
        ...publicService,
        id: service.id || publicService.id,
        key,
      };
    })
    .filter((service) => {
      const key = service.key === "generic" ? service.title : service.key;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function getBroadGenericService(language: SalonLanguage) {
  const copyByLanguage: Record<
    SalonLanguage,
    { title: string; description: string }
  > = {
    "pt-BR": {
      title: "Atendimentos de beleza e autocuidado",
      description:
        "Uma selecao de atendimentos para rotina, eventos e momentos especiais, sempre com cuidado nos detalhes.",
    },
    en: {
      title: "Beauty and self-care appointments",
      description:
        "A broader beauty offer for everyday care, events, and special moments.",
    },
    es: {
      title: "Servicios de belleza y autocuidado",
      description:
        "Una propuesta mas amplia para rutina, eventos y momentos especiales.",
    },
    fr: {
      title: "Beaute et soins",
      description:
        "Une presentation plus large pour le quotidien, les evenements et les moments speciaux.",
    },
    no: {
      title: "Skjonnhet og egenpleie",
      description:
        "Et bredere tilbud for hverdagspleie, arrangementer og spesielle anledninger.",
    },
  };

  return copyByLanguage[language] ?? copyByLanguage.en;
}

export function getPublicServiceSummary(
  services: SalonService[],
  language: SalonLanguage,
) {
  const text = getPublicText(language);
  const serviceKeys = getPublicServices(services, language)
    .map((service) => service.key)
    .filter((key) => key !== "generic")
    .slice(0, 3);
  const labels = serviceKeys.map((key) => text.serviceSummaryLabels[key]);

  return joinList(labels, language);
}

export function getPublicServicesIntro(salon: Salon) {
  const text = getPublicText(salon.language);
  const appliedCopy = getAppliedCopy(salon);

  return {
    title: clean(appliedCopy?.servicesIntroTitle) || text.servicesTitle,
    description:
      clean(appliedCopy?.servicesIntroText) || text.servicesDescription,
  };
}

export function getPublicHeroCards(salon: Salon): PublicHeroCard[] {
  const text = getPublicText(salon.language);
  const cards: PublicHeroCard[] = [];
  const serviceSummary = getPublicServiceSummary(salon.services, salon.language);

  if (salon.location) {
    cards.push({
      label: text.locationLabel,
      value: salon.location,
    });
  }

  if (salon.bookingUrl || salon.whatsapp || salon.phone) {
    cards.push({
      label: text.appointmentLabel,
      value: text.appointmentValue,
    });
  }

  if (salon.whatsapp) {
    cards.push({
      label: text.contactLabel,
      value: text.whatsappAvailable,
    });
  } else if (salon.phone) {
    cards.push({
      label: text.contactLabel,
      value: text.phoneAvailable,
    });
  } else if (salon.instagramUrl) {
    cards.push({
      label: text.contactLabel,
      value: text.instagramAvailable,
    });
  } else if (salon.googleMapsUrl || salon.googleBusinessUrl) {
    cards.push({
      label: text.contactLabel,
      value: text.mapsAvailable,
    });
  }

  if (serviceSummary) {
    cards.push({
      label: text.servicesLabel,
      value: serviceSummary,
    });
  }

  return cards.slice(0, 4);
}

export function getRealGalleryImages(salon: Salon): SalonGalleryImage[] {
  return salon.gallery.filter(
    (image) =>
      image.isReal &&
      image.selectedForLanding &&
      image.type !== "logo",
  );
}

function getRealLandingImages(salon: Salon) {
  return (salon.realImages?.length ? salon.realImages : salon.gallery).filter(
    (image) =>
      image.isReal &&
      image.selectedForLanding &&
      image.type !== "logo",
  );
}

function getAllRealSelectedImages(salon: Salon) {
  return (salon.realImages?.length ? salon.realImages : salon.gallery).filter(
    (image) => image.isReal && image.selectedForLanding,
  );
}

function resolveImageFromPlanId(salon: Salon, imageId: string) {
  const landingImages = getRealLandingImages(salon);

  return (
    landingImages.find((image) => image.id === imageId) ??
    landingImages.find((image) => image.id === `image-${imageId}`) ??
    landingImages.find((image) => image.id.endsWith(imageId))
  );
}

function resolveAnyImageFromPlanId(salon: Salon, imageId: string) {
  const images = getAllRealSelectedImages(salon);

  return (
    images.find((image) => image.id === imageId) ??
    images.find((image) => image.id === `image-${imageId}`) ??
    images.find((image) => image.id.endsWith(imageId))
  );
}

function resolvePlanImages(salon: Salon, imageIds: string[]) {
  const seen = new Set<string>();

  return imageIds
    .map((imageId) => resolveImageFromPlanId(salon, imageId))
    .filter((image): image is SalonGalleryImage => Boolean(image))
    .filter((image) => {
      const identityKeys = getImageIdentityKeys(image);

      if (identityKeys.some((key) => seen.has(key))) {
        return false;
      }

      for (const key of identityKeys) {
        seen.add(key);
      }

      return true;
    });
}

function getNormalizedPublicImagePlan(salon: Salon) {
  return normalizeSalonLayoutImagePlan(salon.layoutImagePlan, {
    availableImageIds: (salon.realImages?.length ? salon.realImages : salon.gallery)
      .filter((image) => image.isReal && image.selectedForLanding)
      .map((image) => image.id),
  });
}

function hasExplicitPublicImagePlan(salon: Salon) {
  const plan = getNormalizedPublicImagePlan(salon);

  return Boolean(
    plan &&
      (plan.logoImageId ||
        plan.topImageIds?.length ||
        plan.galleryImageIds?.length ||
        plan.spaceImageIds?.length ||
        plan.ignoredImageIds?.length ||
        plan.spaceEnabled),
  );
}

function getTopImageIds(salon: Salon) {
  const plan = getNormalizedPublicImagePlan(salon);

  if (!plan) {
    return [];
  }

  return plan.topImageIds ?? [];
}

function getSpaceImageIds(salon: Salon) {
  const plan = getNormalizedPublicImagePlan(salon);

  if (!plan) {
    return [];
  }

  return plan.spaceImageIds ?? [];
}

function getIgnoredImageIds(salon: Salon) {
  return new Set(getNormalizedPublicImagePlan(salon)?.ignoredImageIds ?? []);
}

function imageMatchesPlanId(imageId: string, planId: string) {
  return imageId === planId || imageId === `image-${planId}` || imageId.endsWith(planId);
}

function planIdsIncludeImage(imageIds: Iterable<string>, image: SalonGalleryImage) {
  for (const imageId of imageIds) {
    if (imageMatchesPlanId(image.id, imageId)) {
      return true;
    }
  }

  return false;
}

function getImageIdentityKeys(image: SalonGalleryImage) {
  return Array.from(
    new Set([image.id, image.src, image.url].filter(Boolean) as string[]),
  );
}

function dedupePublicImages(images: SalonGalleryImage[]) {
  const seen = new Set<string>();

  return images.filter((image) => {
    const keys = getImageIdentityKeys(image);

    if (keys.some((key) => seen.has(key))) {
      return false;
    }

    for (const key of keys) {
      seen.add(key);
    }

    return true;
  });
}

export function getPublicHeroImage(salon: Salon) {
  const topImageIds = getTopImageIds(salon);
  const plannedHero = topImageIds.length === 1
    ? resolveImageFromPlanId(salon, topImageIds[0])
    : undefined;

  if (plannedHero?.src) {
    return plannedHero.src;
  }

  if (hasExplicitPublicImagePlan(salon)) {
    return "";
  }

  const landingImages = getRealGalleryImages(salon);
  const realHeroImage = salon.gallery.find(
    (image) =>
      image.isReal &&
      image.selectedForLanding &&
      image.type !== "logo" &&
      (image.type === "hero" || image.type === "interior"),
  );
  const firstRealImage = landingImages.find((image) => image.type !== "logo");

  return (
    realHeroImage?.src ||
    firstRealImage?.src ||
    (salon.heroImage && getPublicLogoImage(salon)?.src !== salon.heroImage
      ? salon.heroImage
      : undefined) ||
    salon.gallery.find((image) => image.type === "hero")?.src ||
    salon.gallery.find((image) => image.type !== "logo")?.src ||
    salon.heroImage ||
    ""
  );
}

export function getPublicHeroMosaicImages(salon: Salon) {
  const plannedImages = resolvePlanImages(salon, getTopImageIds(salon));

  if (plannedImages.length >= 2) {
    return plannedImages.slice(0, 3);
  }

  if (hasExplicitPublicImagePlan(salon)) {
    return [];
  }

  const fallbackImages = getRealLandingImages(salon)
    .filter((image) => image.type !== "hero")
    .slice(0, 3);

  return fallbackImages.length >= 2 ? fallbackImages : [];
}

export function getPublicLogoImage(salon: Salon) {
  const normalizedPlan = getNormalizedPublicImagePlan(salon);
  const plannedLogo = normalizedPlan?.logoImageId
    ? resolveAnyImageFromPlanId(salon, normalizedPlan.logoImageId)
    : undefined;

  if (plannedLogo?.type === "logo") {
    return plannedLogo;
  }

  if (hasExplicitPublicImagePlan(salon)) {
    return undefined;
  }

  return salon.gallery.find(
    (image) =>
      image.isReal &&
      image.selectedForLanding &&
      image.type === "logo",
  );
}

export function getPublicSupportingImage(salon: Salon) {
  const plannedExperience = getPublicSpaceImages(salon)[0];

  if (plannedExperience) {
    return plannedExperience;
  }

  if (hasExplicitPublicImagePlan(salon)) {
    return undefined;
  }

  return getRealGalleryImages(salon).find(
    (image) => image.type !== "hero" && image.type !== "logo",
  );
}

export function getPublicGalleryImages(salon: Salon) {
  const normalizedPlan = getNormalizedPublicImagePlan(salon);
  const ignoredIds = getIgnoredImageIds(salon);
  const topIds = new Set(getTopImageIds(salon));
  const spaceIds = new Set(getSpaceImageIds(salon));
  const logoImageId = normalizedPlan?.logoImageId;
  const plannedGallery = resolvePlanImages(
    salon,
    normalizedPlan?.galleryImageIds ?? [],
  ).filter(
    (image) =>
      !planIdsIncludeImage(ignoredIds, image) &&
      !planIdsIncludeImage(topIds, image) &&
      !planIdsIncludeImage(spaceIds, image) &&
      !(logoImageId && imageMatchesPlanId(image.id, logoImageId)) &&
      image.type !== "logo",
  );

  if (hasExplicitPublicImagePlan(salon)) {
    return plannedGallery;
  }

  return getRealGalleryImages(salon).filter(
    (image) =>
      image.type !== "logo" &&
      !planIdsIncludeImage(ignoredIds, image) &&
      !planIdsIncludeImage(topIds, image) &&
      !planIdsIncludeImage(spaceIds, image) &&
      !(logoImageId && imageMatchesPlanId(image.id, logoImageId)),
  );
}

export function getPublicExperienceImages(salon: Salon) {
  return getPublicSpaceImages(salon);
}

export function getPublicSpaceImages(salon: Salon) {
  const normalizedPlan = getNormalizedPublicImagePlan(salon);
  const hasExplicitPlan = hasExplicitPublicImagePlan(salon);

  if (!normalizedPlan?.spaceEnabled) {
    if (hasExplicitPlan) {
      return [];
    }

    return dedupePublicImages(
      getRealLandingImages(salon)
        .filter((image) => image.type === "interior" || image.type === "gallery")
        .slice(0, 3),
    );
  }

  const ignoredIds = getIgnoredImageIds(salon);
  const topIds = new Set(getTopImageIds(salon));
  const logoImageId = normalizedPlan.logoImageId;

  return dedupePublicImages(
    resolvePlanImages(salon, normalizedPlan.spaceImageIds ?? []).filter(
      (image) =>
        image.type !== "logo" &&
        !planIdsIncludeImage(ignoredIds, image) &&
        !planIdsIncludeImage(topIds, image) &&
        !(logoImageId && imageMatchesPlanId(image.id, logoImageId)),
    ),
  );
}

export function getPublicResultImages(salon: Salon) {
  void salon;
  return [];
}

export function getRealReviews(salon: Salon): SalonTestimonial[] {
  return salon.testimonials.filter(
    (review) => review.isReal && review.selectedForLanding,
  );
}

export function getPublicReviewMetrics(salon: Salon): PublicReviewMetrics {
  const reviews = getRealReviews(salon);
  const googleRating =
    typeof salon.googleRating === "number" && Number.isFinite(salon.googleRating)
      ? salon.googleRating
      : undefined;
  const googleReviewCount =
    typeof salon.googleReviewCount === "number" &&
    Number.isFinite(salon.googleReviewCount)
      ? salon.googleReviewCount
      : undefined;

  if (googleRating !== undefined) {
    return {
      averageRating: googleRating,
      reviewCount: googleReviewCount ?? reviews.length,
      source: "google",
    };
  }

  const ratings = reviews
    .map((review) => review.rating)
    .filter((rating): rating is number => Number.isFinite(rating));

  if (!ratings.length) {
    return {
      reviewCount: reviews.length,
      source: "none",
    };
  }

  const averageRating =
    ratings.reduce((total, rating) => total + rating, 0) / ratings.length;

  return {
    averageRating,
    reviewCount: reviews.length,
    source: "testimonials",
  };
}

export function getPublicBenefits(salon: Salon) {
  const text = getPublicText(salon.language);
  const appliedCopy = getAppliedCopy(salon);

  if (appliedCopy?.whyChooseItems.length) {
    return appliedCopy.whyChooseItems;
  }

  const benefits = [...text.benefits];

  if (!salon.location) {
    return benefits.filter((benefit) => benefit.title !== text.benefits[4]?.title);
  }

  return benefits;
}

export function getPublicCta(salon: Salon): PublicCta {
  const text = getPublicText(salon.language);
  const appliedCopy = getAppliedCopy(salon);
  const action = getPrimaryContactAction(salon);

  return {
    href: action.href,
    label: clean(appliedCopy?.ctaButtonLabel) || text.ctaLabel,
    title: clean(appliedCopy?.ctaTitle) || text.ctaTitle,
    text: clean(appliedCopy?.ctaText) || text.ctaText,
    noContactText: text.noContactText,
    external: action.external,
  };
}

export function getPublicHeroCtaLabel(salon: Salon) {
  const text = getPublicText(salon.language);
  const appliedLabel = clean(getAppliedCopy(salon)?.ctaButtonLabel);

  if (appliedLabel) {
    if (salon.language === "pt-BR" && appliedLabel.toLowerCase().includes("agendar")) {
      return text.bookAppointment;
    }

    return appliedLabel;
  }

  return text.bookAppointment;
}

export function getPublicContactLinks(salon: Salon): PublicContactLink[] {
  const googleMapsUrl = clean(salon.googleMapsUrl) || clean(salon.googleBusinessUrl);
  const websiteUrl = clean(salon.websiteUrl);
  const bookingUrl = clean(salon.bookingUrl);
  const whatsappHref = buildWhatsappHref(salon.whatsapp);
  const phoneHref = buildPhoneHref(salon.phone);
  const instagramUrl = clean(salon.instagramUrl);

  return [
    bookingUrl
      ? {
          id: "booking",
          label: getPublicContactLabel("booking", salon.language),
          href: bookingUrl,
          external: true,
          primary: true,
        }
      : null,
    whatsappHref
      ? {
          id: "whatsapp",
          label: getPublicContactLabel("whatsapp", salon.language),
          href: whatsappHref,
          external: true,
          primary: !bookingUrl,
        }
      : null,
    phoneHref
      ? {
          id: "phone",
          label: getPublicContactLabel("phone", salon.language),
          href: phoneHref,
          external: false,
          primary: !bookingUrl && !whatsappHref,
        }
      : null,
    instagramUrl
      ? {
          id: "instagram",
          label: getPublicContactLabel("instagram", salon.language),
          href: instagramUrl,
          external: true,
        }
      : null,
    googleMapsUrl
      ? {
          id: "google",
          label: getPublicContactLabel("google", salon.language),
          href: googleMapsUrl,
          external: true,
        }
      : null,
    websiteUrl
      ? {
          id: "website",
          label: getPublicContactLabel("website", salon.language),
          href: websiteUrl,
          external: true,
        }
      : null,
  ].filter((link): link is PublicContactLink => Boolean(link));
}

export function getPublicContactLabel(
  id: PublicContactLink["id"],
  language: SalonLanguage,
) {
  const labels = {
    "pt-BR": {
      booking: "Agendar online",
      whatsapp: "Chamar no WhatsApp",
      phone: "Ligar agora",
      instagram: "Ver Instagram",
      google: "Abrir no Google Maps",
      website: "Acessar site",
    },
    en: {
      booking: "Book online",
      whatsapp: "Chat on WhatsApp",
      phone: "Call now",
      instagram: "View Instagram",
      google: "Open in Google Maps",
      website: "Visit website",
    },
    es: {
      booking: "Reservar online",
      whatsapp: "Hablar por WhatsApp",
      phone: "Llamar ahora",
      instagram: "Ver Instagram",
      google: "Abrir en Google Maps",
      website: "Visitar sitio web",
    },
    fr: {
      booking: "Reserver en ligne",
      whatsapp: "Parler sur WhatsApp",
      phone: "Appeler maintenant",
      instagram: "Voir Instagram",
      google: "Ouvrir dans Google Maps",
      website: "Voir le site",
    },
    no: {
      booking: "Bestill online",
      whatsapp: "Kontakt via WhatsApp",
      phone: "Ring na",
      instagram: "Se Instagram",
      google: "Aapne i Google Maps",
      website: "Aapne nettside",
    },
  } satisfies Record<
    SalonLanguage,
    Record<PublicContactLink["id"], string>
  >;

  return (labels[language] ?? labels.en)[id];
}

export function shouldShowPublicServices(salon: Salon) {
  const observedServices = clean(salon.extractedBusinessInfo?.observedServices)
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (observedServices?.length) {
    return observedServices.some(hasMeaningfulPublicServiceLabel);
  }

  return salon.services.some((service) =>
    hasMeaningfulPublicServiceLabel(service.title),
  );
}

const genericPublicServiceTitles = new Set([
  "cabelo",
  "hair",
  "hår",
  "cabello",
  "pelo",
  "unhas",
  "nails",
  "uñas",
  "maquiagem",
  "makeup",
  "maquillaje",
  "beauty",
  "beleza",
  "coloracao",
  "coloring",
  "colouring",
  "color",
  "pele",
  "skin",
  "lashes",
  "cilios",
  "cílios",
  "brows",
  "sobrancelhas",
  "eyebrows",
  "spa",
  "facial",
  "facials",
  "wedding",
  "bridal",
  "noivas e eventos",
  "servicio de belleza",
  "servicos de beleza",
  "serviços de beleza",
  "atendimento de beleza",
  "beauty appointment",
  "skjonnhetsbehandling",
  "skjønnhetsbehandling",
]);

function hasMeaningfulPublicServiceLabel(value?: string) {
  const normalizedValue = normalizeText(value ?? "");

  if (!normalizedValue) {
    return false;
  }

  if (genericPublicServiceTitles.has(normalizedValue)) {
    return false;
  }

  const parts = normalizedValue
    .split(/[,&/|+-]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (
    parts.length > 1 &&
    parts.every((part) => genericPublicServiceTitles.has(part))
  ) {
    return false;
  }

  return true;
}

export function getPrimaryContactAction(salon: Salon): PublicContactAction {
  const googleMapsUrl = salon.googleMapsUrl || salon.googleBusinessUrl;
  const href =
    clean(salon.bookingUrl) ||
    buildWhatsappHref(salon.whatsapp) ||
    buildPhoneHref(salon.phone) ||
    clean(salon.instagramUrl) ||
    clean(googleMapsUrl);

  return {
    href,
    external: Boolean(href && href.startsWith("http")),
  };
}

export function buildWhatsappHref(whatsapp?: string) {
  if (!whatsapp) {
    return undefined;
  }

  const digits = whatsapp.replace(/\D/g, "");

  return digits ? `https://wa.me/${digits}` : buildPhoneHref(whatsapp);
}

function buildPhoneHref(phone?: string) {
  if (!phone) {
    return undefined;
  }

  return `tel:${phone.replace(/\s/g, "")}`;
}

function classifyService(service: string): PublicServiceKey {
  const normalized = normalizeText(service);

  if (containsAny(normalized, ["color", "colora", "tintura", "luzes", "mechas"])) {
    return "color";
  }

  if (
    containsAny(normalized, [
      "unha",
      "una",
      "nail",
      "manicure",
      "pedicure",
      "manicura",
      "pedicura",
      "manikyr",
      "pedikyr",
      "negl",
    ])
  ) {
    return "nails";
  }

  if (
    containsAny(normalized, ["makeup", "maquiagem", "maquillaje", "sminke"])
  ) {
    return "makeup";
  }

  if (containsAny(normalized, ["sobrancelha", "brow", "ceja"])) {
    return "brows";
  }

  if (containsAny(normalized, ["pele", "skin", "facial", "rosto"])) {
    return "skin";
  }

  if (containsAny(normalized, ["noiva", "bridal", "event", "evento"])) {
    return "bridal";
  }

  if (containsAny(normalized, ["cilio", "lash", "pestana"])) {
    return "lashes";
  }

  if (containsAny(normalized, ["depil", "wax"])) {
    return "waxing";
  }

  if (
    containsAny(normalized, [
      "cabelo",
      "hair",
      "corte",
      "escova",
      "styling",
      "har",
      "klipp",
    ])
  ) {
    return "hair";
  }

  return "generic";
}

function containsAny(value: string, candidates: string[]) {
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function joinList(items: string[], language: SalonLanguage) {
  const filteredItems = items.filter(Boolean);

  if (!filteredItems.length) {
    return "";
  }

  if (filteredItems.length === 1) {
    return capitalize(filteredItems[0]);
  }

  const conjunction = language === "en" ? "and" : language === "no" ? "og" : "e";
  const [firstItem, ...remainingItems] = filteredItems;
  const lastItem = remainingItems.pop();
  const middleItems = remainingItems.length ? `, ${remainingItems.join(", ")}` : "";

  return `${capitalize(firstItem)}${middleItems} ${conjunction} ${lastItem}`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clean(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}
