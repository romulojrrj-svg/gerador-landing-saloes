import type { SalonLanguage } from "@/types/salon";

export type LandingCopy = {
  languageLabel: string;
  bookAppointment: string;
  exploreServices: string;
  requestBooking: string;
  messageWhatsapp: string;
  contactSalon: string;
  privateBooking: string;
  consultationWindow: string;
  seniorArtistMatch: string;
  included: string;
  appointments: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesDescription: string;
  galleryEyebrow: string;
  galleryRealTitle: (location?: string) => string;
  galleryRealDescription: (salonName?: string) => string;
  galleryPlaceholderTitle: string;
  galleryPlaceholderDescription: string;
  reviewsEyebrow: string;
  reviewsTitle: string;
  reviewsDescription: string;
  whyChooseEyebrow: string;
  whyChooseTitle: string;
  whyChooseDescription: string;
  whyChooseItems: string[];
  openingHours: string;
  contact: string;
  callNow: string;
  visitInstagram: string;
  openGoogleMaps: string;
  booking: string;
  website: string;
  googleProfile: string;
  socialProfile: string;
  mapsProfile: string;
  profileDetails: string;
  previewSlug: string;
  location: string;
  landingLanguage: string;
  visualDirection: string;
  clientRating: string;
  publicNotFoundTitle: string;
  publicNotFoundText: string;
  backToPanel: string;
  loadingTitle: string;
  loadingText: string;
};

const copy: Record<SalonLanguage, LandingCopy> = {
  "pt-BR": {
    languageLabel: "Português do Brasil",
    bookAppointment: "Agendar horário",
    exploreServices: "Ver serviços",
    requestBooking: "Solicitar agendamento",
    messageWhatsapp: "Chamar no WhatsApp",
    contactSalon: "Falar com o salão",
    privateBooking: "Agendamento",
    consultationWindow: "Tempo de consulta",
    seniorArtistMatch: "Atendimento especialista",
    included: "Incluído",
    appointments: "Horários",
    servicesEyebrow: "Serviços",
    servicesTitle: "Serviços pensados para beleza, rotina e ocasiões especiais.",
    servicesDescription:
      "Cada atendimento começa com uma consulta clara, seguida por uma recomendação alinhada ao objetivo, estilo de vida e agenda da cliente.",
    galleryEyebrow: "Galeria",
    galleryRealTitle: (location) =>
      location
        ? `Fotos selecionadas do salão em ${location}.`
        : "Fotos selecionadas do salão.",
    galleryRealDescription: (salonName) =>
      salonName
        ? `${salonName} apresenta fotos reais selecionadas para comunicar ambiente, serviços e resultados.`
        : "Imagens reais selecionadas para a landing.",
    galleryPlaceholderTitle: "Direção visual preparada para a landing.",
    galleryPlaceholderDescription:
      "As imagens abaixo são referências visuais para comunicar a atmosfera desejada, sem afirmar que são fotos reais do salão.",
    reviewsEyebrow: "Reviews",
    reviewsTitle: "Avaliações reais de clientes.",
    reviewsDescription:
      "Reviews exibidos aqui devem vir de fonte autorizada, como Google, ou ser inseridos manualmente como depoimentos reais.",
    whyChooseEyebrow: "Diferenciais",
    whyChooseTitle: "Por que escolher este salão",
    whyChooseDescription:
      "Uma seção objetiva para destacar diferenciais comerciais sem apresentar depoimentos inventados.",
    whyChooseItems: [
      "Atendimento pensado para o perfil e objetivo de cada cliente.",
      "Serviços organizados para facilitar decisão e agendamento.",
      "Página preparada para receber fotos e reviews reais nas próximas etapas.",
    ],
    openingHours: "Horários",
    contact: "Contato",
    callNow: "Ligar agora",
    visitInstagram: "Ver Instagram",
    openGoogleMaps: "Abrir Google Maps",
    booking: "Agendamento",
    website: "Site",
    googleProfile: "Perfil no Google",
    socialProfile: "Perfil social",
    mapsProfile: "Mapa e perfil da empresa",
    profileDetails: "Detalhes do perfil",
    previewSlug: "Slug da prévia",
    location: "Localização",
    landingLanguage: "Idioma da landing",
    visualDirection: "Direção visual",
    clientRating: "Avaliação de clientes",
    publicNotFoundTitle: "Página não encontrada",
    publicNotFoundText: "Esta página não está disponível.",
    backToPanel: "Voltar ao painel",
    loadingTitle: "Preparando a landing",
    loadingText: "Carregando a página salva neste navegador.",
  },
  en: {
    languageLabel: "English",
    bookAppointment: "Book appointment",
    exploreServices: "Explore services",
    requestBooking: "Request booking",
    messageWhatsapp: "Message on WhatsApp",
    contactSalon: "Contact the salon",
    privateBooking: "Private booking",
    consultationWindow: "Consultation window",
    seniorArtistMatch: "Senior artist match",
    included: "Included",
    appointments: "Appointments",
    servicesEyebrow: "Services",
    servicesTitle: "Considered services for beauty, lifestyle, and special occasions.",
    servicesDescription:
      "Each appointment starts with a clear consultation, then moves through a recommendation shaped around goals, routine, and timing.",
    galleryEyebrow: "Gallery",
    galleryRealTitle: (location) =>
      location ? `Selected salon photos from ${location}.` : "Selected salon photos.",
    galleryRealDescription: (salonName) =>
      salonName
        ? `${salonName} uses real selected imagery to communicate atmosphere, services, and results.`
        : "Real images selected for the landing page.",
    galleryPlaceholderTitle: "Visual direction prepared for this landing.",
    galleryPlaceholderDescription:
      "These are visual references for the desired atmosphere, without claiming they are real salon photos.",
    reviewsEyebrow: "Reviews",
    reviewsTitle: "Real client reviews.",
    reviewsDescription:
      "Reviews shown here should come from an authorized source such as Google, or be manually entered as real testimonials.",
    whyChooseEyebrow: "Why choose",
    whyChooseTitle: "Why choose this salon",
    whyChooseDescription:
      "A clear section for commercial reasons, without presenting invented testimonials.",
    whyChooseItems: [
      "A service experience shaped around each client's goals.",
      "A clear service menu that makes booking easier.",
      "Prepared to receive real photos and reviews in the next product stage.",
    ],
    openingHours: "Opening hours",
    contact: "Contact",
    callNow: "Call now",
    visitInstagram: "Visit Instagram",
    openGoogleMaps: "Open Google Maps",
    booking: "Booking",
    website: "Website",
    googleProfile: "Google profile",
    socialProfile: "Social profile",
    mapsProfile: "Maps and business profile",
    profileDetails: "Profile details",
    previewSlug: "Preview slug",
    location: "Location",
    landingLanguage: "Landing language",
    visualDirection: "Visual direction",
    clientRating: "Client rating",
    publicNotFoundTitle: "Page not found",
    publicNotFoundText: "This page is not available.",
    backToPanel: "Back to dashboard",
    loadingTitle: "Preparing the landing",
    loadingText: "Loading the page saved in this browser.",
  },
  es: {
    languageLabel: "Español",
    bookAppointment: "Reservar cita",
    exploreServices: "Ver servicios",
    requestBooking: "Solicitar reserva",
    messageWhatsapp: "Enviar WhatsApp",
    contactSalon: "Contactar el salón",
    privateBooking: "Reserva",
    consultationWindow: "Tiempo de consulta",
    seniorArtistMatch: "Especialista asignado",
    included: "Incluido",
    appointments: "Horarios",
    servicesEyebrow: "Servicios",
    servicesTitle: "Servicios pensados para belleza, rutina y ocasiones especiales.",
    servicesDescription:
      "Cada cita empieza con una consulta clara y continúa con una recomendación alineada con objetivos, rutina y calendario.",
    galleryEyebrow: "Galería",
    galleryRealTitle: (location) =>
      location ? `Fotos seleccionadas del salón en ${location}.` : "Fotos seleccionadas del salón.",
    galleryRealDescription: (salonName) =>
      salonName
        ? `${salonName} presenta fotos reales seleccionadas para comunicar ambiente, servicios y resultados.`
        : "Imágenes reales seleccionadas para la landing.",
    galleryPlaceholderTitle: "Dirección visual preparada para esta landing.",
    galleryPlaceholderDescription:
      "Estas imágenes son referencias visuales para expresar la atmósfera deseada, sin afirmar que son fotos reales del salón.",
    reviewsEyebrow: "Reseñas",
    reviewsTitle: "Reseñas reales de clientes.",
    reviewsDescription:
      "Las reseñas mostradas deben venir de una fuente autorizada, como Google, o ser insertadas manualmente como testimonios reales.",
    whyChooseEyebrow: "Diferenciales",
    whyChooseTitle: "Por qué elegir este salón",
    whyChooseDescription:
      "Una sección clara para destacar razones comerciales sin presentar testimonios inventados.",
    whyChooseItems: [
      "Atención pensada para los objetivos de cada cliente.",
      "Servicios claros para facilitar la decisión y la reserva.",
      "Preparada para recibir fotos y reseñas reales en la próxima etapa.",
    ],
    openingHours: "Horarios",
    contact: "Contacto",
    callNow: "Llamar ahora",
    visitInstagram: "Ver Instagram",
    openGoogleMaps: "Abrir Google Maps",
    booking: "Reserva",
    website: "Sitio web",
    googleProfile: "Perfil de Google",
    socialProfile: "Perfil social",
    mapsProfile: "Mapa y perfil de empresa",
    profileDetails: "Detalles del perfil",
    previewSlug: "Slug de vista previa",
    location: "Ubicación",
    landingLanguage: "Idioma de la landing",
    visualDirection: "Dirección visual",
    clientRating: "Valoración de clientes",
    publicNotFoundTitle: "Página no encontrada",
    publicNotFoundText:
      "Esta landing aún no fue publicada o solo está disponible en el navegador donde se creó.",
    backToPanel: "Volver al panel",
    loadingTitle: "Preparando la landing",
    loadingText: "Cargando la página guardada en este navegador.",
  },
  fr: {
    languageLabel: "Français",
    bookAppointment: "Prendre rendez-vous",
    exploreServices: "Voir les services",
    requestBooking: "Demander une réservation",
    messageWhatsapp: "Envoyer un WhatsApp",
    contactSalon: "Contacter le salon",
    privateBooking: "Réservation",
    consultationWindow: "Temps de consultation",
    seniorArtistMatch: "Expert associé",
    included: "Inclus",
    appointments: "Horaires",
    servicesEyebrow: "Services",
    servicesTitle: "Des services pensés pour la beauté, le quotidien et les occasions.",
    servicesDescription:
      "Chaque rendez-vous commence par une consultation claire, puis une recommandation adaptée aux objectifs, au rythme et au calendrier.",
    galleryEyebrow: "Galerie",
    galleryRealTitle: (location) =>
      location ? `Photos sélectionnées du salon à ${location}.` : "Photos sélectionnées du salon.",
    galleryRealDescription: (salonName) =>
      salonName
        ? `${salonName} présente des images réelles sélectionnées pour communiquer l'atmosphère, les services et les résultats.`
        : "Images réelles sélectionnées pour la landing.",
    galleryPlaceholderTitle: "Direction visuelle préparée pour cette landing.",
    galleryPlaceholderDescription:
      "Ces images sont des références visuelles pour exprimer l'atmosphère souhaitée, sans affirmer qu'il s'agit de vraies photos du salon.",
    reviewsEyebrow: "Avis",
    reviewsTitle: "Avis clients réels.",
    reviewsDescription:
      "Les avis affichés doivent provenir d'une source autorisée, comme Google, ou être saisis manuellement comme témoignages réels.",
    whyChooseEyebrow: "Pourquoi choisir",
    whyChooseTitle: "Pourquoi choisir ce salon",
    whyChooseDescription:
      "Une section claire pour présenter des raisons commerciales sans inventer de témoignages.",
    whyChooseItems: [
      "Une expérience adaptée aux objectifs de chaque client.",
      "Une offre de services claire pour faciliter la réservation.",
      "Prête à recevoir des photos et avis réels dans la prochaine étape.",
    ],
    openingHours: "Horaires",
    contact: "Contact",
    callNow: "Appeler",
    visitInstagram: "Voir Instagram",
    openGoogleMaps: "Ouvrir Google Maps",
    booking: "Réservation",
    website: "Site web",
    googleProfile: "Profil Google",
    socialProfile: "Profil social",
    mapsProfile: "Carte et profil d'entreprise",
    profileDetails: "Détails du profil",
    previewSlug: "Slug de prévisualisation",
    location: "Localisation",
    landingLanguage: "Langue de la landing",
    visualDirection: "Direction visuelle",
    clientRating: "Avis clients",
    publicNotFoundTitle: "Page introuvable",
    publicNotFoundText:
      "Cette landing n'a pas encore été publiée ou n'est disponible que dans le navigateur où elle a été créée.",
    backToPanel: "Retour au panneau",
    loadingTitle: "Préparation de la landing",
    loadingText: "Chargement de la page enregistrée dans ce navigateur.",
  },
  no: {
    languageLabel: "Norsk",
    bookAppointment: "Bestill time",
    exploreServices: "Se tjenester",
    requestBooking: "Be om booking",
    messageWhatsapp: "Send WhatsApp",
    contactSalon: "Kontakt salongen",
    privateBooking: "Booking",
    consultationWindow: "Konsultasjonstid",
    seniorArtistMatch: "Senior stylist",
    included: "Inkludert",
    appointments: "Åpningstider",
    servicesEyebrow: "Tjenester",
    servicesTitle: "Tjenester laget for skjønnhet, hverdag og spesielle anledninger.",
    servicesDescription:
      "Hver avtale starter med en tydelig konsultasjon og en anbefaling tilpasset mål, rutine og tidspunkt.",
    galleryEyebrow: "Galleri",
    galleryRealTitle: (location) =>
      location ? `Utvalgte salongbilder fra ${location}.` : "Utvalgte salongbilder.",
    galleryRealDescription: (salonName) =>
      salonName
        ? `${salonName} bruker ekte utvalgte bilder for å vise atmosfære, tjenester og resultater.`
        : "Ekte bilder valgt for landingssiden.",
    galleryPlaceholderTitle: "Visuell retning for denne landingssiden.",
    galleryPlaceholderDescription:
      "Bildene er visuelle referanser for ønsket atmosfære, uten å hevde at de er ekte salongbilder.",
    reviewsEyebrow: "Anmeldelser",
    reviewsTitle: "Ekte kundeanmeldelser.",
    reviewsDescription:
      "Anmeldelser som vises her bør komme fra en autorisert kilde som Google, eller legges inn manuelt som ekte omtaler.",
    whyChooseEyebrow: "Hvorfor velge",
    whyChooseTitle: "Hvorfor velge denne salongen",
    whyChooseDescription:
      "En tydelig seksjon for kommersielle grunner uten oppdiktede kundeomtaler.",
    whyChooseItems: [
      "En opplevelse tilpasset hver kundes mål.",
      "Tydelige tjenester som gjør booking enklere.",
      "Klar for ekte bilder og anmeldelser i neste produktsteg.",
    ],
    openingHours: "Åpningstider",
    contact: "Kontakt",
    callNow: "Ring nå",
    visitInstagram: "Se Instagram",
    openGoogleMaps: "Åpne Google Maps",
    booking: "Booking",
    website: "Nettside",
    googleProfile: "Google-profil",
    socialProfile: "Sosial profil",
    mapsProfile: "Kart og bedriftsprofil",
    profileDetails: "Profildetaljer",
    previewSlug: "Forhåndsvisningsslug",
    location: "Sted",
    landingLanguage: "Språk",
    visualDirection: "Visuell retning",
    clientRating: "Kundevurdering",
    publicNotFoundTitle: "Siden ble ikke funnet",
    publicNotFoundText:
      "Denne landingssiden er ikke publisert ennå, eller er bare tilgjengelig i nettleseren der den ble opprettet.",
    backToPanel: "Tilbake til panelet",
    loadingTitle: "Klargjør landingssiden",
    loadingText: "Laster siden som er lagret i denne nettleseren.",
  },
};

export function getLandingCopy(language?: SalonLanguage) {
  return copy[language ?? "en"] ?? copy.en;
}

export function translateStatLabel(label: string, language?: SalonLanguage) {
  const landingCopy = getLandingCopy(language);
  const normalized = label.toLowerCase();

  if (normalized.includes("rating") || normalized.includes("avalia")) {
    return landingCopy.clientRating;
  }

  if (normalized.includes("location") || normalized.includes("localiza")) {
    return landingCopy.location;
  }

  if (normalized.includes("language") || normalized.includes("idioma")) {
    return landingCopy.landingLanguage;
  }

  if (normalized.includes("visual")) {
    return landingCopy.visualDirection;
  }

  return label;
}

export function detectBrowserLanguage(): SalonLanguage {
  if (typeof navigator === "undefined") {
    return "pt-BR";
  }

  const browserLanguage = navigator.language.toLowerCase();

  if (browserLanguage.startsWith("pt")) {
    return "pt-BR";
  }

  if (browserLanguage.startsWith("es")) {
    return "es";
  }

  if (browserLanguage.startsWith("fr")) {
    return "fr";
  }

  if (browserLanguage.startsWith("no") || browserLanguage.startsWith("nb")) {
    return "no";
  }

  return "en";
}
