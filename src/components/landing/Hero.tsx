import {
  ArrowRight,
  MapPin,
  Sparkles,
  Star,
} from "lucide-react";
import { LandingImage } from "./LandingImage";
import {
  getPrimaryContactAction,
  getPublicContactLinks,
  getPublicHeroCtaLabel,
  getPublicHeroDescription,
  getPublicHeroEyebrow,
  getPublicHeroHeadline,
  getPublicHeroImage,
  getPublicHeroMosaicImages,
  getPublicHeroOverlay,
  getPublicReviewMetrics,
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
  const contactLinks = getPublicContactLinks(salon);
  const secondaryAction = contactLinks.find(
    (link) =>
      !link.primary &&
      (link.id === "google" || link.id === "instagram" || link.id === "whatsapp"),
  );
  const trustPoints = buildTrustPoints(salon);

  return (
    <section className="relative overflow-hidden border-b border-[#eadfce]/70 bg-[linear-gradient(180deg,#fbf5ed_0%,#fcfaf7_42%,#ffffff_100%)]">
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-8 sm:pb-12 lg:px-10 lg:pb-16 lg:pt-9">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10">
          <div className="max-w-2xl">
            {eyebrow ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dcc7af] bg-white/86 px-3.5 py-2 text-[0.68rem] font-semibold uppercase tracking-normal text-[#8d6239] shadow-sm sm:px-4 sm:text-[0.72rem]">
                <MapPin className="h-3.5 w-3.5" />
                {eyebrow}
              </div>
            ) : null}

            <h1 className="mt-4 font-serif text-[2.05rem] font-semibold leading-[1.02] text-zinc-950 sm:text-[3.55rem] lg:text-[4.85rem]">
              {salon.name}
            </h1>

            {headline ? (
              <p className="mt-3 max-w-2xl text-[1rem] leading-7 text-zinc-800 sm:text-[1.26rem] sm:leading-8">
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
                      ? "Avaliação do salão"
                      : salon.language === "es"
                        ? "Valoración"
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
                  className={`btn border border-[#d8c6af] bg-[#fff8f0] px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.99] sm:w-auto sm:py-3.5 sm:text-base ${
                    primaryContactAction.href && mode === "public"
                      ? "hidden sm:inline-flex"
                      : "w-full"
                  }`}
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
                    <p className="text-[0.68rem] font-semibold uppercase tracking-normal text-[#9a6b3d]">
                      {point.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-zinc-800">{point.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
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
  const overlay = getPublicHeroOverlay(salon);
  const hasOverlay = Boolean(overlay.title || overlay.subtitle);

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/60 bg-[#efe4d5] p-2 shadow-[0_20px_50px_rgba(83,57,33,0.13)] sm:rounded-[2.4rem] sm:p-3 sm:shadow-[0_32px_80px_rgba(83,57,33,0.16)]">
      <div className="relative aspect-[4/3] max-h-[17.5rem] overflow-hidden rounded-[1.25rem] bg-zinc-200 sm:aspect-[5/5.3] sm:max-h-none sm:rounded-[2rem]">
        {heroImage ? (
          <LandingImage
            image={heroImage}
            imageId="hero"
            salonSlug={salon.slug}
            section="hero"
            alt={
              salon.hasRealImages
                ? `${salon.name} salon`
                : `${salon.name} beauty atmosphere`
            }
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.02]"
            fallback={<HeroMediaFallback salonName={salon.name} />}
          />
        ) : (
          <HeroMediaFallback salonName={salon.name} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/30 to-transparent" />
        {hasOverlay ? (
          <div className="absolute inset-x-3 bottom-3 rounded-[1rem] border border-white/40 bg-white/90 px-3.5 py-3 shadow-[0_14px_32px_rgba(24,24,27,0.16)] backdrop-blur">
            {overlay.title ? (
              <p className="line-clamp-1 text-xs font-semibold text-zinc-950">
                {overlay.title}
              </p>
            ) : null}
            {overlay.subtitle ? (
              <p className="mt-1 line-clamp-1 text-xs text-zinc-600">
                {overlay.subtitle}
              </p>
            ) : null}
          </div>
        ) : null}
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
          <LandingImage
            image={images[0]}
            salonSlug={salon.slug}
            section="hero-mosaic"
            alt={images[0].alt}
            fill
            priority
            sizes="(min-width: 1024px) 27vw, 100vw"
            className="object-cover transition-transform duration-700 hover:scale-[1.02]"
            fallback={<HeroMediaFallback salonName={salon.name} compact />}
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
              <LandingImage
                image={image}
                salonSlug={salon.slug}
                section="hero-mosaic"
                alt={image.alt || `${salon.name} detail`}
                fill
                sizes="(min-width: 1024px) 18vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                fallback={<HeroMediaFallback salonName={salon.name} compact />}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroMediaFallback({
  salonName,
  compact = false,
}: {
  salonName: string;
  compact?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#f3e7d8_0%,#fffaf4_100%)] px-5 text-center">
      <span
        className={`font-serif font-semibold text-[#8d6239]/80 ${
          compact ? "text-xl" : "text-3xl"
        }`}
      >
        {salonName}
      </span>
    </div>
  );
}

function buildTrustPoints(salon: Salon) {
  const points: Array<{ label: string; value: string }> = [];

  if (salon.location) {
    points.push({
      label: salon.language === "pt-BR" ? "Localização" : "Location",
      value: salon.location,
    });
  }

  if (salon.businessHours) {
    points.push({
      label: salon.language === "pt-BR" ? "Horários" : "Hours",
      value: salon.businessHours,
    });
  }

  return points.slice(0, 3);
}

