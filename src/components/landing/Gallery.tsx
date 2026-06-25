import Image from "next/image";
import type { SalonGalleryImage } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type GalleryProps = {
  images: SalonGalleryImage[];
};

export function Gallery({ images }: GalleryProps) {
  return (
    <section className="bg-[#f7f3ef] px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Atmosphere"
          title="Every image should make the salon feel instantly bookable."
          description="The generated landing page will pair brand copy with a refined visual rhythm for interiors, services, and signature transformations."
          align="center"
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((image, index) => (
            <figure
              key={image.src}
              className={`relative overflow-hidden rounded-[2rem] bg-zinc-200 shadow-xl shadow-zinc-950/10 ${
                index === 0 || index === 3
                  ? "aspect-[4/5]"
                  : "aspect-[4/4] lg:mt-12"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-700 hover:scale-105"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
