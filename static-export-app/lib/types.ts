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
  finalCtaTitle: string;
  finalCtaText: string;
  finalCtaBackgroundColor?: string;
  finalWhatsappButtonColor?: string;
  finalWhatsappButtonTextColor?: string;
  bookingButtonTextColor?: string;
  instagramButtonTextColor?: string;
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
  templateVersion: "premium_v1";
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
  premiumEditorial: StaticPremiumEditorial;
};
