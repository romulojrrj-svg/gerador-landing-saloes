import { getPrimaryContactAction } from "@/lib/public-landing";
import type { Salon } from "@/types/salon";

export type CommercialChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
};

export function getPreviewPath(slug: string) {
  return `/salons/${slug}/preview`;
}

export function getPublicLandingPath(slug: string) {
  return `/p/${slug}`;
}

export function getApproachMessage(salon: Salon) {
  const savedMessage =
    salon.generatedCopy?.prospectingMessage || salon.copySuggestions?.prospectingMessage;

  if (savedMessage?.trim()) {
    return savedMessage.trim();
  }

  const mentionPublicInfo =
    salon.instagramUrl || salon.googleMapsUrl
      ? " Usei as informacoes publicas do salao como base e montei uma previa visual para voce avaliar."
      : "";

  return `Ola! Criei uma previa de uma landing page para o ${salon.name}, pensada para apresentar melhor os servicos e facilitar o agendamento. Posso te enviar o link para voce ver como ficou?${mentionPublicInfo}`;
}

export function getCommercialChecklist(salon: Salon): CommercialChecklistItem[] {
  const hasContact = Boolean(getPrimaryContactAction(salon).href);
  const hasAppliedCopy = Boolean(
    salon.generatedCopy?.status === "applied" ||
      salon.copySuggestions?.status === "applied",
  );

  return [
    { id: "name", label: "Nome do salao preenchido", ok: Boolean(salon.name) },
    {
      id: "location",
      label: "Cidade ou endereco preenchido",
      ok: Boolean(salon.city || salon.location || salon.address),
    },
    { id: "contact", label: "Pelo menos 1 contato", ok: hasContact },
    {
      id: "services",
      label: "Pelo menos 2 servicos",
      ok: salon.services.length >= 2 || salon.selectedServices.length >= 2,
    },
    { id: "copy", label: "Copy aplicada", ok: hasAppliedCopy },
    { id: "cta", label: "CTA funcionando", ok: hasContact },
    { id: "public", label: "Link publico disponivel", ok: Boolean(salon.slug) },
    { id: "image", label: "Foto real adicionada", ok: salon.hasRealImages },
    { id: "review", label: "Review real adicionada", ok: salon.hasRealReviews },
  ];
}

export function getCommercialReadinessLabel(salon: Salon) {
  const checklist = getCommercialChecklist(salon);
  const completed = checklist.filter((item) => item.ok).length;

  if (completed >= 7) {
    return "Pronto para abordagem";
  }

  if (completed >= 4) {
    return "Quase pronto";
  }

  return "Nao pronto";
}

export function getAbsoluteAppUrl(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}
