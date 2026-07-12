"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";

export type FeedbackScreenshotCarouselItem = {
  id: string;
  src: string;
  alt: string;
};

export function FeedbackScreenshotCarousel({
  items,
  accent,
}: {
  items: FeedbackScreenshotCarouselItem[];
  accent: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(direction: -1 | 1) {
    trackRef.current?.scrollBy({
      left: direction * Math.max(trackRef.current.clientWidth * 0.82, 280),
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div className="mb-5 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Feedback anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white transition hover:-translate-y-0.5 hover:border-zinc-950"
          style={{ color: accent }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Próximo feedback"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white transition hover:-translate-y-0.5 hover:border-zinc-950"
          style={{ color: accent }}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={trackRef}
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${items.length < 3 ? "md:justify-center" : "md:justify-start"}`}
      >
        {items.map((item) => (
          <figure
            key={item.id}
            className="min-w-[82%] max-w-[18rem] snap-center sm:min-w-[46%] sm:max-w-none md:min-w-[calc((100%-2rem)/3)] md:flex-[0_0_calc((100%-2rem)/3)]"
          >
            <div className="relative aspect-[9/16] overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white p-2 shadow-[0_18px_45px_rgba(70,42,31,0.08)] sm:rounded-[2rem]">
              <div className="relative h-full w-full overflow-hidden rounded-[1.15rem] bg-[#f8f5f0]">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 30vw, 82vw"
                  className="object-contain"
                />
              </div>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}
