import source from "../data/salon.json";
import type { StaticSalon } from "./types";

export const salon = source as StaticSalon;

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
