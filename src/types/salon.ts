export type SalonStat = {
  label: string;
  value: string;
};

export type SalonService = {
  title: string;
  description: string;
  price: string;
};

export type SalonGalleryImage = {
  src: string;
  alt: string;
};

export type SalonTestimonial = {
  quote: string;
  name: string;
  role: string;
};

export type Salon = {
  id: string;
  name: string;
  eyebrow: string;
  tagline: string;
  summary: string;
  location: string;
  heroImage: string;
  stats: SalonStat[];
  services: SalonService[];
  gallery: SalonGalleryImage[];
  testimonials: SalonTestimonial[];
  ctaTitle: string;
  ctaText: string;
};
