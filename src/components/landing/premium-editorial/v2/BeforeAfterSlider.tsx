"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LandingImage } from "./LandingImage";
import type { SalonGalleryImage } from "@/types/salon";

type BeforeAfterSliderProps = {
  beforeImage: SalonGalleryImage;
  afterImage: SalonGalleryImage;
  salonSlug: string;
  title: string;
  beforeLabel: string;
  afterLabel: string;
  adjustLabel: string;
};

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  salonSlug,
  title,
  beforeLabel,
  afterLabel,
  adjustLabel,
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);

  function updateFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const next = ((event.clientX - bounds.left) / bounds.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }

  function updateFromKeyboard(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setPosition((current) => Math.max(0, current - 5));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setPosition((current) => Math.min(100, current + 5));
    }
  }

  return (
    <div className="group">
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden bg-zinc-200"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            updateFromPointer(event);
          }
        }}
      >
        <LandingImage
          image={afterImage}
          salonSlug={salonSlug}
          section="premium-before-after-after"
          imageId={afterImage.id}
          alt={`${title} after`}
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="pointer-events-none select-none object-cover object-center"
          draggable={false}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden="true"
        >
          <LandingImage
            image={beforeImage}
            salonSlug={salonSlug}
            section="premium-before-after-before"
            imageId={beforeImage.id}
            alt={`${title} before`}
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="pointer-events-none select-none object-cover object-center"
            draggable={false}
          />
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white shadow-[0_0_0_1px_rgba(24,24,27,0.12)]"
          style={{ left: `${position}%` }}
        >
          <button
            type="button"
            aria-label={`${adjustLabel}: ${title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            role="slider"
            tabIndex={0}
            onKeyDown={updateFromKeyboard}
            className="pointer-events-auto absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-900 shadow-xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <ChevronLeft className="h-4 w-4" />
            <ChevronRight className="-ml-2 h-4 w-4" />
          </button>
        </div>
        <span className="absolute left-3 top-3 z-20 rounded-full bg-white/90 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-zinc-800 shadow-sm">
          {beforeLabel}
        </span>
        <span className="absolute right-3 top-3 z-20 rounded-full bg-zinc-950/75 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
          {afterLabel}
        </span>
      </div>
    </div>
  );
}
