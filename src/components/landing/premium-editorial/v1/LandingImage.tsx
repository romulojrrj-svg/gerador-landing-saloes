"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";
import { getValidImageUrl, isRemoteImageUrl } from "@/lib/salon-images";
import type { SalonGalleryImage } from "@/types/salon";

type LandingImageProps = Omit<
  ImageProps,
  "src" | "onError" | "unoptimized"
> & {
  image: SalonGalleryImage | string;
  imageId?: string;
  salonSlug: string;
  section: string;
  fallback?: ReactNode;
  onLoadError?: (imageId: string) => void;
};

export function LandingImage({
  image,
  imageId,
  salonSlug,
  section,
  fallback = null,
  onLoadError,
  alt,
  ...props
}: LandingImageProps) {
  const url = getValidImageUrl(image);
  const resolvedImageId =
    imageId ?? (typeof image === "string" ? url ?? "unknown" : image.id);
  const [failedUrl, setFailedUrl] = useState("");

  if (!url || failedUrl === url) {
    return fallback;
  }

  return (
    <Image
      {...props}
      src={url}
      alt={alt}
      unoptimized={isRemoteImageUrl(url)}
      onError={() => {
        console.warn("[landing-images] falha ao carregar imagem", {
          slug: salonSlug,
          section,
          imageId: resolvedImageId,
          url,
        });
        setFailedUrl(url);
        onLoadError?.(resolvedImageId);
      }}
    />
  );
}
