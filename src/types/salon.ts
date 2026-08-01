export type SalonLanguage = "pt-BR" | "en" | "es" | "fr" | "no";

export type SalonStatus = "draft" | "preview" | "published";

export type SalonCommercialStatus =
  | "test"
  | "draft_error"
  | "review_photos"
  | "ready_to_send"
  | "sent"
  | "sold";

export type SalonSourceMode = "manual" | "assisted" | "imported";

export type SalonGenerationStatus =
  | "idle"
  | "analyzing"
  | "generated"
  | "needs_review";

export type SalonDataConfidence = "unknown" | "low" | "medium" | "high";

export type SalonSourceStatus =
  | "not_connected"
  | "placeholder"
  | "pending"
  | "connected"
  | "imported"
  | "failed";

export type SalonGeneratedCopyStatus =
  | "not_started"
  | "draft"
  | "generated"
  | "reviewed";

export type SalonCopySource = "assisted" | "manual" | "ai_future";

export type SalonCopyStatus = "draft" | "applied" | "ignored";

export type SalonTemplate = "default" | "premium_editorial";

export type SalonTemplateVersion =
  | "premium_editorial_v1"
  | "premium_editorial_v2";

export type SalonFaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
  enabled: boolean;
};

export type SalonInteractiveQuizQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "scale"
  | "yes_no";

export type SalonInteractiveQuizPosition =
  | "after_services"
  | "after_results"
  | "before_faq"
  | "before_cta";

export type SalonInteractiveQuizOption = {
  id: string;
  label: string;
  order: number;
};

export type SalonInteractiveQuizQuestion = {
  id: string;
  type: SalonInteractiveQuizQuestionType;
  category?: string;
  prompt: string;
  helperText?: string;
  placeholder?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoGrow?: boolean;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  required: boolean;
  options: SalonInteractiveQuizOption[];
  minSelections?: number;
  maxSelections?: number;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleInitial?: number;
  scaleShowValue?: boolean;
  requireInteraction?: boolean;
};

export type SalonInteractiveQuizTheme = {
  mode?: "inherit" | "custom";
  primary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
};

export type SalonInteractiveQuizConfig = {
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
  contactCityEnabled?: boolean;
  contactCityRequired?: boolean;
  contactConsentRequired?: boolean;
  notificationEnabled?: boolean;
  notificationRecipientEmail?: string;
  hideProgressMeta?: boolean;
  privacyUrl?: string;
  position: SalonInteractiveQuizPosition;
  contactNameRequired: boolean;
  defaultCountryCode: string;
  submitEndpoint?: string;
  quizTheme?: SalonInteractiveQuizTheme;
  questions: SalonInteractiveQuizQuestion[];
};

export type SalonBeforeAfterItem = {
  id: string;
  title: string;
  description?: string;
  beforeImageId: string;
  afterImageId: string;
  beforeAdjustment?: SalonImageFrameAdjustment;
  afterAdjustment?: SalonImageFrameAdjustment;
  order: number;
  enabled: boolean;
};

export type SalonImageFrameAdjustment = {
  version: 1;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type SalonReviewDisplayType = "google" | "screenshots";

export type SalonPremiumReviewScreenshot = {
  id: string;
  imageId?: string;
  imageUrl?: string;
  imageAlt: string;
  order: number;
};

export type SalonPremiumEditorialGalleryPosition =
  | "after_about"
  | "after_services"
  | "after_method"
  | "before_reviews"
  | "before_quiz"
  | "before_cta";

export type SalonPremiumEditorialGalleryItem = {
  id: string;
  imageId?: string;
  imageUrl?: string;
  alt?: string;
  caption?: string;
  order?: number;
};

export type SalonPremiumEditorialGallerySection = {
  enabled?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  position?: SalonPremiumEditorialGalleryPosition;
  items?: SalonPremiumEditorialGalleryItem[];
};

export type SalonPremiumEditorialTestimonial = {
  id: string;
  quote?: string;
  authorName?: string;
  authorRole?: string;
  originalImageId?: string;
  originalImageUrl?: string;
  originalImageAlt?: string;
  showOriginalImage?: boolean;
  featured?: boolean;
  order?: number;
};

export type SalonPremiumEditorial = {
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
  beforeAfterItems: SalonBeforeAfterItem[];
  faqItems: SalonFaqItem[];
  reviewDisplayType: SalonReviewDisplayType;
  reviewEyebrow: string;
  reviewTitle: string;
  reviewDescription: string;
  reviewScreenshotImages: SalonPremiumReviewScreenshot[];
  gallerySection?: SalonPremiumEditorialGallerySection;
  editorialTestimonials?: SalonPremiumEditorialTestimonial[];
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
  interactiveQuiz?: SalonInteractiveQuizConfig;
};

export type SalonImageSource =
  | "placeholder"
  | "instagram"
  | "google"
  | "website"
  | "manual"
  | "print"
  | "url";

export type SalonImageType =
  | "logo"
  | "hero"
  | "interior"
  | "service"
  | "result"
  | "gallery";

export type SalonImageCandidateSource = "instagram" | "google" | "website";

export type SalonImageCandidateStatus =
  | "new"
  | "selected"
  | "rejected"
  | "applied";

export type SalonImageSuggestedUse =
  | "logo"
  | "top"
  | "hero"
  | "hero_mosaic"
  | "gallery"
  | "space"
  | "experience"
  | "interior"
  | "facade"
  | "team"
  | "service"
  | "result"
  | "detail"
  | "ignore";

export type SalonStat = {
  label: string;
  value: string;
};

export type SalonService = {
  id: string;
  title: string;
  description: string;
  price?: string;
  category?: string;
  featured?: boolean;
};

export type SalonGalleryImage = {
  id: string;
  url: string;
  src: string;
  alt: string;
  title?: string;
  type: SalonImageType;
  source: SalonImageSource;
  sourceUrl?: string;
  originalPostUrl?: string;
  isReal: boolean;
  selectedForLanding: boolean;
  createdAt?: string;
};

export type SalonImageCandidate = {
  id: string;
  source: SalonImageCandidateSource;
  imageUrl: string;
  collectorOrigin?:
    | "feed"
    | "post"
    | "carousel"
    | "highlight"
    | "avatar"
    | "unknown";
  collectorContext?: string;
  pageUrl?: string;
  width?: number;
  height?: number;
  title?: string;
  alt?: string;
  detectedType?: SalonImageSuggestedUse;
  score: number;
  confidence: SalonDataConfidence;
  suggestedUse: SalonImageSuggestedUse;
  status: SalonImageCandidateStatus;
  reasons: string[];
  warnings?: string[];
  shouldUse?: boolean;
  shouldReject?: boolean;
  sourceUrl?: string;
  originalPostUrl?: string;
  collectedAt: string;
};

export type SalonLayoutImagePlanMode = "local_auto" | "chatgpt_manual";

export type SalonLayoutImagePlan = {
  mode: SalonLayoutImagePlanMode;
  logoImageId?: string | null;
  topImageIds?: string[];
  heroImageId?: string | null;
  heroMosaicImageIds: string[];
  galleryImageIds: string[];
  spaceEnabled?: boolean;
  spaceTitle?: string;
  spaceDescription?: string;
  spaceImageIds?: string[];
  experienceImageIds: string[];
  resultImageIds: string[];
  ignoredImageIds: string[];
  summary?: string;
  warnings: string[];
  generatedAt?: string;
  appliedAt?: string;
  updatedAt?: string;
};

export type SalonImageSelectionSummary = {
  logoId?: string;
  heroId?: string;
  interiorIds: string[];
  resultIds: string[];
  galleryIds: string[];
  ignoredIds: string[];
  selectedAt?: string;
  appliedAt?: string;
};

export type SalonImageSlot = SalonGalleryImage & {
  id: "hero" | "interior" | "service" | "result" | string;
};

export type SalonReviewSource = "google" | "manual" | "placeholder";

export type SalonTestimonial = {
  id: string;
  authorName: string;
  rating?: number;
  text: string;
  source: SalonReviewSource;
  sourceUrl?: string;
  reviewDate?: string;
  isReal: boolean;
  selectedForLanding: boolean;
  quote: string;
  name: string;
  role: string;
};

export type SalonSocialLinks = {
  instagram?: string;
  googleMaps?: string;
  website?: string;
  booking?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  phone?: string;
};

export type SalonSuggestedCopy = {
  headline?: string;
  subheadline?: string;
  aboutText?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
};

export type SalonWhyChooseItem = {
  title: string;
  description: string;
};

export type SalonServiceCopy = {
  serviceId: string;
  originalTitle: string;
  title: string;
  description: string;
};

export type SalonCopySuggestion = {
  id: string;
  headline: string;
  subheadline: string;
  aboutTitle: string;
  aboutText: string;
  servicesIntroTitle: string;
  servicesIntroText: string;
  serviceDescriptions: SalonServiceCopy[];
  whyChooseTitle: string;
  whyChooseItems: SalonWhyChooseItem[];
  ctaTitle: string;
  ctaText: string;
  ctaButtonLabel: string;
  seoTitle: string;
  seoDescription: string;
  prospectingMessage: string;
  businessSummary: string;
  generatedAt: string;
  language: SalonLanguage;
  source: SalonCopySource;
  status: SalonCopyStatus;
  appliedAt?: string;
};

export type SalonReadinessItem = {
  id: string;
  label: string;
  ok: boolean;
  help: string;
};

export type SalonReadinessScore = {
  score: number;
  items: SalonReadinessItem[];
};

export type SalonSourceMaterial = {
  id: string;
  title: string;
  type: "image" | "review" | "note" | "profile_info";
  source: SalonImageSource | SalonReviewSource | "manual";
  sourceUrl?: string;
  notes?: string;
  createdAt: string;
};

export type SalonExtractedBusinessInfo = {
  businessHours?: string;
  address?: string;
  observedServices?: string;
  differentiators?: string;
  visualNotes?: string;
};

export type SalonSourceProfile = {
  instagramProfileUrl?: string;
  googleBusinessUrl?: string;
  importedInstagramImages?: SalonGalleryImage[];
  instagramImportStatus?: SalonSourceStatus;
  googleReviewsImportStatus?: SalonSourceStatus;
  lastImportAt?: string;
  importErrors?: string[];
};

export type Salon = {
  id: string;
  slug: string;

  name: string;
  location: string;
  city: string;
  country: string;
  language: SalonLanguage;
  landingLanguage: SalonLanguage;
  positioningLine: string;
  description: string;
  heroOverlayTitle?: string;
  heroOverlaySubtitle?: string;
  visualStyle: string;
  brandTone: string;

  instagramUrl?: string;
  instagramProfileUrl?: string;
  googleMapsUrl?: string;
  googleBusinessUrl?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  phone?: string;
  horizontalLogoUrl?: string | null;
  customDomain?: string | null;
  googleRating?: number;
  googleReviewCount?: number;

  services: SalonService[];
  selectedServices: string[];
  serviceCategories: string[];
  featuredServices: string[];

  headline: string;
  subheadline: string;
  aboutText: string;
  ctaPrimary: string;
  ctaSecondary: string;
  testimonials: SalonTestimonial[];
  galleryImages: SalonGalleryImage[];
  gallery: SalonGalleryImage[];
  realImages: SalonGalleryImage[];
  imageCandidates: SalonImageCandidate[];
  imageSelectionSummary?: SalonImageSelectionSummary;
  layoutImagePlan?: SalonLayoutImagePlan;
  realReviews: SalonTestimonial[];
  heroImage: string;
  images: SalonImageSlot[];
  businessHours: string;
  address: string;
  extractedBusinessInfo: SalonExtractedBusinessInfo;
  sourceMaterials: SalonSourceMaterial[];
  socialLinks: SalonSocialLinks;

  status: SalonStatus;
  commercialStatus: SalonCommercialStatus;
  createdAt: string;
  updatedAt: string;
  sourceMode: SalonSourceMode;
  generationStatus: SalonGenerationStatus;
  dataConfidence: SalonDataConfidence;
  imagesSourceStatus: SalonSourceStatus;
  reviewsSourceStatus: SalonSourceStatus;
  hasRealImages: boolean;
  hasRealReviews: boolean;
  generatedCopyStatus: SalonGeneratedCopyStatus;
  notes?: string;
  lastGeneratedAt?: string;

  sourceSummary?: string;
  sourceProfile?: SalonSourceProfile;
  extractedInsights?: string[];
  suggestedServices?: SalonService[];
  suggestedImages?: SalonGalleryImage[];
  importedInstagramImages?: SalonGalleryImage[];
  instagramImportStatus?: SalonSourceStatus;
  googleReviewsImportStatus?: SalonSourceStatus;
  lastImportAt?: string;
  importErrors?: string[];
  suggestedCopy?: SalonSuggestedCopy;
  copySuggestions?: SalonCopySuggestion;
  generatedCopy?: SalonCopySuggestion;
  copyHistory?: SalonCopySuggestion[];
  lastAppliedAt?: string;
  aiBrief?: string;
  promptMetadata?: Record<string, unknown>;
  manualAssistantNotes?: string;

  eyebrow: string;
  tagline: string;
  summary: string;
  stats: SalonStat[];
  ctaTitle: string;
  ctaText: string;
  template: SalonTemplate;
  templateVersion?: SalonTemplateVersion;
  premiumEditorial: SalonPremiumEditorial;
};

export type SalonFormInput = {
  name: string;
  location: string;
  city: string;
  country: string;
  status: SalonStatus;
  commercialStatus?: SalonCommercialStatus;
  language: SalonLanguage;
  positioningLine: string;
  description: string;
  heroOverlayTitle?: string;
  heroOverlaySubtitle?: string;
  visualStyle: string;
  brandTone: string;
  instagramUrl?: string;
  googleMapsUrl?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  phone?: string;
  horizontalLogoUrl?: string | null;
  customDomain?: string | null;
  selectedServices: string[];
  services?: SalonService[];
  galleryImages?: SalonGalleryImage[];
  imageCandidates?: SalonImageCandidate[];
  imageSelectionSummary?: SalonImageSelectionSummary;
  layoutImagePlan?: SalonLayoutImagePlan;
  testimonials?: SalonTestimonial[];
  businessHours?: string;
  address?: string;
  extractedBusinessInfo?: SalonExtractedBusinessInfo;
  sourceMaterials?: SalonSourceMaterial[];
  manualAssistantNotes?: string;
  notes?: string;
  template?: SalonTemplate;
  templateVersion?: SalonTemplateVersion;
  premiumEditorial?: SalonPremiumEditorial;
  copySuggestions?: SalonCopySuggestion;
  generatedCopy?: SalonCopySuggestion;
  copyHistory?: SalonCopySuggestion[];
  lastGeneratedAt?: string;
  lastAppliedAt?: string;
};
