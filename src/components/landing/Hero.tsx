import Image from "next/image";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { Salon } from "@/types/salon";

type HeroProps = {
  salon: Salon;
};

export function Hero({ salon }: HeroProps) {
  return (
    <section className="relative min-h-[86vh] overflow-hidden bg-zinc-950 text-white">
      <Image
        src={salon.heroImage}
        alt={`${salon.name} salon interior`}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.82)_0%,rgba(9,9,11,0.58)_42%,rgba(9,9,11,0.16)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950/80 to-transparent" />

      <div className="relative mx-auto flex min-h-[86vh] max-w-7xl items-end px-6 py-12 sm:px-8 lg:px-10">
        <div className="max-w-3xl pb-4 sm:pb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-rose-50 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            {salon.eyebrow}
          </div>
          <h1 className="mt-7 text-5xl font-semibold leading-[0.95] tracking-normal text-white sm:text-6xl lg:text-7xl">
            {salon.name}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-100 sm:text-xl">
            {salon.tagline}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#booking"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-rose-100"
            >
              Book consultation
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explore services
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 text-sm text-zinc-100 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rose-200" />
              {salon.location}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rose-200" />
              Private appointments
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-200" />
              Editorial beauty
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
