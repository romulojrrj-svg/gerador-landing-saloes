import { ensureCompleteSalon } from "@/lib/salon-storage";
import type { Salon } from "@/types/salon";

export const mockSalon: Salon = ensureCompleteSalon({
  id: "maison-lumiere",
  slug: "maison-lumiere",
  name: "Maison Lumiere Atelier",
  location: "Mayfair, London",
  city: "London",
  country: "United Kingdom",
  language: "en",
  landingLanguage: "en",
  positioningLine:
    "Luxury hair color, restorative skin rituals, and polished event styling for clients who expect a quieter kind of excellence.",
  description:
    "Located two minutes from Bond Street, the atelier pairs senior-only appointments with discreet hospitality, premium product lines, and a consultation-first approach.",
  visualStyle: "Soft luxury",
  brandTone: "Discreet, polished, editorial, and quietly luxurious",
  selectedServices: [
    "Signature Cut & Dimensional Color",
    "Sculpting Facial & Glow Ritual",
    "Bridal, Red Carpet & Event Styling",
  ],
  instagramUrl: "https://www.instagram.com/maisonlumiere",
  googleMapsUrl: "https://maps.google.com/?q=Maison+Lumiere+Atelier",
  googleBusinessUrl: "https://maps.google.com/?q=Maison+Lumiere+Atelier",
  websiteUrl: "https://maisonlumiere.example",
  bookingUrl: "https://booking.maisonlumiere.example",
  whatsapp: "+44 20 0000 0000",
  phone: "+44 20 0000 0000",
  heroImage:
    "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=2200&q=88",
  images: [
    {
      id: "hero",
      title: "Hero image",
      src: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=2200&q=88",
      alt: "Premium salon interior in Mayfair",
      source: "placeholder",
    },
    {
      id: "interior",
      title: "Interior image",
      src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
      alt: "Soft salon interior with styling chairs",
      source: "placeholder",
    },
    {
      id: "service",
      title: "Service image",
      src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
      alt: "Hair stylist finishing a luxury look",
      source: "placeholder",
    },
    {
      id: "result",
      title: "Result image",
      src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
      alt: "Client receiving a calming facial treatment",
      source: "placeholder",
    },
  ],
  eyebrow: "Private beauty atelier in Mayfair",
  tagline:
    "Luxury hair color, restorative skin rituals, and polished event styling for clients who expect a quieter kind of excellence.",
  summary:
    "Located two minutes from Bond Street, the atelier pairs senior-only appointments with discreet hospitality, premium product lines, and a consultation-first approach.",
  stats: [
    { value: "4.9/5", label: "Google client rating" },
    { value: "10+ yrs", label: "Mayfair beauty expertise" },
    { value: "Tue-Sat", label: "private appointment hours" },
  ],
  services: [
    {
      id: "signature-cut-dimensional-color",
      title: "Signature Cut & Dimensional Color",
      description:
        "A consultation-led service for natural movement, expensive-looking tone, and a finish that holds through dinners, shoots, and travel days.",
      price: "from GBP 180",
      category: "Hair",
      featured: true,
    },
    {
      id: "sculpting-facial-glow-ritual",
      title: "Sculpting Facial & Glow Ritual",
      description:
        "A 75-minute treatment combining deep cleansing, facial massage, LED therapy, and barrier-focused products for a rested, luminous finish.",
      price: "from GBP 145",
      category: "Skin",
      featured: true,
    },
    {
      id: "bridal-red-carpet-event-styling",
      title: "Bridal, Red Carpet & Event Styling",
      description:
        "Trial sessions, day-of styling, and private-suite prep for weddings, premieres, brand dinners, and destination events.",
      price: "custom quote",
      category: "Events",
      featured: true,
    },
  ],
  gallery: [
    {
      id: "interior",
      src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
      alt: "Soft salon interior with styling chairs",
      source: "placeholder",
    },
    {
      id: "treatment-room",
      src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
      alt: "Beauty treatment room with premium products",
      source: "placeholder",
    },
    {
      id: "styling-service",
      src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
      alt: "Hair stylist finishing a luxury look",
      source: "placeholder",
    },
    {
      id: "facial-result",
      src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
      alt: "Client receiving a calming facial treatment",
      source: "placeholder",
    },
  ],
  testimonials: [
    {
      quote:
        "I booked before a brand dinner and the color looked soft, glossy, and intentional under every kind of lighting. It still looked fresh three weeks later.",
      name: "Amelia R.",
      role: "Creative director",
    },
    {
      quote:
        "My bridal trial felt calm and incredibly precise. They mapped the full morning schedule and the final look survived the ceremony, portraits, and dancing.",
      name: "Sofia M.",
      role: "Bride-to-be",
    },
    {
      quote:
        "I fly through London twice a month and their facial is the appointment I plan around. No irritation, no sales pressure, just visibly better skin.",
      name: "Naomi K.",
      role: "Frequent client",
    },
  ],
  businessHours: "Tue-Sat, 9:00-19:00",
  address: "Mayfair, London",
  ctaTitle: "Reserve a private consultation in Mayfair",
  ctaText:
    "Share your date, service goals, and preferred artist. The atelier concierge will confirm availability and recommend the right appointment window before you book.",
} as Partial<Salon>);
