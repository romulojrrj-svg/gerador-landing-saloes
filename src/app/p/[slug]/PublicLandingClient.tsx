"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileWarning,
  Globe,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Gallery, Hero, Services, Testimonials } from "@/components/landing";
import { LandingImage } from "@/components/landing/LandingImage";
import { detectBrowserLanguage, getLandingCopy } from "@/lib/landing-copy";
import {
  getAppliedCopy,
  getPublicAboutText,
  getPublicContactLinks,
  getPublicGalleryImages,
  getPublicSpaceImages,
  getPublicSpaceSectionCopy,
  getPublicText,
} from "@/lib/public-landing";
import {
  getPublicSalonBySlug,
  subscribeToSalonRepository,
} from "@/lib/salon-repository";
import type { Salon } from "@/types/salon";

type PublicLandingClientProps = {
  slug: string;
  initialSalon?: Salon | null;
  skipClientLoad?: boolean;
};

export function PublicLandingClient({
  slug,
  initialSalon = null,
  skipClientLoad = false,
}: PublicLandingClientProps) {
  const [salon, setSalon] = useState<Salon | null>(initialSalon);
  const [loadError, setLoadError] = useState("");
  const [hasCheckedStorage, setHasCheckedStorage] = useState(
    Boolean(initialSalon) || skipClientLoad,
  );

  useEffect(() => {
    if (initialSalon || skipClientLoad) {
      return;
    }

    let isActive = true;

    async function loadSalon() {
      setHasCheckedStorage(false);
      const result = await getPublicSalonBySlug(slug);

      if (!isActive) {
        return;
      }

      setSalon(result.ok ? result.salon : null);
      setLoadError(result.ok ? "" : result.error);
      setHasCheckedStorage(true);
    }

    void loadSalon();
    const unsubscribe = subscribeToSalonRepository(() => {
      void loadSalon();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [initialSalon, skipClientLoad, slug]);

  if (!hasCheckedStorage) {
    return <PublicLoading />;
  }

  if (!salon && loadError) {
    return <PublicLoadError message={loadError} slug={slug} />;
  }

  if (!salon) {
    return <PublicNotFound />;
  }

  return (
    <main className="bg-[#fcfaf7]">
      <Hero salon={salon} mode="public" />
      <PublicAbout salon={salon} />
      <Services services={salon.services} language={salon.language} salon={salon} />
      <PublicSpaceSection salon={salon} />
      <Gallery
        images={getPublicGalleryImages(salon)}
        salonSlug={salon.slug}
        salonName={salon.name}
        location={salon.location}
        language={salon.language}
        hasRealImages={salon.hasRealImages}
        mode="public"
      />
      <Testimonials
        testimonials={salon.testimonials}
        language={salon.language}
        salon={salon}
        mode="public"
      />
      <PublicContactSection salon={salon} />
    </main>
  );
}

function PublicSpaceSection({ salon }: { salon: Salon }) {
  const [failedImageIds, setFailedImageIds] = useState<string[]>([]);
  const images = getPublicSpaceImages(salon).filter(
    (image) => !failedImageIds.includes(image.id),
  );

  if (!images.length) {
    return null;
  }

  const { title, description } = getPublicSpaceSectionCopy(
    salon.language,
    salon.layoutImagePlan?.spaceTitle,
    salon.layoutImagePlan?.spaceDescription,
  );

  return (
    <section className="px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-5 rounded-[1.8rem] border border-[#eadfce] bg-white/88 p-5 shadow-[0_20px_48px_rgba(83,57,33,0.065)] sm:rounded-[2.4rem] sm:p-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div>
          <SectionBadge label={title} />
          <h2 className="mt-4 font-serif text-[1.9rem] font-semibold leading-tight text-zinc-950 sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
              {description}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {images.slice(0, 3).map((image, index) => (
            <figure
              key={image.id}
              className={`relative overflow-hidden rounded-[1.2rem] border border-[#eadfce] bg-zinc-200 shadow-sm ${
                index === 0
                  ? "col-span-2 aspect-[4/3] max-h-[16rem]"
                  : "aspect-[4/4.3] max-h-[12rem]"
              }`}
            >
              <LandingImage
                image={image}
                salonSlug={salon.slug}
                section="space"
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 28vw, 50vw"
                loading="lazy"
                className="object-cover transition duration-700 hover:scale-[1.03]"
                onLoadError={(imageId) =>
                  setFailedImageIds((current) =>
                    current.includes(imageId) ? current : [...current, imageId],
                  )
                }
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function PublicAbout({ salon }: { salon: Salon }) {
  const copy = getPublicText(salon.language);
  const appliedCopy = getAppliedCopy(salon);
  const aboutText = getPublicAboutText(salon);
  const detailItems = [
    salon.address
      ? {
          icon: MapPin,
          label: salon.language === "pt-BR" ? "Endereço" : "Address",
          value: salon.address,
        }
      : null,
    salon.phone
      ? {
          icon: Phone,
          label: salon.language === "pt-BR" ? "Telefone" : "Phone",
          value: salon.phone,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof MapPin;
    label: string;
    value: string;
  }>;
  const detailGridClass =
    detailItems.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section className="px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-[1.8rem] border border-[#eadfce] bg-white/82 px-5 py-7 shadow-[0_18px_44px_rgba(83,57,33,0.055)] backdrop-blur sm:rounded-[2.3rem] sm:px-8 sm:py-9">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionBadge label={appliedCopy?.aboutTitle || copy.aboutTitle} />
            <h2 className="mt-4 font-serif text-[1.9rem] font-semibold leading-tight text-zinc-950 sm:text-4xl">
              {salon.name}
            </h2>
          </div>

          <div>
            <p className="text-[0.98rem] leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              {aboutText}
            </p>

            {detailItems.length ? (
              <div className={`mt-5 grid gap-2.5 ${detailGridClass}`}>
                {detailItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="rounded-[1.1rem] border border-[#eadfce] bg-[#fffaf4] px-3.5 py-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-normal text-[#9a6b3d]">
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-700">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PublicContactSection({ salon }: { salon: Salon }) {
  const links = getPublicContactLinks(salon);

  if (!links.length) {
    return null;
  }

  const icons = {
    booking: CalendarDays,
    whatsapp: MessageCircle,
    phone: Phone,
    instagram: Globe,
    google: MapPinned,
    website: Globe,
  } as const;

  return (
    <section className="px-4 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto max-w-6xl rounded-[1.8rem] border border-[#eadfce] bg-[linear-gradient(135deg,#fff9f2_0%,#ffffff_48%,#fbf5ed_100%)] p-5 shadow-[0_22px_56px_rgba(83,57,33,0.08)] sm:rounded-[2.4rem] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div>
            <SectionBadge label={salon.language === "pt-BR" ? "Contato" : "Contact"} />
            <h2 className="mt-4 font-serif text-[1.9rem] font-semibold leading-tight text-zinc-950 sm:text-5xl">
              {salon.language === "pt-BR"
                ? "Planeje sua visita"
                : salon.language === "es"
                  ? "Planifica tu visita"
                  : salon.language === "no"
                    ? "Planlegg besøket ditt"
                    : "Plan your visit"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
              {salon.language === "pt-BR"
                ? "Fale com o salão pelo canal que preferir para tirar dúvidas, ver a localização ou combinar seu atendimento."
                : salon.language === "es"
                  ? "Elige el mejor canal para resolver dudas, ver la ubicación o coordinar tu cita."
                  : salon.language === "no"
                    ? "Velg kanalen som passer best for spørsmål, booking eller veibeskrivelse."
                    : "Choose the best channel for questions, booking, or directions."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-zinc-600">
              {salon.location ? <DetailPill icon={MapPin} text={salon.location} /> : null}
              {salon.businessHours ? (
                <DetailPill icon={Clock3} text={salon.businessHours} />
              ) : null}
              {salon.phone ? <DetailPill icon={Phone} text={salon.phone} /> : null}
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {links.map((link) => {
              const Icon = icons[link.id];
              const isPrimary = Boolean(link.primary);
              const isWhatsapp = link.id === "whatsapp" && isPrimary;
              const isInstagram = link.id === "instagram";

              return (
                <a
                  key={link.id}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                  className={
                    isPrimary
                      ? isWhatsapp
                        ? "flex min-h-[3.35rem] items-center gap-3 rounded-[1.1rem] border border-[#24b75d] bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(34,197,94,0.22)] transition hover:-translate-y-0.5 hover:bg-[#16a34a] active:scale-[0.99] md:col-span-2 xl:col-span-2"
                        : "flex min-h-[3.35rem] items-center gap-3 rounded-[1.1rem] border border-[#d6be9e] bg-[#fff4e7] px-4 py-3 text-sm font-semibold text-zinc-950 shadow-[0_16px_34px_rgba(170,125,74,0.16)] transition hover:-translate-y-0.5 hover:bg-[#fde8d0] active:scale-[0.99] md:col-span-2 xl:col-span-2"
                      : "flex min-h-[3.25rem] items-center gap-3 rounded-[1.1rem] border border-[#eadfce] bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-[#d8c6af] hover:bg-[#fffaf3] active:scale-[0.99]"
                  }
                >
                  {isInstagram ? (
                    <span className="relative h-5 w-5 shrink-0 overflow-hidden rounded-[0.42rem]">
                      <Image
                        src="/brand/instagram-icon.png"
                        alt=""
                        fill
                        sizes="20px"
                        className="object-contain"
                      />
                    </span>
                  ) : (
                    <Icon
                      className={
                        isPrimary
                          ? isWhatsapp
                            ? "h-4 w-4 text-white"
                            : "h-4 w-4 text-[#9a6b3d]"
                          : "h-4 w-4 text-[#9a6b3d]"
                      }
                    />
                  )}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionBadge({ label }: { label: string }) {
  return (
    <p className="inline-flex items-center rounded-full border border-[#d8c6af] bg-[#fff9f2] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-normal text-[#9a6b3d]">
      {label}
    </p>
  );
}

function DetailPill({
  icon: Icon,
  text,
}: {
  icon: typeof MapPin;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#eadfce] bg-white px-3.5 py-2 text-sm leading-5">
      <Icon className="h-4 w-4 text-[#9a6b3d]" />
      {text}
    </span>
  );
}

function PublicLoading() {
  return (
    <main className="min-h-screen bg-[#fcfaf7]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 lg:px-10">
        <div className="h-14 animate-pulse rounded-[1.2rem] border border-[#eadfce] bg-white/80" />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-[#eadfce] bg-white/90 p-6 shadow-sm">
            <div className="h-6 w-28 animate-pulse rounded-full bg-zinc-200" />
            <div className="mt-5 h-10 w-3/4 animate-pulse rounded-full bg-zinc-200" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-zinc-100" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded-full bg-zinc-100" />
            <div className="mt-6 h-12 w-40 animate-pulse rounded-full bg-[#f2e8da]" />
          </div>

          <div className="rounded-[2rem] border border-[#eadfce] bg-white/90 p-6 shadow-sm">
            <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-200" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.1rem] border border-[#f0e6d8] bg-[#faf6ef]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PublicLoadError({
  message,
  slug,
}: {
  message: string;
  slug: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfaf7] px-6 py-16">
      <div className="w-full max-w-xl rounded-[2rem] border border-amber-200 bg-white p-8 text-center shadow-[0_20px_52px_rgba(83,57,33,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <FileWarning className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-serif text-3xl font-semibold text-zinc-950">
          Nao foi possivel carregar esta landing agora.
        </h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600">{message}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-primary min-h-11 px-5 py-3"
          >
            Tentar novamente
          </button>
          <Link href={`/p/${slug}`} className="btn btn-secondary min-h-11 px-5 py-3">
            Reabrir landing
          </Link>
        </div>
      </div>
    </main>
  );
}

function PublicNotFound() {
  const copy = getLandingCopy(detectBrowserLanguage());

  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-2xl shadow-zinc-950/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-800">
            <FileWarning className="h-6 w-6" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-semibold text-zinc-950">
            {copy.publicNotFoundTitle}
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            {copy.publicNotFoundText}
          </p>
          <div className="mt-7 flex justify-center">
            <Link href="/" className="btn btn-primary px-5 py-3">
              {copy.backToPanel}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
