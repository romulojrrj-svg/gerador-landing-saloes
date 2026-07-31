"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { LandingImage } from "./LandingImage";
import type {
  SalonGalleryImage,
  SalonPremiumEditorialGalleryItem,
  SalonPremiumEditorialGallerySection,
  SalonPremiumEditorialTestimonial,
} from "@/types/salon";

type ResolvedGalleryItem = {
  item: SalonPremiumEditorialGalleryItem;
  image?: SalonGalleryImage;
  src?: string;
};

export type EditorialTestimonialItem = {
  testimonial: SalonPremiumEditorialTestimonial;
  src?: string;
};

export function EditorialGallerySection({
  section,
  images,
  salonSlug,
  accent,
}: {
  section?: SalonPremiumEditorialGallerySection;
  images: Map<string, SalonGalleryImage>;
  salonSlug: string;
  accent: string;
}) {
  const items = resolveGalleryItems(section, images);
  const [activeImage, setActiveImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (!section?.enabled || !items.length) {
    return null;
  }

  function openImage(
    event: MouseEvent<HTMLButtonElement>,
    resolved: ResolvedGalleryItem,
  ) {
    if (!resolved.src) return;
    triggerRef.current = event.currentTarget;
    setActiveImage({
      src: resolved.src,
      alt: resolved.item.alt?.trim() || resolved.item.caption?.trim() || "",
      caption: resolved.item.caption?.trim() || undefined,
    });
  }

  function closeImage() {
    setActiveImage(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <>
      <section
        id="editorial-gallery"
        className="bg-white px-5 py-14 sm:px-8 md:py-24 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            {section.eyebrow ? (
              <p
                className="text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
                style={{ color: accent }}
              >
                {section.eyebrow}
              </p>
            ) : null}
            {section.title ? (
              <h2 className="mt-3 font-serif text-[2.05rem] leading-tight sm:text-4xl">
                {section.title}
              </h2>
            ) : null}
            {section.description ? (
              <p className="mt-3 max-w-xl text-[0.92rem] leading-7 text-zinc-600 sm:text-base">
                {section.description}
              </p>
            ) : null}
          </div>

          <div className="mt-8 grid min-w-0 grid-cols-1 gap-4 md:auto-rows-[12rem] md:grid-cols-12">
            {items.map((resolved, index) => {
              const isFeatured = items.length > 1 && index === 0;
              const itemClassName =
                items.length === 1
                  ? "min-w-0 md:col-span-12 md:row-span-2"
                  : isFeatured
                    ? "min-w-0 md:col-span-7 md:row-span-2"
                    : "min-w-0 md:col-span-5";
              const alt =
                resolved.item.alt?.trim() ||
                resolved.item.caption?.trim() ||
                "";

              return (
                <figure
                  key={resolved.item.id}
                  className={itemClassName}
                >
                  <button
                    type="button"
                    onClick={(event) => openImage(event, resolved)}
                    className="group relative block aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[1.75rem] bg-zinc-100 text-left focus:outline-none focus:ring-2 focus:ring-offset-4 md:aspect-auto md:h-full md:min-h-64"
                    style={{ outlineColor: accent }}
                    aria-label={
                      resolved.item.caption?.trim() ||
                      (alt ? `Ampliar imagem: ${alt}` : "Ampliar imagem")
                    }
                  >
                    {resolved.image ? (
                      <LandingImage
                        image={resolved.image}
                        salonSlug={salonSlug}
                        section="premium-editorial-gallery"
                        imageId={resolved.image.id}
                        alt={alt}
                        fill
                        sizes={
                          isFeatured
                            ? "(min-width: 768px) 58vw, 100vw"
                            : "(min-width: 768px) 42vw, 100vw"
                        }
                        className="object-cover transition duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                      />
                    ) : resolved.src ? (
                      <Image
                        src={resolved.src}
                        alt={alt}
                        fill
                        unoptimized
                        sizes="(min-width: 768px) 42vw, 100vw"
                        className="object-cover transition duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
                      />
                    ) : null}
                    <span
                      className="absolute inset-x-4 bottom-4 flex justify-end opacity-0 transition group-hover:opacity-100 motion-reduce:transition-none"
                      aria-hidden="true"
                    >
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm">
                        Ampliar
                      </span>
                    </span>
                  </button>
                  {resolved.item.caption?.trim() ? (
                    <figcaption className="mt-2 px-1 text-sm text-zinc-600">
                      {resolved.item.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {activeImage ? (
        <EditorialImageModal
          src={activeImage.src}
          alt={activeImage.alt}
          caption={activeImage.caption}
          onClose={closeImage}
        />
      ) : null}
    </>
  );
}

export function EditorialTestimonialsSection({
  items,
  eyebrow,
  title,
  description,
  accent,
}: {
  items: EditorialTestimonialItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  accent: string;
}) {
  const validItems = items.filter(
    (item) =>
      Boolean(item.testimonial.quote?.trim()) ||
      Boolean(item.src && item.testimonial.showOriginalImage),
  );
  const [activeImage, setActiveImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  if (!validItems.length) {
    return null;
  }

  function openImage(
    event: MouseEvent<HTMLButtonElement>,
    item: EditorialTestimonialItem,
  ) {
    if (!item.src) return;
    triggerRef.current = event.currentTarget;
    setActiveImage({
      src: item.src,
      alt: item.testimonial.originalImageAlt?.trim() || "",
    });
  }

  function closeImage() {
    setActiveImage(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <>
      <section className="bg-[#fbf8f5] px-5 py-12 sm:px-8 md:py-20 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl border-b border-zinc-200 pb-5">
            {eyebrow ? (
              <p
                className="text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
                style={{ color: accent }}
              >
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="mt-3 font-serif text-2xl leading-tight sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-3 text-[0.9rem] leading-7 text-zinc-600">
                {description}
              </p>
            ) : null}
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {validItems.map(({ testimonial, src }) => (
              <article
                key={testimonial.id}
                className={`rounded-[1.5rem] border border-zinc-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(70,42,31,0.04)] ${testimonial.featured ? "md:col-span-2" : ""}`}
              >
                {testimonial.quote?.trim() ? (
                  <blockquote className="font-serif text-lg leading-8 text-zinc-800 sm:text-xl">
                    “{testimonial.quote}”
                  </blockquote>
                ) : null}
                {testimonial.authorName?.trim() || testimonial.authorRole?.trim() ? (
                  <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {testimonial.authorName?.trim()}
                    {testimonial.authorName?.trim() && testimonial.authorRole?.trim()
                      ? " · "
                      : null}
                    {testimonial.authorRole?.trim()}
                  </p>
                ) : null}
                {src && testimonial.showOriginalImage && !testimonial.quote?.trim() ? (
                  <button
                    type="button"
                    onClick={(event) => openImage(event, { testimonial, src })}
                    className="mt-5 block w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 motion-reduce:transition-none"
                    style={{ outlineColor: accent }}
                    aria-label="Ampliar depoimento original"
                  >
                    <Image
                      src={src}
                      alt={testimonial.originalImageAlt?.trim() || ""}
                      width={1200}
                      height={900}
                      unoptimized
                      className="max-h-80 w-full object-contain"
                    />
                  </button>
                ) : null}
                {src && testimonial.showOriginalImage ? (
                  <button
                    type="button"
                    onClick={(event) => openImage(event, { testimonial, src })}
                    className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:border-zinc-500 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-offset-2 motion-reduce:transition-none"
                    style={{ outlineColor: accent }}
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${accent}22`, color: accent }}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    Ver depoimento original
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {activeImage ? (
        <EditorialImageModal
          src={activeImage.src}
          alt={activeImage.alt}
          onClose={closeImage}
        />
      ) : null}
    </>
  );
}

function resolveGalleryItems(
  section: SalonPremiumEditorialGallerySection | undefined,
  images: Map<string, SalonGalleryImage>,
) {
  if (!section?.enabled || !Array.isArray(section.items)) {
    return [];
  }

  return section.items
    .map((item) => ({
      item,
      image: item.imageId ? images.get(item.imageId) : undefined,
      src: item.imageId
        ? images.get(item.imageId)?.src || item.imageUrl
        : item.imageUrl,
    }))
    .filter((item) => Boolean(item.src?.trim()));
}

function EditorialImageModal({
  src,
  alt,
  caption,
  onClose,
}: {
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      event.preventDefault();
      closeRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt || "Visualização ampliada"}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-zinc-950/80 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] max-w-5xl flex-col items-center gap-3"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
          aria-label="Fechar imagem"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="relative max-h-[82dvh] max-w-[min(90vw,70rem)] overflow-hidden rounded-2xl bg-zinc-900">
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1600}
            unoptimized
            className="max-h-[82dvh] w-auto max-w-full object-contain"
          />
        </div>
        {caption ? (
          <p className="max-w-2xl text-center text-sm text-white/90">{caption}</p>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
