export type StaticAsset = {
  id: string;
  src: string;
  srcSet?: string;
  width?: number;
  height?: number;
  alt: string;
  type?: string;
  source?: string;
};

export type StaticService = {
  id: string;
  title: string;
  description?: string;
};

export type StaticTestimonial = {
  id: string;
  authorName: string;
  text: string;
  rating?: number;
};

/**
 * Public-only Meta configuration embedded in an exported landing.
 *
 * Access tokens are intentionally not modeled here: they stay exclusively in
 * the Cloudflare Worker secret store.
 */
export type StaticMetaIntegration = {
  enabled: true;
  pixelId: string;
  capiEndpoint: string;
  pageViewEventName: "PageView";
  contactEventName: "Contact" | "Lead";
};

export type StaticPremiumEditorial = {
  accentColor: string;
  backgroundColor: string;
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImageId?: string;
  aboutImageId?: string;
  aboutTitle: string;
  aboutRole: string;
  aboutText: string;
  methodEyebrow: string;
  methodTitle: string;
  methodText: string;
  beforeAfterItems: Array<{
    id: string;
    title: string;
    description?: string;
    beforeImageId: string;
    afterImageId: string;
    beforeAdjustment?: { version: 1; zoom: number; offsetX: number; offsetY: number };
    afterAdjustment?: { version: 1; zoom: number; offsetX: number; offsetY: number };
    order: number;
    enabled: boolean;
  }>;
  faqItems: Array<{
    id: string;
    question: string;
    answer: string;
    order: number;
    enabled: boolean;
  }>;
  reviewDisplayType: "google" | "screenshots";
  reviewEyebrow: string;
  reviewTitle: string;
  reviewDescription: string;
  reviewScreenshotImages: Array<{
    id: string;
    imageId?: string;
    src?: string;
    imageAlt: string;
    order: number;
  }>;
  gallerySection?: {
    enabled: boolean;
    eyebrow?: string;
    title?: string;
    description?: string;
    position: "after_about" | "after_services" | "after_method" | "before_reviews" | "before_quiz" | "before_cta";
    items: Array<{
      id: string;
      imageId?: string;
      imageUrl?: string;
      alt?: string;
      caption?: string;
      order: number;
    }>;
  };
  editorialTestimonials?: Array<{
    id: string;
    quote?: string;
    authorName?: string;
    authorRole?: string;
    originalImageId?: string;
    originalImageUrl?: string;
    originalImageAlt?: string;
    showOriginalImage: boolean;
    featured: boolean;
    order: number;
  }>;
  interactiveQuiz?: {
    enabled: boolean;
    introEyebrow?: string;
    introNotice?: string;
    title: string;
    subtitle: string;
    introText: string;
    estimatedTime: string;
    startButtonLabel: string;
    flowTitle: string;
    contactIntro: string;
    contactSubmitLabel?: string;
    confirmationTitle: string;
    confirmationText: string;
    consentText: string;
    contactCityEnabled: boolean;
    contactCityRequired: boolean;
    contactConsentRequired: boolean;
    hideProgressMeta: boolean;
    privacyUrl?: string;
    position: "after_services" | "after_results" | "before_faq" | "before_cta";
    contactNameRequired: boolean;
    defaultCountryCode: string;
    quizTheme?: {
      mode: "inherit" | "custom";
      primary?: string;
      accent?: string;
      background?: string;
      surface?: string;
      text?: string;
    };
    questions: Array<{
      id: string;
      category?: string;
      type: "short_text" | "long_text" | "single_choice" | "multiple_choice" | "scale" | "yes_no";
      prompt: string;
      helperText?: string;
      placeholder?: string;
      required: boolean;
      options: Array<{ id: string; label: string }>;
      minSelections?: number;
      maxSelections?: number;
      scaleMin?: number;
      scaleMax?: number;
      scaleStep?: number;
      scaleInitial?: number;
      scaleMinLabel?: string;
      scaleMaxLabel?: string;
      scaleShowValue: boolean;
      requireInteraction: boolean;
      maxLength?: number;
      showCharacterCount: boolean;
      autoGrow: boolean;
      autoAdvance: boolean;
      autoAdvanceDelay?: number;
    }>;
  };
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaBackgroundColor?: string;
  finalWhatsappButtonColor?: string;
  finalWhatsappButtonTextColor?: string;
  bookingButtonTextColor?: string;
  instagramButtonTextColor?: string;
  finalSecondaryButtonTextColor?: string;
  aboutLabel?: string;
  servicesLabel?: string;
  servicesTitle?: string;
  resultsLabel?: string;
  contactLabel?: string;
  bookAppointmentLabel?: string;
  bookViaWhatsappLabel?: string;
  reservationsLabel?: string;
  chatOnWhatsappLabel?: string;
  bookOnFreshaLabel?: string;
};

export type StaticSalon = {
  slug: string;
  name: string;
  language: string;
  customDomain: string;
  template: "premium";
  templateVersion: "premium_v1" | "premium_editorial_v2";
  updatedAt: string;
  location: string;
  address: string;
  bookingUrl: string;
  whatsapp: string;
  whatsappMessage: string;
  instagramUrl: string;
  horizontalLogo: StaticAsset | null;
  images: StaticAsset[];
  services: StaticService[];
  testimonials: StaticTestimonial[];
  googleRating: number | null;
  integrations?: {
    meta?: StaticMetaIntegration;
  };
  premiumEditorial: StaticPremiumEditorial;
};
