"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollState, setScrollState] = useState({
    left: 0,
    maxLeft: 0,
  });

  const getClosestIndex = useCallback((track: HTMLDivElement) => {
    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const left = track.scrollLeft;
    const edgeTolerance = 2;

    if (maxLeft > edgeTolerance && left <= edgeTolerance) {
      return 0;
    }

    if (maxLeft > edgeTolerance && left >= maxLeft - edgeTolerance) {
      return Math.max(0, items.length - 1);
    }

    const trackCenter = left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < items.length; index += 1) {
      const item = itemRefs.current[index];

      if (!item) {
        continue;
      }

      const itemCenter = item.offsetLeft + item.clientWidth / 2;
      const distance = Math.abs(trackCenter - itemCenter);

      if (distance < closestDistance) {
        closestIndex = index;
        closestDistance = distance;
      }
    }

    return closestIndex;
  }, [items.length]);

  const measureTrack = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    setScrollState({ left: track.scrollLeft, maxLeft });
    setActiveIndex(getClosestIndex(track));
  }, [getClosestIndex]);

  useEffect(() => {
    frameRef.current = window.requestAnimationFrame(() => {
      const track = trackRef.current;

      if (!track) {
        frameRef.current = null;
        return;
      }

      measureTrack();
      frameRef.current = null;
    });

    window.addEventListener("resize", measureTrack);

    return () => {
      window.removeEventListener("resize", measureTrack);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [measureTrack]);

  function goToItem(nextIndex: number) {
    const track = trackRef.current;
    const clampedIndex = Math.min(
      items.length - 1,
      Math.max(0, nextIndex),
    );
    const item = itemRefs.current[clampedIndex];

    if (!track || !item) {
      return;
    }

    const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const currentLeft = track.scrollLeft;
    const edgeTolerance = 2;
    const direction = nextIndex >= activeIndex ? 1 : -1;
    const centeredTarget =
      item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;
    const boundedTarget = Math.min(maxLeft, Math.max(0, centeredTarget));
    const targetAlreadyReached = Math.abs(boundedTarget - currentLeft) <= edgeTolerance;
    const firstItem = itemRefs.current[0];
    const secondItem = itemRefs.current[1];
    const itemStep =
      firstItem && secondItem
        ? Math.max(1, secondItem.offsetLeft - firstItem.offsetLeft)
        : Math.max(1, item.clientWidth);
    const targetLeft = Math.min(
      maxLeft,
      Math.max(
        0,
        targetAlreadyReached && maxLeft > 0
          ? currentLeft + direction * itemStep
          : boundedTarget,
      ),
    );
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    track.scrollTo({
      left: targetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setScrollState({ left: targetLeft, maxLeft });
    setActiveIndex(clampedIndex);
  }

  function updateActiveItem() {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      const track = trackRef.current;

      if (!track) {
        frameRef.current = null;
        return;
      }

      measureTrack();
      frameRef.current = null;
    });
  }

  return (
    <div className="relative">
      <div className="mb-5 hidden justify-end gap-2 md:flex">
        <button
          type="button"
          onClick={() => goToItem(activeIndex - 1)}
          disabled={
            scrollState.maxLeft === 0 || scrollState.left <= 2
          }
          aria-label="Feedback anterior"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
          style={{ color: accent }}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => goToItem(activeIndex + 1)}
          disabled={
            scrollState.maxLeft === 0 ||
            scrollState.left >= scrollState.maxLeft - 2
          }
          aria-label="Próximo feedback"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 motion-reduce:transition-none"
          style={{ color: accent }}
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={updateActiveItem}
        aria-label="Feedbacks de clientes"
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden motion-reduce:scroll-auto ${items.length < 3 ? "md:justify-center" : "md:justify-start"}`}
      >
        {items.map((item, index) => {
          const active = index === activeIndex;

          return (
            <figure
              key={item.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              aria-current={active ? "true" : undefined}
              className={`min-w-[82%] max-w-[18rem] snap-center transition-[opacity,transform,filter] duration-500 ease-out sm:min-w-[46%] sm:max-w-none md:min-w-[calc((100%-2rem)/3)] md:flex-[0_0_calc((100%-2rem)/3)] motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none ${
                active
                  ? "scale-100 opacity-100"
                  : "scale-[0.985] opacity-80 hover:scale-[0.995] hover:opacity-100"
              }`}
            >
              <div
                className={`relative aspect-[9/16] overflow-hidden rounded-[1.5rem] border bg-white p-2 transition-[border-color,box-shadow,transform] duration-500 ease-out sm:rounded-[2rem] motion-reduce:transition-none ${
                  active
                    ? "border-zinc-300 shadow-[0_24px_55px_rgba(70,42,31,0.12)]"
                    : "border-zinc-200/80 shadow-[0_14px_36px_rgba(70,42,31,0.06)]"
                }`}
              >
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
          );
        })}
      </div>
    </div>
  );
}
