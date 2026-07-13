import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu, MapPin, ExternalLink, Star } from "lucide-react";
import { LandingImage } from "@/components/landing/LandingImage";
import { SalonHeaderBrand } from "@/components/landing/SalonHeaderBrand";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { FeedbackScreenshotCarousel } from "./FeedbackScreenshotCarousel";
import {
  getPremiumEditorialImages,
  getPremiumEditorialLabels,
  getPremiumImage,
} from "@/lib/premium-editorial";
import { buildWhatsappHref, getPublicReviewMetrics } from "@/lib/public-landing";
import type { Salon, SalonGalleryImage, SalonService } from "@/types/salon";

export function PremiumEditorialLanding({ salon }: { salon: Salon }) {
  const content = salon.premiumEditorial;
  const imageMap = getPremiumEditorialImages(salon);
  const services = getPremiumServices(salon);
  const heroImage =
    getPremiumImage(salon, content.heroImageId) ??
    firstUsableImage(imageMap, salon);
  const aboutImage = getPremiumImage(salon, content.aboutImageId) ?? heroImage;
  const beforeAfterItems = content.beforeAfterItems
    .filter((item) => item.enabled)
    .map((item) => ({
      item,
      before: imageMap.get(item.beforeImageId),
      after: imageMap.get(item.afterImageId),
    }))
    .filter(
      (entry): entry is typeof entry & {
        before: SalonGalleryImage;
        after: SalonGalleryImage;
      } => Boolean(entry.before && entry.after),
    );
  const faqItems = content.faqItems.filter(
    (item) => item.enabled && item.question.trim() && item.answer.trim(),
  );
  const accent = content.accentColor || "#9b7353";
  const background = content.backgroundColor || "#f8f5f0";
  const labels = getPremiumEditorialLabels(salon, content);

  return (
    <main className="min-h-screen overflow-x-hidden text-zinc-950" style={{ backgroundColor: background }}>
      <header className="sticky top-0 z-50 border-b border-zinc-900/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <SalonHeaderBrand
            salonName={salon.name}
            horizontalLogoUrl={salon.horizontalLogoUrl}
            logoAlt={`${salon.name} — logo`}
            priority
          />
          <nav className="hidden items-center gap-7 text-[0.82rem] font-medium text-zinc-700 md:flex">
            <a href="#about" className="transition hover:text-zinc-950">{labels.about}</a>
            <a href="#services" className="transition hover:text-zinc-950">{labels.services}</a>
            {beforeAfterItems.length ? <a href="#results" className="transition hover:text-zinc-950">{labels.results}</a> : null}
            <a href="#contact" className="transition hover:text-zinc-950">{labels.contact}</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href={salon.bookingUrl || salon.whatsapp ? buildPrimaryContactHref(salon) : "#contact"} className="hidden rounded-full px-4 py-2 text-[0.82rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 md:inline-flex" style={{ backgroundColor: accent }}>
              {labels.bookAppointment}
            </a>
            <details className="relative md:hidden">
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-zinc-200 bg-white">
                <Menu className="h-5 w-5" />
              </summary>
              <div className="absolute right-0 top-12 grid min-w-44 gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-sm shadow-2xl">
                <a href="#about" className="rounded-xl px-3 py-2 hover:bg-zinc-50">{labels.about}</a>
                <a href="#services" className="rounded-xl px-3 py-2 hover:bg-zinc-50">{labels.services}</a>
                {beforeAfterItems.length ? <a href="#results" className="rounded-xl px-3 py-2 hover:bg-zinc-50">{labels.results}</a> : null}
                <a href="#contact" className="rounded-xl px-3 py-2 hover:bg-zinc-50">{labels.contact}</a>
              </div>
            </details>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-7xl gap-10 px-5 pb-0 pt-12 sm:px-8 md:pb-24 md:pt-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-10 lg:pt-24">
        <div className="max-w-xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>{content.heroEyebrow}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-[2.75rem] leading-[0.96] tracking-tight sm:text-6xl lg:text-[6rem]">{content.heroTitle || salon.name}</h1>
          {content.heroDescription ? <p className="mt-6 max-w-lg text-[0.95rem] leading-7 text-zinc-600 sm:text-base">{content.heroDescription}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={buildPrimaryContactHref(salon)} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[0.82rem] font-semibold text-white shadow-lg transition hover:-translate-y-0.5" style={{ backgroundColor: accent }}>{labels.bookAppointment} <ArrowUpRight className="h-4 w-4" /></a>
            {salon.instagramUrl ? <a href={salon.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/70 px-5 py-2.5 text-[0.82rem] font-semibold transition hover:bg-white"><Image src="/brand/instagram-icon.png" alt="" width={18} height={18} className="rounded-[4px]" /> Instagram</a> : null}
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-zinc-200 sm:rounded-[3rem]">
          {heroImage ? <LandingImage image={heroImage} salonSlug={salon.slug} section="premium-hero" imageId={heroImage.id} alt={`${salon.name} hero`} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" /> : <ImageFallback name={salon.name} />}
        </div>
      </section>

      <section id="about" className="bg-white px-5 pb-14 pt-12 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="order-2 relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-zinc-100 sm:rounded-[3rem] lg:order-1">
            {aboutImage ? <LandingImage image={aboutImage} salonSlug={salon.slug} section="premium-about" imageId={aboutImage.id} alt={`${salon.name} portrait`} fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" /> : <ImageFallback name={salon.name} />}
          </div>
          <div className="order-1 max-w-xl lg:order-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>{labels.about}</p>
            <h2 className="mt-5 font-serif text-[2.1rem] leading-tight sm:mt-4 sm:text-5xl">{content.aboutTitle}</h2>
            {content.aboutRole ? <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:mt-4">{content.aboutRole}</p> : null}
            {content.aboutText ? <p className="mt-7 whitespace-pre-line text-[0.92rem] leading-[1.7] text-zinc-600 sm:mt-6 sm:text-base sm:leading-7">{content.aboutText}</p> : null}
          </div>
        </div>
      </section>

      {services.length ? <section id="services" className="bg-white px-5 pb-14 pt-12 sm:px-8 md:py-24 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>{labels.services}</p>
          <h2 className="mt-3.5 max-w-2xl font-serif text-[2.05rem] leading-tight sm:text-4xl">{labels.servicesTitle}</h2>
          <div className="mt-6 border-y border-zinc-200">
            {services.map((service, index) => (
              <article key={service.id || service.title} className="grid grid-cols-[3rem_1fr] gap-x-3 gap-y-2 border-b border-zinc-200/80 py-6 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:items-start sm:gap-4 sm:py-7">
                <span className="pt-1 font-serif text-lg text-[#b48b82] sm:text-xl">{String(index + 1).padStart(2, "0")}</span>
                <div><h3 className="font-serif text-[1.2rem] leading-tight sm:text-xl">{service.title}</h3>{service.description ? <p className="mt-2 max-w-2xl text-[0.82rem] leading-[1.55] text-zinc-600 sm:text-[0.9rem]">{service.description}</p> : null}</div>
                {salon.bookingUrl ? <a href={salon.bookingUrl} target="_blank" rel="noreferrer" className="col-start-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold sm:col-start-auto" style={{ color: accent }}>{labels.serviceCta} <ArrowUpRight className="h-4 w-4" /></a> : null}
              </article>
            ))}
          </div>
          {(salon.bookingUrl || salon.whatsapp) ? (
            <div className="mt-6 text-center">
              <a href={salon.whatsapp ? buildWhatsappHref(salon.whatsapp, salon.whatsappMessage) : buildPrimaryContactHref(salon)} className="inline-flex items-center gap-2 rounded-full border border-transparent px-6 py-3 text-[0.82rem] font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:brightness-95" style={{ backgroundColor: accent }}>
                {labels.bookViaWhatsapp} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          ) : null}
        </div>
      </section> : null}

      {beforeAfterItems.length ? <section id="results" className="px-5 pb-14 pt-12 sm:px-8 md:py-20 lg:px-10"><div className="mx-auto max-w-6xl"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>{labels.results}</p><h2 className="mt-2.5 max-w-xl font-serif text-[2.05rem] leading-tight sm:text-4xl">{labels.beforeAfterTitle}</h2><p className="mt-2.5 max-w-xl text-[0.82rem] leading-6 text-zinc-500">{labels.beforeAfterDescription}</p><div className="mt-7 grid gap-7 md:grid-cols-2">{beforeAfterItems.map(({ item, before, after }) => <article key={item.id} className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(24,24,27,0.08)]"><BeforeAfterSlider beforeImage={before} afterImage={after} salonSlug={salon.slug} title={item.title} beforeLabel={labels.before} afterLabel={labels.after} adjustLabel={labels.adjustComparison} /><div className="p-4"><h3 className="font-serif text-xl">{item.title}</h3>{item.description ? <p className="mt-1.5 text-[0.82rem] leading-6 text-zinc-600">{item.description}</p> : null}</div></article>)}</div></div></section> : null}

      <PremiumReviews salon={salon} accent={accent} />

      <PremiumPersonalizedCare content={content} accent={accent} />

      {faqItems.length ? <section className="px-5 pb-8 pt-10 sm:px-8 md:py-24 lg:px-10"><div className="mx-auto max-w-4xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>FAQ</p><div className="mt-6 divide-y divide-zinc-300 border-y border-zinc-300">{faqItems.map((item) => <details key={item.id} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-lg leading-[1.2] marker:hidden"><span>{item.question}</span><span className="font-sans text-xl font-normal" style={{ color: accent }}>+</span></summary><p className="mt-2.5 max-w-2xl text-[0.82rem] leading-6 text-zinc-600">{item.answer}</p></details>)}</div></div></section> : null}

      <section id="contact" className="bg-[#281916] px-5 py-20 text-center text-[#f7eee8] sm:px-8 md:py-28 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#c9988d]">{labels.reservations}</p>
          <h2 className="mt-5 font-serif text-3xl leading-tight sm:text-5xl">{content.finalCtaTitle || "Secure Your Appointment"}</h2>
          <div className="mx-auto mt-7 h-px w-20 bg-[#c9988d]/60" />
          {content.finalCtaText ? <p className="mx-auto mt-7 max-w-xl whitespace-pre-line text-[0.95rem] leading-7 text-[#d8c5bd] sm:text-base">{content.finalCtaText}</p> : null}
          <div className="mx-auto mt-8 grid max-w-md gap-3">
            {salon.bookingUrl ? <a href={salon.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#f7eee8] px-6 py-3 text-[0.9rem] font-semibold text-[#281916] shadow-lg transition hover:-translate-y-0.5 hover:bg-white">{labels.bookOnFresha} <ArrowUpRight className="h-4 w-4" /></a> : null}
            {salon.whatsapp ? <a href={buildWhatsappHref(salon.whatsapp, salon.whatsappMessage)} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-transparent bg-[#25D366] px-6 py-3 text-[0.9rem] font-semibold text-white shadow-[0_12px_28px_rgba(37,211,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"><WhatsAppIcon /> {labels.chatOnWhatsapp}</a> : null}
          </div>
          <div className="mt-8 grid gap-2 text-[0.82rem] text-[#bba49b]">
            {salon.address || salon.location ? <p className="flex items-center justify-center gap-2"><MapPin className="h-4 w-4" /> {salon.address || salon.location}</p> : null}
            {salon.instagramUrl ? <Link href={salon.instagramUrl} target="_blank" className="flex items-center justify-center gap-2"><ExternalLink className="h-4 w-4" /> Instagram</Link> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function firstUsableImage(imageMap: Map<string, SalonGalleryImage>, salon: Salon) {
  return Array.from(imageMap.values()).find((image) => image.isReal && image.type !== "logo") ??
    Array.from(imageMap.values()).find((image) => image.type !== "logo") ??
    salon.galleryImages.find((image) => image.type !== "logo");
}

function PremiumReviews({ salon, accent }: { salon: Salon; accent: string }) {
  if (salon.premiumEditorial.reviewDisplayType === "screenshots") {
    return <PremiumScreenshotReviews salon={salon} accent={accent} />;
  }

  return <PremiumGoogleReviews salon={salon} accent={accent} />;
}

function PremiumPersonalizedCare({
  content,
  accent,
}: {
  content: Salon["premiumEditorial"];
  accent: string;
}) {
  if (!content.methodEyebrow && !content.methodTitle && !content.methodText) {
    return null;
  }

  return (
    <section className="px-5 pb-10 pt-8 sm:px-8 md:py-16 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>
            {content.methodEyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[1.7rem] leading-tight sm:text-4xl">
            {content.methodTitle}
          </h2>
        </div>
        {content.methodText ? (
          <p className="max-w-2xl self-end text-[0.9rem] leading-[1.6] text-zinc-600 sm:text-base sm:leading-7">
            {content.methodText}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PremiumGoogleReviews({ salon, accent }: { salon: Salon; accent: string }) {
  const reviews = salon.testimonials
    .filter((review) => review.isReal && review.selectedForLanding && review.text)
    .slice(0, 3);

  if (!reviews.length) {
    return null;
  }

  const metrics = getPublicReviewMetrics(salon);

  return (
    <section className="bg-[#fbf8f5] px-5 pb-8 pt-8 sm:px-8 md:py-16 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em]" style={{ color: accent }}>Client love</p>
            <h2 className="mt-2.5 font-serif text-xl leading-tight sm:text-3xl">What Our Clients Say</h2>
          </div>
          {metrics.averageRating ? (
            <div className="flex items-center gap-2 text-[0.82rem] text-zinc-600">
              <span className="flex items-center gap-1" style={{ color: accent }}>
                <Star className="h-3.5 w-3.5 fill-current" /> {metrics.averageRating.toFixed(1)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {reviews.map((review) => (
            <figure key={review.id} className="rounded-[1.35rem] border border-zinc-200/80 bg-white p-4 shadow-[0_14px_34px_rgba(70,42,31,0.04)]">
              <div className="flex gap-1" style={{ color: accent }}>{Array.from({ length: Math.min(5, review.rating ?? 5) }).map((_, index) => <Star key={index} className="h-3.5 w-3.5 fill-current" />)}</div>
              <blockquote className="mt-3 font-serif text-base leading-6 text-zinc-800">“{review.text}”</blockquote>
              <figcaption className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">{review.authorName}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function PremiumScreenshotReviews({ salon, accent }: { salon: Salon; accent: string }) {
  const imageMap = getPremiumEditorialImages(salon);
  const screenshots = salon.premiumEditorial.reviewScreenshotImages
    .map((screenshot) => ({
      screenshot,
      image: screenshot.imageId
        ? imageMap.get(screenshot.imageId)
        : undefined,
      src: screenshot.imageId
        ? imageMap.get(screenshot.imageId)?.src || screenshot.imageUrl
        : screenshot.imageUrl,
    }))
    .filter(
      (item): item is typeof item & { src: string } => Boolean(item.src?.trim()),
    )
    .sort((first, second) => first.screenshot.order - second.screenshot.order);

  if (!screenshots.length) {
    return null;
  }

  return (
    <section className="bg-[#fbf8f5] px-5 pb-8 pt-8 sm:px-8 md:py-16 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-4">
          <div>
            <p
              className="text-[0.62rem] font-semibold uppercase tracking-[0.24em]"
              style={{ color: accent }}
            >
              {salon.premiumEditorial.reviewEyebrow || "O que dizem as pacientes"}
            </p>
            <h2 className="mt-2.5 font-serif text-xl leading-tight sm:text-3xl">
              {salon.premiumEditorial.reviewTitle ||
                "Experiências que refletem nosso cuidado"}
            </h2>
            {salon.premiumEditorial.reviewDescription ? (
              <p className="mt-2.5 max-w-2xl text-[0.82rem] leading-6 text-zinc-500">
                {salon.premiumEditorial.reviewDescription}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5">
          <FeedbackScreenshotCarousel
            accent={accent}
            items={screenshots.map(({ screenshot, src }) => ({
              id: screenshot.id,
              src,
              alt: screenshot.imageAlt || "Feedback de paciente",
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function getPremiumServices(salon: Salon): SalonService[] {
  if (salon.services.length) {
    return salon.services;
  }

  const fallbackNames = salon.selectedServices.length
    ? salon.selectedServices
    : (salon.extractedBusinessInfo.observedServices ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  return fallbackNames.map((title, index) => ({
    id: `premium-service-${index + 1}`,
    title,
    description: "",
    featured: true,
  }));
}

function ImageFallback({ name }: { name: string }) {
  return <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 px-6 text-center font-serif text-3xl text-zinc-500">{name}</div>;
}

function buildPrimaryContactHref(salon: Salon) {
  if (salon.bookingUrl) return salon.bookingUrl;
  if (salon.whatsapp) return buildWhatsappHref(salon.whatsapp, salon.whatsappMessage) || "#contact";
  return "#contact";
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M16 3.1A12.8 12.8 0 0 0 5.2 22.7L3.4 28.8l6.3-1.7A12.9 12.9 0 1 0 16 3.1Zm0 23.4a10.5 10.5 0 0 1-5.3-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A10.5 10.5 0 1 1 16 26.5Zm5.8-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.7-.8-2.8-1.4-3.9-3.2-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.5 5.5 4.9 2 .9 2.7 1 3.7.8.6-.1 1.8-.7 2.1-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z" />
    </svg>
  );
}
