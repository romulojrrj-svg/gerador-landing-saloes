import type { SalonCommercialStatus } from "@/types/salon";

export const salonCommercialStatusOptions: SalonCommercialStatus[] = [
  "test",
  "draft_error",
  "review_photos",
  "ready_to_send",
  "sent",
  "sold",
];

export const salonCommercialStatusLabels: Record<
  SalonCommercialStatus,
  string
> = {
  test: "Teste",
  draft_error: "Rascunho/erro",
  review_photos: "Revisar fotos",
  ready_to_send: "Pronto para enviar",
  sent: "Enviado",
  sold: "Vendido",
};

export const salonCommercialStatusOrder: Record<
  SalonCommercialStatus,
  number
> = {
  draft_error: 1,
  review_photos: 2,
  ready_to_send: 3,
  sent: 4,
  sold: 5,
  test: 6,
};

export function normalizeCommercialStatus(
  value: string | null | undefined,
): SalonCommercialStatus {
  switch (value) {
    case "draft_error":
    case "review_photos":
    case "ready_to_send":
    case "sent":
    case "sold":
    case "test":
      return value;
    default:
      return "test";
  }
}

export function getSalonCommercialStatusClasses(
  value: SalonCommercialStatus,
) {
  switch (value) {
    case "draft_error":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "review_photos":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "ready_to_send":
      return "border-sky-200 bg-sky-50 text-sky-900";
    case "sent":
      return "border-violet-200 bg-violet-50 text-violet-900";
    case "sold":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "test":
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}
