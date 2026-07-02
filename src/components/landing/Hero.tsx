import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import {
  getPrimaryContactAction,
  getPublicContactLinks,
  getPublicHeroCtaLabel,
  getPublicHeroDescription,
  getPublicHeroEyebrow,
  getPublicHeroHeadline,
  getPublicHeroImage,
  getPublicHeroMosaicImages,
  getPublicReviewMetrics,
  getPublicServiceSummary,
  getPublicText,
  shouldShowPublicServices,
} from "@/lib/public-landing";
import type { Salon } from "@/types/salon";

type HeroProps = {
  salon: Salon;
  mode?: "preview" | "public";
};

export function Hero({ salon, mode = "public" }: HeroProps) {
  const copy = getPublicText(salon.language);
  const eyebrow = getPublicHeroEyebrow(salon);
  const heroMosaicImages = getPublicHeroMosaicImages(salon);
  const useHeroMosaic = heroMosaicImages.length >= 2;
  const heroImage = useHeroMosaic ? "" : getPublicHeroImage(salon);
  const primaryContactAction = getPrimaryContactAction(salon);
  const headline = getPublicHeroHeadline(salon);
  const description = getPublicHeroDescription(salon);
  const primaryCtaLabel = getPublicHeroCtaLabel(salon);
  const showServicesCta = mode === "preview" || shouldShowPublicServices(salon);
  const reviewMetrics = getPublicReviewMetrics(salon);
  const serviceSummary = getPublicServiceSummary(salon.services, salon.language);
  const contactLinks = getPublicContactLinks(salon);
  const secondaryAction = contactLinks.find(
    (link) =>
      !link.primary &&
      (link.id === "google" || link.id === "instagram" || link.id === "whatsapp"),
  );
  const trustPoints = buildTrustPoints(salon, serviceSummary);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8f1e8_0%,#fcfaf7_28%,#ffffff_100%)]">
      <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(215,177,129,0.28),transparent_52%)]" />
      <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,228,230,0.9),rgba(255,228,230,0))]" />

      <div className="relative mx-auto max-w-7xl px-5 pb-9 pt-5 sm:px-8 sm:pb-12 lg:px-10 lg:pb-16 lg:pt-9">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="max-w-2xl">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dcc7af] bg-white/80 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8d6239] shadow-sm sm:px-4 sm:text-[0.72rem]">
                <MapPin className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
            ) : null}

            <h1 className="mt-5 font-serif text-[2.2rem] font-semibold leading-[0.98] text-zinc-950 sm:text-[4rem] lg:text-[5.1rem]">
              {salon.name}
            </h1>

            {headline ? (
              <p className="mt-4 max-w-2xl text-[1rem] leading-7 text-zinc-800 sm:text-[1.3rem] sm:leading-9">
                {headline}
              </p>
            ) : null}

            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600 sm:text-base sm:leading-8">
              {description}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {reviewMetrics.averageRating ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dbc9] bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:px-3.5 sm:py-2 sm:text-sm">
                  <Star className="h-4 w-4 fill-[#f4b84f] text-[#f4b84f]" />
                  {reviewMetrics.averageRating.toFixed(1)}
                  <span className="text-zinc-500">
                    {salon.language === "pt-BR"
                      ? "Avaliacao do salao"
                      : salon.language === "es"
                        ? "Valoracion"
                        : salon.language === "no"
                          ? "Vurdering"
                          : "Salon rating"}
                  </span>
                </div>
              ) : null}
              {salon.city ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dbc9] bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:px-3.5 sm:py-2 sm:text-sm">
                  <Sparkles className="h-4 w-4 text-[#9a6b3d]" />
                  {salon.city}
                </div>
              ) : null}
              {serviceSummary ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e7dbc9] bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:px-3.5 sm:py-2 sm:text-sm">
                  <CalendarDays className="h-4 w-4 text-[#9a6b3d]" />
                  {serviceSummary}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              {primaryContactAction.href ? (
                <a
                  href={primaryContactAction.href}
                  target={primaryContactAction.external ? "_blank" : undefined}
                  rel={primaryContactAction.external ? "noreferrer" : undefined}
                  className="btn btn-primary min-h-[3.25rem] w-full px-6 py-3 text-sm active:scale-[0.99] sm:min-h-14 sm:w-auto sm:py-3.5 sm:text-base"
                >
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ) : null}
              {secondaryAction ? (
                <a
                  href={secondaryAction.href}
                  target={secondaryAction.external ? "_blank" : undefined}
                  rel={secondaryAction.external ? "noreferrer" : undefined}
                  className="btn btn-secondary min-h-[3.25rem] w-full px-6 py-3 text-sm active:scale-[0.99] sm:min-h-14 sm:w-auto sm:py-3.5 sm:text-base"
                >
                  {secondaryAction.label}
                </a>
              ) : null}
              {showServicesCta ? (
                <a
                  href="#services"
                  className="btn w-full border border-[#d8c6af] bg-[#fff8f0] px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.99] sm:w-auto sm:py-3.5 sm:text-base"
                >
                  {copy.exploreServices}
                </a>
              ) : null}
            </div>

            {trustPoints.length ? (
              <div className="mt-7 hidden gap-3 sm:grid sm:grid-cols-2">
                {trustPoints.map((point) => (
                  <div
                    key={`${point.label}-${point.value}`}
                    className="rounded-[1.4rem] border border-[#eadfce] bg-white/82 px-4 py-4 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#9a6b3d]">
                      {point.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-800">{point.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-10 hidden h-24 w-24 rounded-full bg-[#f6d7c7]/60 blur-2xl lg:block" />
            <div className="absolute -right-6 bottom-8 hidden h-32 w-32 rounded-full bg-[#ead7bb]/70 blur-3xl lg:block" />
            {useHeroMosaic ? (
              <HeroMosaic images={heroMosaicImages} salon={salon} />
            ) : (
              <HeroImageCard heroImage={heroImage} salon={salon} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroImageCard({
  heroImage,
  salon,
}: {
  heroImage: string;
  salon: Salon;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/60 bg-[#efe4d5] p-2 shadow-[0_20px_50px_rgba(83,57,33,0.13)] sm:rounded-[2.4rem] sm:p-3 sm:shadow-[0_32px_80px_rgba(83,57,33,0.16)]">
      <div className="relative aspect-[4/3] max-h-[17.5rem] overflow-hidden rounded-[1.25rem] bg-zinc-200 sm:aspect-[5/5.3] sm:max-h-none sm:rounded-[2rem]">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={
              salon.hasRealImages
                ? `${salon.name} salon`
                : `${salon.name} beauty atmosphere`
            }
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#f3e7d8_0%,#fffaf4_100%)]" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
    </div>
  );
}

function HeroMosaic({
  images,
  salon,
}: {
  images: Salon["gallery"];
  salon: Salon;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/60 bg-[#f4eadf] p-2 shadow-[0_20px_50px_rgba(83,57,33,0.13)] sm:rounded-[2.4rem] sm:p-3 sm:shadow-[0_32px_80px_rgba(83,57,33,0.16)]">
      <div className="grid grid-cols-[1.08fr_0.92fr] gap-2 sm:gap-3">
        <div className="relative min-h-[15rem] overflow-hidden rounded-[1.25rem] bg-zinc-200 sm:min-h-[33rem] sm:rounded-[2rem]">
          <Image
            src={images[0].src}
            alt={images[0].alt}
            fill
            priority
            sizes="(min-width: 1024px) 27vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>
        <div className="grid gap-2 sm:gap-3">
          {images.slice(1, 3).map((image, index) => (
            <div
              key={image.id}
              className={`relative overflow-hidden rounded-[1.25rem] bg-zinc-200 sm:rounded-[2rem] ${
                index === 0 ? "min-h-[7.25rem] sm:min-h-[16rem]" : "min-h-[7rem] sm:min-h-[16rem]"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt || `${salon.name} detail`}
                fill
                sizes="(min-width: 1024px) 18vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildTrustPoints(salon: Salon, serviceSummary: string) {
  const points: Array<{ label: string; value: string }> = [];

  if (salon.location) {
    points.push({
      label: salon.language === "pt-BR" ? "Localizacao" : "Location",
      value: salon.location,
    });
  }

  if (serviceSummary) {
    points.push({
      label: salon.language === "pt-BR" ? "Servicos" : "Services",
      value: serviceSummary,
    });
  }

  if (salon.businessHours) {
    points.push({
      label: salon.language === "pt-BR" ? "Horarios" : "Hours",
      value: salon.businessHours,
    });
  }

  return points.slice(0, 3);
}
