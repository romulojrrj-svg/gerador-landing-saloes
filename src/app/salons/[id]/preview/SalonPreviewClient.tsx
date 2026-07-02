"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Eye,
  FileWarning,
  Globe2,
  MapPin,
  MessageCircle,
  Plus,
  Sparkles,
} from "lucide-react";
import { CTA, Gallery, Hero, Services, Testimonials } from "@/components/landing";
import {
  getLandingCopy,
  translateStatLabel,
  type LandingCopy,
} from "@/lib/landing-copy";
import {
  getSalonBySlug,
  getSalonRepositoryStatus,
  getSalonRepositorySourceLabel,
  subscribeToSalonRepository,
  type SalonRepositorySource,
} from "@/lib/salon-repository";
import {
  landingLanguageLabels,
} from "@/lib/salon-storage";
import type { Salon } from "@/types/salon";

type SalonPreviewClientProps = {
  slug: string;
  fallbackSalon: Salon;
};

export function SalonPreviewClient({
  slug,
  fallbackSalon,
}: SalonPreviewClientProps) {
  const repositoryStatus = getSalonRepositoryStatus();
  const [storedSalon, setStoredSalon] = useState<Salon | null>(null);
  const [source, setSource] = useState<SalonRepositorySource>(
    repositoryStatus.activeSource,
  );
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const salon = hasCheckedStorage ? (storedSalon ?? fallbackSalon) : fallbackSalon;
  const isStoredSalon = Boolean(storedSalon);
  const landingCopy = useMemo(
    () => getLandingCopy(salon.language),
    [salon.language],
  );
  const contactLinks = useMemo(
    () => buildContactLinks(salon, landingCopy),
    [landingCopy, salon],
  );

  useEffect(() => {
    let isActive = true;

    async function loadSalon() {
      setHasCheckedStorage(false);
      const result = await getSalonBySlug(slug);

      if (!isActive) {
        return;
      }

      if (result.ok) {
        setStoredSalon(result.salon);
        setSource(result.source);
      } else {
        setStoredSalon(null);
      }

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
  }, [slug]);

  useEffect(() => {
    if (!hasCheckedStorage) {
      return;
    }

    debugPreviewStorage("loaded", {
      found: isStoredSalon,
      source,
      name: salon.name,
      slug: salon.slug,
    });
  }, [hasCheckedStorage, isStoredSalon, salon.name, salon.slug, source]);

  if (!hasCheckedStorage) {
    return <PreviewLoading />;
  }

  return (
    <main className="bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Painel
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
              <Eye className="h-4 w-4" />
              Modo prévia
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-900">
              <Globe2 className="h-4 w-4" />
              Idioma:{" "}
              {landingLanguageLabels[salon.landingLanguage] ??
                landingCopy.languageLabel}
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
              {isStoredSalon
                ? `Dados salvos: ${getSalonRepositorySourceLabel(source)}`
                : "Exemplo base"}
            </div>
            <Link
              href={`/p/${salon.slug}`}
              target="_blank"
              className="btn btn-secondary min-h-10 px-4 py-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir página pública
            </Link>
            <Link
              href="/salons/new"
              className="btn btn-secondary min-h-10 px-4 py-2"
            >
              <Plus className="h-4 w-4" />
              Criar novo salão
            </Link>
            <Link
              href={`/salons/${slug}/edit`}
              className="btn btn-primary min-h-10 px-4 py-2"
            >
              <Sparkles className="h-4 w-4" />
              Editar cadastro
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-zinc-200 bg-[#fbfaf8] px-6 py-3 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div
            className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 ${
              isStoredSalon
                ? "border-teal-100 bg-teal-50 text-teal-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {isStoredSalon ? (
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            ) : (
              <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            )}
            <p>
              {isStoredSalon
                ? `Prévia carregada via ${getSalonRepositorySourceLabel(source).toLowerCase()}. ${repositoryStatus.message}`
                : "Este salão não foi encontrado no armazenamento disponível. Exibindo exemplo base apenas como referência visual."}
            </p>
          </div>
        </div>
      </section>

      <Hero salon={salon} mode="preview" />

      <section className="bg-zinc-950 px-6 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          {salon.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-6 py-5"
            >
              <p className="text-2xl font-semibold sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm uppercase tracking-[0.18em] text-zinc-400">
                {translateStatLabel(stat.label, salon.language)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white px-6 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              {landingCopy.profileDetails}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-950">
              {salon.name} · {salon.location}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                <MapPin className="h-4 w-4 text-teal-700" />
                {salon.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-teal-700" />
                {salon.visualStyle}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                <CalendarDays className="h-4 w-4 text-teal-700" />
                {landingCopy.previewSlug}: {salon.slug}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {contactLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-24 items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-800 ring-1 ring-zinc-200 group-hover:bg-teal-700 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-zinc-950">
                      {link.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-zinc-500">
                      {link.description}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white px-6 py-4 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
              salon.hasRealImages
                ? "border-teal-200 bg-teal-50 text-teal-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {salon.hasRealImages
              ? "Fotos reais adicionadas ao cadastro. Revise a seleção antes de publicar."
              : "Nenhuma foto real foi adicionada ainda. Os placeholders aparecem apenas como referência interna."}
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
              salon.hasRealReviews
                ? "border-teal-200 bg-teal-50 text-teal-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
          >
            {salon.hasRealReviews
              ? "Reviews reais cadastrados. Apenas os marcados para exibição aparecem na landing pública."
              : "Reviews reais ainda não foram adicionados."}
          </div>
        </div>
      </section>

      <Services
        services={salon.services}
        language={salon.language}
        salon={salon}
      />
      <Gallery
        images={salon.gallery}
        salonName={salon.name}
        location={salon.location}
        language={salon.language}
        hasRealImages={salon.hasRealImages}
        mode="preview"
      />
      <Testimonials
        testimonials={salon.testimonials}
        language={salon.language}
        salon={salon}
        mode="preview"
      />
      <CTA salon={salon} />
    </main>
  );
}

function buildContactLinks(salon: Salon, copy: LandingCopy) {
  const links = [];

  if (salon.bookingUrl) {
    links.push({
      label: copy.booking,
      description: copy.requestBooking,
      href: salon.bookingUrl,
      icon: CalendarDays,
    });
  }

  if (salon.whatsapp) {
    links.push({
      label: "WhatsApp",
      description: salon.whatsapp,
      href: buildWhatsappHref(salon.whatsapp),
      icon: MessageCircle,
    });
  }

  if (salon.websiteUrl) {
    links.push({
      label: copy.website,
      description: copy.contact,
      href: salon.websiteUrl,
      icon: Globe2,
    });
  }

  if (salon.instagramUrl) {
    links.push({
      label: "Instagram",
      description: copy.socialProfile,
      href: salon.instagramUrl,
      icon: ExternalLink,
    });
  }

  const googleProfileUrl = salon.googleMapsUrl ?? salon.googleBusinessUrl;

  if (googleProfileUrl) {
    links.push({
      label: copy.googleProfile,
      description: copy.mapsProfile,
      href: googleProfileUrl,
      icon: MapPin,
    });
  }

  return links.slice(0, 4);
}

function buildWhatsappHref(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");

  return digits ? `https://wa.me/${digits}` : `tel:${whatsapp}`;
}

function PreviewLoading() {
  return (
    <main className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Painel
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-700">
            <Eye className="h-4 w-4" />
            Carregando prévia
          </div>
        </div>
      </header>

      <section className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-zinc-950">
            Preparando sua prévia
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Estamos carregando os dados salvos neste navegador antes de montar a
            landing.
          </p>
        </div>
      </section>
    </main>
  );
}

function debugPreviewStorage(event: string, payload: unknown) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.debug(`[salon-lg:preview] ${event} ${JSON.stringify(payload)}`);
}
