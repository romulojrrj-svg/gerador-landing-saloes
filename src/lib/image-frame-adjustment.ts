import type { CSSProperties } from "react";
import type { SalonImageFrameAdjustment } from "@/types/salon";

export const IMAGE_FRAME_ADJUSTMENT_VERSION = 1 as const;
export const IMAGE_FRAME_MIN_ZOOM = 1;
export const IMAGE_FRAME_MAX_ZOOM = 4;

export const DEFAULT_IMAGE_FRAME_ADJUSTMENT: SalonImageFrameAdjustment = {
  version: IMAGE_FRAME_ADJUSTMENT_VERSION,
  zoom: IMAGE_FRAME_MIN_ZOOM,
  offsetX: 0,
  offsetY: 0,
};

type ImageFrameStyleOptions = {
  imageAspectRatio?: number;
  frameAspectRatio?: number;
  objectFit?: "cover" | "contain";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

export function normalizeImageFrameAdjustment(
  value: Partial<SalonImageFrameAdjustment> | null | undefined,
): SalonImageFrameAdjustment | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const adjustment: SalonImageFrameAdjustment = {
    version: IMAGE_FRAME_ADJUSTMENT_VERSION,
    zoom: clamp(
      finiteNumber(value.zoom, IMAGE_FRAME_MIN_ZOOM),
      IMAGE_FRAME_MIN_ZOOM,
      IMAGE_FRAME_MAX_ZOOM,
    ),
    offsetX: clamp(finiteNumber(value.offsetX, 0), -1, 1),
    offsetY: clamp(finiteNumber(value.offsetY, 0), -1, 1),
  };

  if (
    adjustment.zoom === IMAGE_FRAME_MIN_ZOOM &&
    adjustment.offsetX === 0 &&
    adjustment.offsetY === 0
  ) {
    return undefined;
  }

  return adjustment;
}

export function getImageFrameStyle(
  value: Partial<SalonImageFrameAdjustment> | null | undefined,
  options: ImageFrameStyleOptions = {},
): CSSProperties | undefined {
  const adjustment = normalizeImageFrameAdjustment(value);

  if (!adjustment) {
    return undefined;
  }

  const hasAspectRatio =
    typeof options.imageAspectRatio === "number" &&
    Number.isFinite(options.imageAspectRatio) &&
    options.imageAspectRatio > 0;
  const frameAspectRatio = options.frameAspectRatio ?? 4 / 5;
  const objectFit = options.objectFit ?? "cover";
  const baseWidthRatio = hasAspectRatio
    ? objectFit === "contain"
      ? Math.min(1, options.imageAspectRatio! / frameAspectRatio)
      : Math.max(1, options.imageAspectRatio! / frameAspectRatio)
    : 1;
  const baseHeightRatio = hasAspectRatio
    ? objectFit === "contain"
      ? Math.min(1, frameAspectRatio / options.imageAspectRatio!)
      : Math.max(1, frameAspectRatio / options.imageAspectRatio!)
    : 1;
  const maxTranslationX = Math.max(
    0,
    baseWidthRatio * adjustment.zoom - 1,
  ) / 2;
  const maxTranslationY = Math.max(
    0,
    baseHeightRatio * adjustment.zoom - 1,
  ) / 2;
  const canUseMeasuredPan = hasAspectRatio;
  const hasZoom = adjustment.zoom > IMAGE_FRAME_MIN_ZOOM;
  const fallbackPanAmount = (adjustment.zoom - IMAGE_FRAME_MIN_ZOOM) / 2;

  return {
    objectPosition:
      canUseMeasuredPan || hasZoom
        ? "50% 50%"
        : `${50 + adjustment.offsetX * 50}% ${50 + adjustment.offsetY * 50}%`,
    transform: canUseMeasuredPan
      ? `translate(${adjustment.offsetX * maxTranslationX * 100}%, ${adjustment.offsetY * maxTranslationY * 100}%) scale(${adjustment.zoom})`
      : hasZoom
        ? `translate(${adjustment.offsetX * fallbackPanAmount * 100}%, ${adjustment.offsetY * fallbackPanAmount * 100}%) scale(${adjustment.zoom})`
        : undefined,
    transformOrigin: "center center",
  };
}

export function updateImageFrameAdjustment(
  current: Partial<SalonImageFrameAdjustment> | null | undefined,
  patch: Partial<SalonImageFrameAdjustment>,
) {
  return normalizeImageFrameAdjustment({
    ...DEFAULT_IMAGE_FRAME_ADJUSTMENT,
    ...(current ?? {}),
    ...patch,
  });
}
