import {
  getPrimaryContactAction,
  getPublicServices,
  getPublicServiceSummary,
} from "@/lib/public-landing";
import type {
  Salon,
  SalonCopySuggestion,
  SalonLanguage,
  SalonReadinessItem,
  SalonReadinessScore,
  SalonService,
  SalonServiceCopy,
  SalonWhyChooseItem,
} from "@/types/salon";

type CopyDictionary = {
  headlineWithLocation: (services: string, location: string) => string;
  headlineWithoutLocation: (services: string) => string;
  subheadline: (services: string) => string;
  aboutTitle: string;
  aboutWithLocation: (name: string, location: string, description?: string) => string;
  aboutWithoutLocation: (name: string, description?: string) => string;
  servicesIntroTitle: string;
  servicesIntroText: (services: string) => string;
  whyChooseTitle: string;
  whyChooseItems: SalonWhyChooseItem[];
  ctaTitle: string;
  ctaText: string;
  ctaButtonLabel: string;
  seoTitle: (name: string, location?: string) => string;
  seoDescription: (name: string, services: string, location?: string) => string;
  prospectingMessage: (name: string) => string;
  businessSummary: (name: string, services: string, location?: string) => string;
  fallbackServiceSummary: string;
};

const copyByLanguage: Record<SalonLanguage, CopyDictionary> = {
  "pt-BR": {
    headlineWithLocation: (services, location) =>
      `${services} com cuidado e praticidade em ${location}`,
    headlineWithoutLocation: (services) =>
      `${services} com cuidado, beleza e praticidade`,
    subheadline: (services) =>
      `${services} em um atendimento pensado para realçar sua beleza com praticidade.`,
    aboutTitle: "Sobre o salão",
    aboutWithLocation: (name, location, description) =>
      `Localizado em ${location}, o ${name} oferece atendimentos de beleza para quem busca cuidado, bom gosto e praticidade.${description ? ` ${refineDescription(description)}` : ""}`,
    aboutWithoutLocation: (name, description) =>
      `${name} oferece atendimentos de beleza para quem busca cuidado, bom gosto e praticidade.${description ? ` ${refineDescription(description)}` : ""}`,
    servicesIntroTitle: "Serviços para cuidar da sua beleza",
    servicesIntroText: (services) =>
      `${services} e outros cuidados para valorizar seu estilo com atenção aos detalhes.`,
    whyChooseTitle: "Por que escolher este salão",
    whyChooseItems: [
      {
        title: "Atendimento personalizado",
        description:
          "Cada atendimento pode ser ajustado ao estilo, à rotina e ao resultado desejado pela cliente.",
      },
      {
        title: "Serviços para rotina e ocasiões especiais",
        description:
          "Opções para o dia a dia, eventos, fotos e momentos em que a beleza precisa acompanhar a ocasião.",
      },
      {
        title: "Facilidade para agendar",
        description:
          "Canais de contato claros ajudam a escolher o melhor horário para o atendimento.",
      },
      {
        title: "Cuidado com os detalhes",
        description:
          "Foco em acabamento, organização e uma experiência mais confortável do início ao fim.",
      },
    ],
    ctaTitle: "Agende seu horário",
    ctaText:
      "Fale com o salão e escolha o melhor horário para o seu atendimento.",
    ctaButtonLabel: "Agendar agora",
    seoTitle: (name, location) =>
      location ? `${name} | Salão de beleza em ${location}` : `${name} | Salão de beleza`,
    seoDescription: (name, services, location) =>
      `${name}${location ? ` em ${location}` : ""}: ${lowerFirst(services)} com atendimento personalizado e canais simples para agendar.`,
    prospectingMessage: (name) =>
      `Olá! Criei uma prévia de uma landing page para o ${name}, pensada para apresentar melhor os serviços, facilitar o agendamento e valorizar a presença online do salão. Posso te enviar o link para você ver como ficou?`,
    businessSummary: (name, services, location) =>
      `${name}${location ? ` em ${location}` : ""} oferece ${lowerFirst(services)} com foco em cuidado, praticidade e apresentação profissional online.`,
    fallbackServiceSummary: "Serviços de beleza",
  },
  en: {
    headlineWithLocation: (services, location) =>
      `${services} with thoughtful care in ${location}`,
    headlineWithoutLocation: (services) =>
      `${services} with care, polish, and ease`,
    subheadline: (services) =>
      `${services} designed to support everyday beauty, special occasions, and easier booking.`,
    aboutTitle: "About the salon",
    aboutWithLocation: (name, location, description) =>
      `Located in ${location}, ${name} offers beauty services for clients looking for care, polish, and practical booking.${description ? ` ${refineDescription(description)}` : ""}`,
    aboutWithoutLocation: (name, description) =>
      `${name} offers beauty services for clients looking for care, polish, and practical booking.${description ? ` ${refineDescription(description)}` : ""}`,
    servicesIntroTitle: "Beauty services for routine and special moments",
    servicesIntroText: (services) =>
      `Explore ${lowerFirst(services)} and other beauty services shaped around your routine and desired result.`,
    whyChooseTitle: "Why choose this salon",
    whyChooseItems: [
      {
        title: "Personalized service",
        description:
          "Appointments can be shaped around each client's style, routine, and desired result.",
      },
      {
        title: "Routine and event beauty",
        description:
          "Services for everyday care, photos, special occasions, and important moments.",
      },
      {
        title: "Easy booking",
        description:
          "Clear contact options make it easier to choose the best appointment time.",
      },
      {
        title: "Attention to detail",
        description:
          "A focus on finish, organization, and a more comfortable appointment experience.",
      },
    ],
    ctaTitle: "Book your appointment",
    ctaText: "Contact the salon and choose the best time for your visit.",
    ctaButtonLabel: "Book now",
    seoTitle: (name, location) =>
      location ? `${name} | Beauty salon in ${location}` : `${name} | Beauty salon`,
    seoDescription: (name, services, location) =>
      `${name}${location ? ` in ${location}` : ""}: ${lowerFirst(services)} with personalized service and simple booking options.`,
    prospectingMessage: (name) =>
      `Hi! I created a quick landing page preview for ${name}, designed to present the services more clearly and make bookings easier. Would you like me to send you the preview link?`,
    businessSummary: (name, services, location) =>
      `${name}${location ? ` in ${location}` : ""} offers ${lowerFirst(services)} with a focus on care, practicality, and a more polished online presentation.`,
    fallbackServiceSummary: "Beauty services",
  },
  es: {
    headlineWithLocation: (services, location) =>
      `${services} con cuidado y practicidad en ${location}`,
    headlineWithoutLocation: (services) =>
      `${services} con cuidado, belleza y practicidad`,
    subheadline: (services) =>
      `${services} con una atención pensada para la rutina, eventos y momentos especiales.`,
    aboutTitle: "Sobre el salón",
    aboutWithLocation: (name, location, description) =>
      `Ubicado en ${location}, ${name} ofrece servicios de belleza para quienes buscan cuidado, buen gusto y practicidad.${description ? ` ${refineDescription(description)}` : ""}`,
    aboutWithoutLocation: (name, description) =>
      `${name} ofrece servicios de belleza para quienes buscan cuidado, buen gusto y practicidad.${description ? ` ${refineDescription(description)}` : ""}`,
    servicesIntroTitle: "Servicios de belleza para rutina y ocasiones especiales",
    servicesIntroText: (services) =>
      `Elige entre ${lowerFirst(services)} y otros cuidados para realzar tu estilo con atención al detalle.`,
    whyChooseTitle: "Por qué elegir este salón",
    whyChooseItems: [
      {
        title: "Atención personalizada",
        description:
          "Cada servicio puede adaptarse al estilo, la rutina y el resultado deseado por la clienta.",
      },
      {
        title: "Servicios para rutina y eventos",
        description:
          "Opciones para el día a día, fotos, ocasiones especiales y momentos importantes.",
      },
      {
        title: "Reserva sencilla",
        description:
          "Canales de contacto claros ayudan a elegir el mejor horario de atención.",
      },
      {
        title: "Cuidado en los detalles",
        description:
          "Foco en acabado, organización y una experiencia más cómoda de principio a fin.",
      },
    ],
    ctaTitle: "Reserva tu cita",
    ctaText: "Habla con el salón y elige el mejor horario para tu atención.",
    ctaButtonLabel: "Reservar ahora",
    seoTitle: (name, location) =>
      location ? `${name} | Salón de belleza en ${location}` : `${name} | Salón de belleza`,
    seoDescription: (name, services, location) =>
      `${name}${location ? ` en ${location}` : ""}: ${lowerFirst(services)} con atención personalizada y canales simples para reservar.`,
    prospectingMessage: (name) =>
      `Hola! Creé una vista previa de una landing page para ${name}, pensada para presentar mejor los servicios y facilitar las reservas. ¿Quieres que te envíe el enlace para verla?`,
    businessSummary: (name, services, location) =>
      `${name}${location ? ` en ${location}` : ""} ofrece ${lowerFirst(services)} con foco en cuidado, practicidad y una presencia online más clara.`,
    fallbackServiceSummary: "Servicios de belleza",
  },
  fr: {
    headlineWithLocation: (services, location) =>
      `${services} avec soin et simplicité à ${location}`,
    headlineWithoutLocation: (services) =>
      `${services} avec soin, beauté et simplicité`,
    subheadline: (services) =>
      `${services} pensés pour la routine, les événements et les moments importants.`,
    aboutTitle: "À propos du salon",
    aboutWithLocation: (name, location, description) =>
      `Situé à ${location}, ${name} propose des services beauté axés sur le soin, le goût et la praticité.${description ? ` ${refineDescription(description)}` : ""}`,
    aboutWithoutLocation: (name, description) =>
      `${name} propose des services beauté axés sur le soin, le goût et la praticité.${description ? ` ${refineDescription(description)}` : ""}`,
    servicesIntroTitle: "Services beauté pour la routine et les occasions spéciales",
    servicesIntroText: (services) =>
      `Découvrez ${lowerFirst(services)} et d'autres soins pensés pour votre style.`,
    whyChooseTitle: "Pourquoi choisir ce salon",
    whyChooseItems: [
      {
        title: "Service personnalisé",
        description:
          "Chaque rendez-vous peut être adapté au style, à la routine et au résultat souhaité.",
      },
      {
        title: "Beauté du quotidien et événements",
        description:
          "Des options pour la routine, les photos, les occasions spéciales et les moments importants.",
      },
      {
        title: "Prise de contact simple",
        description:
          "Des canaux clairs pour choisir le meilleur horaire de rendez-vous.",
      },
      {
        title: "Attention aux détails",
        description:
          "Un soin particulier porté à la finition, à l'organisation et au confort.",
      },
    ],
    ctaTitle: "Réservez votre rendez-vous",
    ctaText: "Contactez le salon et choisissez l'horaire qui vous convient.",
    ctaButtonLabel: "Réserver",
    seoTitle: (name, location) =>
      location ? `${name} | Salon de beauté à ${location}` : `${name} | Salon de beauté`,
    seoDescription: (name, services, location) =>
      `${name}${location ? ` à ${location}` : ""}: ${lowerFirst(services)} avec service personnalisé et réservation simple.`,
    prospectingMessage: (name) =>
      `Bonjour! J'ai créé un aperçu de landing page pour ${name}, pensé pour mieux présenter les services et faciliter les réservations. Voulez-vous que je vous envoie le lien?`,
    businessSummary: (name, services, location) =>
      `${name}${location ? ` à ${location}` : ""} propose ${lowerFirst(services)} avec une présence en ligne plus claire.`,
    fallbackServiceSummary: "Services beauté",
  },
  no: {
    headlineWithLocation: (services, location) =>
      `${services} med omtanke og enkel booking i ${location}`,
    headlineWithoutLocation: (services) =>
      `${services} med omtanke, kvalitet og enkel booking`,
    subheadline: (services) =>
      `${services} tilpasset hverdagspleie, spesielle anledninger og en enklere bookingopplevelse.`,
    aboutTitle: "Om salongen",
    aboutWithLocation: (name, location, description) =>
      `${name} ligger i ${location} og tilbyr skjønnhetstjenester for kunder som ønsker omsorg, god smak og praktiske løsninger.${description ? ` ${refineDescription(description)}` : ""}`,
    aboutWithoutLocation: (name, description) =>
      `${name} tilbyr skjønnhetstjenester for kunder som ønsker omsorg, god smak og praktiske løsninger.${description ? ` ${refineDescription(description)}` : ""}`,
    servicesIntroTitle: "Skjønnhetstjenester for hverdag og spesielle anledninger",
    servicesIntroText: (services) =>
      `Velg mellom ${lowerFirst(services)} og andre behandlinger med fokus på stil og detaljer.`,
    whyChooseTitle: "Hvorfor velge denne salongen",
    whyChooseItems: [
      {
        title: "Personlig service",
        description:
          "Behandlingen kan tilpasses kundens stil, rutine og ønskede resultat.",
      },
      {
        title: "Tjenester for hverdag og eventer",
        description:
          "Alternativer for hverdagspleie, bilder, spesielle anledninger og viktige øyeblikk.",
      },
      {
        title: "Enkel booking",
        description:
          "Tydelige kontaktmuligheter gjør det enklere å velge riktig tidspunkt.",
      },
      {
        title: "Fokus på detaljer",
        description:
          "Vekt på finish, organisering og en mer behagelig opplevelse.",
      },
    ],
    ctaTitle: "Bestill time",
    ctaText: "Kontakt salongen og velg tidspunktet som passer best.",
    ctaButtonLabel: "Bestill nå",
    seoTitle: (name, location) =>
      location ? `${name} | Skjønnhetssalong i ${location}` : `${name} | Skjønnhetssalong`,
    seoDescription: (name, services, location) =>
      `${name}${location ? ` i ${location}` : ""}: ${lowerFirst(services)} med personlig service og enkel booking.`,
    prospectingMessage: (name) =>
      `Hei! Jeg har laget en rask landingsside-preview for ${name}, laget for å presentere tjenestene tydeligere og gjøre booking enklere. Vil du at jeg sender deg lenken?`,
    businessSummary: (name, services, location) =>
      `${name}${location ? ` i ${location}` : ""} tilbyr ${lowerFirst(services)} med fokus på omsorg, praktiske løsninger og en tydeligere online presentasjon.`,
    fallbackServiceSummary: "Skjønnhetstjenester",
  },
};

export function generateAssistedCopy(salon: Salon): SalonCopySuggestion {
  const language = salon.language ?? salon.landingLanguage ?? "en";
  const dictionary = copyByLanguage[language] ?? copyByLanguage.en;
  const serviceCopies = buildServiceCopies(salon.services, language);
  const serviceSummary =
    getPublicServiceSummary(
      serviceCopies.map((service) => ({
        id: service.serviceId,
        title: service.title,
        description: service.description,
      })),
      language,
    ) || dictionary.fallbackServiceSummary;
  const naturalServiceSummary = getNaturalServiceSummary(
    serviceCopies,
    serviceSummary,
    language,
  );
  const headline = salon.location
    ? dictionary.headlineWithLocation(naturalServiceSummary, salon.location)
    : dictionary.headlineWithoutLocation(naturalServiceSummary);
  const descriptionForCopy =
    language === "pt-BR" ? salon.description : "";
  const aboutText = salon.location
    ? dictionary.aboutWithLocation(salon.name, salon.location, descriptionForCopy)
    : dictionary.aboutWithoutLocation(salon.name, descriptionForCopy);

  return {
    id: createCopyId(),
    headline,
    subheadline: dictionary.subheadline(naturalServiceSummary),
    aboutTitle: dictionary.aboutTitle,
    aboutText,
    servicesIntroTitle: dictionary.servicesIntroTitle,
    servicesIntroText: dictionary.servicesIntroText(naturalServiceSummary),
    serviceDescriptions: serviceCopies,
    whyChooseTitle: dictionary.whyChooseTitle,
    whyChooseItems: buildWhyChooseItems(dictionary.whyChooseItems, salon),
    ctaTitle: dictionary.ctaTitle,
    ctaText: dictionary.ctaText,
    ctaButtonLabel: dictionary.ctaButtonLabel,
    seoTitle: dictionary.seoTitle(salon.name, salon.location),
    seoDescription: dictionary.seoDescription(
      salon.name,
      naturalServiceSummary,
      salon.location,
    ),
    prospectingMessage: dictionary.prospectingMessage(salon.name),
    businessSummary: dictionary.businessSummary(
      salon.name,
      naturalServiceSummary,
      salon.location,
    ),
    generatedAt: new Date().toISOString(),
    language,
    source: "assisted",
    status: "draft",
  };
}

export function calculateLandingReadiness(salon: Salon): SalonReadinessScore {
  const hasContact = Boolean(getPrimaryContactAction(salon).href);
  const hasAppliedCopy = Boolean(
    salon.generatedCopy?.status === "applied" ||
      salon.copySuggestions?.status === "applied" ||
      salon.generatedCopyStatus === "reviewed",
  );
  const items: SalonReadinessItem[] = [
    {
      id: "name",
      label: "Nome do salão",
      ok: Boolean(salon.name),
      help: "Informe o nome comercial do salão.",
    },
    {
      id: "location",
      label: "Localização",
      ok: Boolean(salon.location),
      help: "Adicione bairro, cidade ou localização exibida.",
    },
    {
      id: "services",
      label: "Serviços",
      ok: salon.services.length > 0,
      help: "Selecione pelo menos um serviço.",
    },
    {
      id: "contact",
      label: "Contato ou agendamento",
      ok: hasContact,
      help: "Adicione booking, WhatsApp, telefone, Instagram ou Google Maps.",
    },
    {
      id: "copy",
      label: "Textos comerciais",
      ok: hasAppliedCopy || Boolean(salon.headline && salon.aboutText),
      help: "Gere e aplique sugestões de copy para deixar a landing mais comercial.",
    },
    {
      id: "cta",
      label: "CTA funcionando",
      ok: hasContact,
      help: "O botão principal precisa apontar para um canal real.",
    },
    {
      id: "language",
      label: "Idioma definido",
      ok: Boolean(salon.language),
      help: "Escolha o idioma da landing.",
    },
    {
      id: "images",
      label: "Fotos reais",
      ok: salon.hasRealImages,
      help: "Adicione pelo menos uma foto real antes de publicar.",
    },
    {
      id: "reviews",
      label: "Reviews reais",
      ok: salon.hasRealReviews,
      help: "Adicione reviews reais quando estiverem disponíveis.",
    },
  ];
  const score = Math.round(
    (items.filter((item) => item.ok).length / items.length) * 100,
  );

  return { score, items };
}

export function applyCopySuggestionToServices(
  services: SalonService[],
  suggestion: SalonCopySuggestion,
) {
  return services.map((service) => {
    const serviceCopy = suggestion.serviceDescriptions.find(
      (copy) =>
        copy.serviceId === service.id ||
        normalizeText(copy.originalTitle) === normalizeText(service.title),
    );

    if (!serviceCopy) {
      return service;
    }

    return {
      ...service,
      title: service.title ?? serviceCopy.title,
      description: service.description ?? serviceCopy.description,
    };
  });
}

function buildServiceCopies(
  services: SalonService[],
  language: SalonLanguage,
): SalonServiceCopy[] {
  const publicServices = getPublicServices(services, language);
  const sourceServices = services.length
    ? services
    : [{ id: "generic", title: "beauty", description: "" }];

  return publicServices.map((publicService, index) => {
    const original = sourceServices[index] ?? sourceServices[0];

    return {
      serviceId: original.id || publicService.id,
      originalTitle: original.title || publicService.title,
      title: publicService.title,
      description: publicService.description ?? "",
    };
  });
}

function getNaturalServiceSummary(
  serviceCopies: SalonServiceCopy[],
  fallback: string,
  language: SalonLanguage,
) {
  if (language !== "pt-BR") {
    return fallback;
  }

  const normalizedServices = normalizeText(
    serviceCopies
      .map((service) => `${service.originalTitle} ${service.title}`)
      .join(" "),
  );
  const hasHair = containsAny(normalizedServices, [
    "cabelo",
    "cortes",
    "escovas",
    "hair",
    "styling",
  ]);
  const hasNails = containsAny(normalizedServices, [
    "unha",
    "unhas",
    "manicure",
    "pedicure",
    "nail",
    "nails",
  ]);
  const hasMakeup = containsAny(normalizedServices, [
    "maquiagem",
    "makeup",
    "make up",
  ]);

  if (hasHair && hasNails && hasMakeup) {
    return "Cabelo, unhas e maquiagem";
  }

  if (hasHair && hasNails) {
    return "Cabelo e unhas";
  }

  if (hasHair && hasMakeup) {
    return "Cabelo e maquiagem";
  }

  if (hasNails && hasMakeup) {
    return "Unhas e maquiagem";
  }

  return fallback;
}

function buildWhyChooseItems(
  defaultItems: SalonWhyChooseItem[],
  salon: Salon,
) {
  const items = [...defaultItems];

  if (salon.language === "pt-BR" && salon.extractedBusinessInfo.differentiators) {
    items.unshift({
      title: titleFromNotes(salon.extractedBusinessInfo.differentiators),
      description: salon.extractedBusinessInfo.differentiators,
    });
  }

  if (salon.hasRealImages) {
    items.push({
      title:
        salon.language === "en"
          ? "Real salon visuals"
          : salon.language === "es"
            ? "Fotos reales del salón"
            : salon.language === "no"
              ? "Ekte bilder fra salongen"
              : "Fotos reais do salão",
      description:
        salon.language === "en"
          ? "Selected images help show the salon atmosphere and services without relying on generic visuals."
          : salon.language === "es"
            ? "Las imágenes seleccionadas ayudan a mostrar el ambiente y los servicios sin depender de fotos genéricas."
            : salon.language === "no"
              ? "Utvalgte bilder viser salongens atmosfære og tjenester uten generiske bilder."
              : "As imagens selecionadas ajudam a mostrar o ambiente e os serviços sem depender de fotos genéricas.",
    });
  }

  if (salon.hasRealReviews) {
    items.push({
      title:
        salon.language === "en"
          ? "Real client feedback"
          : salon.language === "es"
            ? "Opiniones reales de clientes"
            : salon.language === "no"
              ? "Ekte tilbakemeldinger"
              : "Avaliações reais de clientes",
      description:
        salon.language === "en"
          ? "Real reviews can support trust while keeping the page grounded in verified feedback."
          : salon.language === "es"
            ? "Las reseñas reales ayudan a generar confianza con comentarios verificados."
            : salon.language === "no"
              ? "Ekte anmeldelser kan bygge tillit med verifiserte tilbakemeldinger."
              : "Reviews reais ajudam a reforçar confiança sem inventar prova social.",
    });
  }

  return dedupeItems(items).slice(0, 5);
}

function dedupeItems(items: SalonWhyChooseItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normalizeText(item.title);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function titleFromNotes(notes: string) {
  const firstSentence = notes.split(/[.!?]/)[0]?.trim();

  if (!firstSentence) {
    return "Diferencial do salão";
  }

  return firstSentence.length > 54
    ? `${firstSentence.slice(0, 51).trim()}...`
    : firstSentence;
}

function refineDescription(description: string) {
  const cleanDescription = description.trim();

  if (!cleanDescription) {
    return "";
  }

  return cleanDescription.endsWith(".") ? cleanDescription : `${cleanDescription}.`;
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function containsAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function createCopyId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `copy-${crypto.randomUUID()}`;
  }

  return `copy-${Date.now().toString(36)}`;
}
