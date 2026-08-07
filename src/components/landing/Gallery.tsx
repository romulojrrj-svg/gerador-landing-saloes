"use client";

import { useState } from "react";
import { getPublicText } from "@/lib/public-landing";
import { filterValidLandingImages } from "@/lib/salon-images";
import type { SalonGalleryImage, SalonLanguage } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type GalleryProps = {
  images: SalonGalleryImage[];
  salonSlug?: string;
  salonName?: string;
  location?: string;
  language: SalonLanguage;
  hasRealImages?: boolean;
  mode?: "preview" | "public";
};

export function Gallery({
  images,
  salonSlug,
  salonName,
  language,
  hasRealImages,
  mode = "public",
}: GalleryProps) {
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const copy = getPublicText(language);
  const realImages = filterValidLandingImages(images);
  const selectedImages =
    mode === "public"
      ? realImages
      : filterValidLandingImages(images, { requireReal: false });
  const loadableImages = selectedImages.filter(
    (image) => !failedImageIds.includes(image.id),
  );

  if (!loadableImages.length) {
    return null;
  }

  const displayImages = loadableImages.slice(0, 8);

  const title =
    mode === "public"
      ? language === "pt-BR"
        ? "Registros do salão"
        : language === "es"
          ? "Momentos del salón"
          : language === "no"
            ? "Øyeblikk fra salongen"
            : "Salon moments"
      : "Galeria da prévia";
  const description =
    mode === "public"
      ? language === "pt-BR"
        ? "Fotos selecionadas para apresentar o ambiente, os detalhes e o cuidado do salão."
        : language === "es"
          ? "Fotos seleccionadas para mostrar el ambiente, los detalles y el cuidado del salón."
          : language === "no"
            ? "Utvalgte bilder som viser atmosfæren, detaljene og opplevelsen i salongen."
            : "Selected photos showing the atmosphere, details, and care inside the salon."
      : hasRealImages
        ? "Fotos reais selecionadas para a prévia."
        : "Adicione fotos reais do salão antes de publicar.";

  return (
    <section className="bg-[linear-gradient(180deg,#fbf7f2_0%,#ffffff_100%)] px-4 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={copy.galleryTitle}
          title={title}
          description={description}
          align="center"
        />

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3.5 xl:grid-cols-12">
          {displayImages.map((image, index) => (
            <figure
              key={image.id}
              className={getGalleryCardClass(index, loadableImages.length)}
            >
              <img
                src={image.src || image.url}
                alt={image.alt}
                loading={index > 1 ? "lazy" : "eager"}
                decoding="async"
                className="block h-auto w-full max-w-full object-contain"
                onError={() => {
                  console.warn("[landing-images] falha ao carregar imagem", {
                    slug: salonSlug ?? salonName ?? "unknown-salon",
                    section: "gallery",
                    imageId: image.id,
                    url: image.src || image.url,
                  });
                  setFailedImageIds((current) =>
                    current.includes(image.id) ? current : [...current, image.id],
                  );
                }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-70" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function getGalleryCardClass(index: number, total: number) {
  const base =
    "group relative min-w-0 self-start overflow-hidden rounded-[1.15rem] border border-[#eadfce] bg-zinc-200 shadow-[0_16px_36px_rgba(83,57,33,0.08)] sm:rounded-[1.55rem]";

  if (total === 1) {
    return `${base} col-span-2 xl:col-span-8 xl:col-start-3`;
  }

  if (total === 2) {
    return `${base} col-span-2 sm:col-span-1 ${
      index === 0 ? "xl:col-span-7" : "xl:col-span-5"
    }`;
  }

  const variants = [
    "col-span-2 xl:col-span-5",
    "col-span-1 xl:col-span-4",
    "col-span-1 xl:col-span-3",
    "col-span-1 xl:col-span-3",
    "col-span-1 xl:col-span-3",
    "col-span-2 xl:col-span-6",
    "col-span-1 xl:col-span-3",
    "col-span-1 xl:col-span-3",
  ];

  return `${base} ${variants[index % variants.length]}`;
}
