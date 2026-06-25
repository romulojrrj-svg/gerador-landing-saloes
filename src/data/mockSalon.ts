import type { Salon } from "@/types/salon";

export const mockSalon: Salon = {
  id: "maison-lumiere",
  name: "Maison Lumiere Atelier",
  eyebrow: "International beauty studio",
  tagline: "Luxury hair artistry, skin rituals, and luminous styling in the heart of Mayfair.",
  summary:
    "A calm, high-touch salon experience for clients who want editorial-level beauty with warm, personal service.",
  location: "Mayfair, London",
  heroImage:
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=2200&q=85",
  stats: [
    { value: "4.9", label: "client rating" },
    { value: "12", label: "senior artists" },
    { value: "8k+", label: "signature transformations" },
  ],
  services: [
    {
      title: "Signature Hair Design",
      description:
        "Precision cuts, dimensional color, and editorial finishing shaped around face, lifestyle, and texture.",
      price: "from $180",
    },
    {
      title: "Skin & Glow Rituals",
      description:
        "A curated menu of restorative facials, sculpting massage, and glow-focused skin treatments.",
      price: "from $140",
    },
    {
      title: "Bridal & Event Styling",
      description:
        "Polished, camera-ready styling for weddings, premieres, destination events, and private appointments.",
      price: "custom quote",
    },
  ],
  gallery: [
    {
      src: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=1000&q=80",
      alt: "Soft salon interior with styling chairs",
    },
    {
      src: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80",
      alt: "Beauty treatment room with premium products",
    },
    {
      src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
      alt: "Hair stylist finishing a luxury look",
    },
    {
      src: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
      alt: "Client receiving a calming facial treatment",
    },
  ],
  testimonials: [
    {
      quote:
        "The team reads your style instantly. I left with the kind of color that looks expensive in every light.",
      name: "Amelia R.",
      role: "Creative director",
    },
    {
      quote:
        "Quiet, precise, and beautifully run. It feels more like a private beauty atelier than a typical salon.",
      name: "Sofia M.",
      role: "Bride-to-be",
    },
    {
      quote:
        "Their facial ritual is the only appointment I refuse to miss when I am in London.",
      name: "Naomi K.",
      role: "Frequent client",
    },
  ],
  ctaTitle: "Reserve your private consultation",
  ctaText:
    "Book a tailored session with a senior artist and leave with a beauty plan shaped around your calendar, features, and personal style.",
};
