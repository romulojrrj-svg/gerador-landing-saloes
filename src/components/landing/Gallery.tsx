import Image from "next/image";
import { getPublicText } from "@/lib/public-landing";
import type { SalonGalleryImage, SalonLanguage } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type GalleryProps = {
  images: SalonGalleryImage[];
  salonName?: string;
  location?: string;
  language: SalonLanguage;
  hasRealImages?: boolean;
  mode?: "preview" | "public";
};

export function Gallery({
  images,
  language,
  hasRealImages,
  mode = "public",
}: GalleryProps) {
  const copy = getPublicText(language);
  const realImages = images.filter(
    (image) => image.isReal && image.selectedForLanding && image.type !== "logo",
  );
  const selectedImages =
    mode === "public"
      ? realImages
      : images.filter((image) => image.selectedForLanding && image.type !== "logo");

  if (!selectedImages.length) {
    return null;
  }

  const displayImages = selectedImages.slice(0, 8);

  const title =
    mode === "public"
      ? language === "pt-BR"
        ? "Galeria"
        : language === "es"
          ? "Galería"
          : language === "no"
            ? "Galleri"
            : "Gallery"
      : "Galeria da previa";
  const description =
    mode === "public"
      ? language === "pt-BR"
        ? "Veja alguns momentos, detalhes e imagens do salao."
        : language === "es"
          ? "Mira algunos momentos, detalles e imagenes del salon."
          : language === "no"
            ? "Se noen detaljer, oyeblikk og bilder fra salongen."
            : "See a few moments, details, and images from the salon."
      : hasRealImages
        ? "Fotos reais selecionadas para a previa."
        : "Adicione fotos reais do salao antes de publicar.";

  return (
    <section className="bg-[linear-gradient(180deg,#fbf7f2_0%,#ffffff_100%)] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow={copy.galleryTitle}
          title={title}
          description={description}
          align="center"
        />

        <div className="mt-7 grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-12">
          {displayImages.map((image, index) => (
            <figure
              key={image.id}
              className={getGalleryCardClass(index, selectedImages.length)}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading={index > 1 ? "lazy" : "eager"}
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 50vw"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function getGalleryCardClass(index: number, total: number) {
  const base =
    "group relative overflow-hidden rounded-[1.2rem] border border-[#eadfce] bg-zinc-200 shadow-[0_14px_34px_rgba(83,57,33,0.075)] sm:rounded-[1.5rem]";

  if (total === 1) {
    return `${base} col-span-2 aspect-[5/3.5] max-h-[15rem]`;
  }

  if (total === 2) {
    return `${base} aspect-[4/4.6] max-h-[14rem] ${index === 0 ? "xl:col-span-7" : "xl:col-span-5"}`;
  }

  const variants = [
    "col-span-2 aspect-[5/3.3] max-h-[15rem] xl:col-span-5",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-4",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-3",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-3",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-3",
    "col-span-2 aspect-[5/3.5] max-h-[15rem] xl:col-span-6",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-3",
    "aspect-[4/4.8] max-h-[13rem] xl:col-span-3",
  ];

  return `${base} ${variants[index % variants.length]}`;
}
