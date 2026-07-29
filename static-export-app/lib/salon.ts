import source from "../data/salon.json";
import type { Salon, SalonGalleryImage, SalonTestimonial } from "../../src/types/salon";
import type { StaticSalon } from "./types";

export const salon = source as StaticSalon;
export const appSalon = toAppSalon(salon);

export function imageById(imageId?: string) {
  return imageId ? salon.images.find((image) => image.id === imageId) : undefined;
}

export function buildWhatsappHref() {
  const digits = salon.whatsapp.replace(/\D/g, "");

  if (!digits) {
    return "#contact";
  }

  const message = salon.whatsappMessage.trim();
  const query = message ? `?${new URLSearchParams({ text: message }).toString()}` : "";

  return `https://wa.me/${digits}${query}`;
}

function toAppSalon(value: StaticSalon) {
  const images = value.images.map((image) => ({
    id: image.id,
    url: image.src,
    src: image.src,
    alt: image.alt,
    type: image.type === "logo" ? "logo" : "gallery",
    source: "manual",
    isReal: true,
    selectedForLanding: true,
  })) as SalonGalleryImage[];
  const services = value.services.map((service) => ({
    ...service,
    description: service.description || "",
  }));
  const testimonials = value.testimonials.map((testimonial) => ({
    id: testimonial.id,
    authorName: testimonial.authorName,
    rating: testimonial.rating,
    text: testimonial.text,
    source: "manual",
    isReal: true,
    selectedForLanding: true,
    quote: testimonial.text,
    name: testimonial.authorName,
    role: "",
  })) as SalonTestimonial[];

  return {
    id: value.slug,
    slug: value.slug,
    name: value.name,
    location: value.location,
    city: value.location,
    country: "",
    language: value.language,
    landingLanguage: value.language,
    positioningLine: "",
    description: value.premiumEditorial.heroDescription,
    visualStyle: "premium editorial",
    brandTone: "premium",
    bookingUrl: value.bookingUrl || undefined,
    whatsapp: value.whatsapp || undefined,
    whatsappMessage: value.whatsappMessage,
    instagramUrl: value.instagramUrl || undefined,
    horizontalLogoUrl: value.horizontalLogo?.src || null,
    services,
    selectedServices: services.map((service) => service.title),
    serviceCategories: [],
    featuredServices: [],
    headline: value.premiumEditorial.heroTitle,
    subheadline: value.premiumEditorial.heroDescription,
    aboutText: value.premiumEditorial.aboutText,
    ctaPrimary: "",
    ctaSecondary: "",
    testimonials,
    galleryImages: images,
    gallery: images,
    realImages: images,
    imageCandidates: [],
    realReviews: testimonials,
    heroImage: "",
    images: [],
    businessHours: "",
    address: value.address,
    extractedBusinessInfo: {
      observedServices: services.map((service) => service.title).join(", "),
    },
    sourceMaterials: [],
    socialLinks: {
      instagram: value.instagramUrl || undefined,
      booking: value.bookingUrl || undefined,
      whatsapp: value.whatsapp || undefined,
    },
    status: "published",
    commercialStatus: "sold",
    createdAt: "",
    updatedAt: value.updatedAt,
    sourceMode: "manual",
    generationStatus: "generated",
    dataConfidence: "high",
    imagesSourceStatus: "imported",
    reviewsSourceStatus: testimonials.length ? "imported" : "not_connected",
    hasRealImages: images.length > 0,
    hasRealReviews: testimonials.length > 0,
    generatedCopyStatus: "reviewed",
    eyebrow: value.premiumEditorial.heroEyebrow,
    tagline: value.premiumEditorial.heroTitle,
    summary: value.premiumEditorial.heroDescription,
    stats: [],
    ctaTitle: value.premiumEditorial.finalCtaTitle,
    ctaText: value.premiumEditorial.finalCtaText,
    template: "premium_editorial",
    templateVersion: value.templateVersion,
    premiumEditorial: value.premiumEditorial,
  } as unknown as Salon;
}
