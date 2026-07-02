import { CheckCircle2, Quote, Star } from "lucide-react";
import {
  getAppliedCopy,
  getPublicBenefits,
  getPublicReviewMetrics,
  getPublicText,
} from "@/lib/public-landing";
import type { Salon, SalonLanguage, SalonTestimonial } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type TestimonialsProps = {
  testimonials: SalonTestimonial[];
  language: SalonLanguage;
  salon?: Salon;
  mode?: "preview" | "public";
};

export function Testimonials({
  testimonials,
  language,
  salon,
  mode = "public",
}: TestimonialsProps) {
  const copy = getPublicText(language);
  const visibleReviews = testimonials.filter((testimonial) =>
    mode === "preview"
      ? testimonial.selectedForLanding
      : testimonial.isReal && testimonial.selectedForLanding,
  );
  const hasGoogleReviews = visibleReviews.some(
    (testimonial) => testimonial.source === "google",
  );
  const reviewMetrics = salon
    ? getPublicReviewMetrics(salon)
    : { averageRating: 0, reviewCount: 0 };
  const featuredReviews = visibleReviews.slice(0, 3);

  if (!visibleReviews.length) {
    return <WhyChooseSalon language={language} salon={salon} />;
  }

  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f2_100%)] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[0.66fr_1.34fr] lg:items-start">
          <div className="space-y-4">
            <SectionHeader
              eyebrow={copy.reviewsTitle}
              title={hasGoogleReviews ? copy.googleReviewsTitle : copy.reviewsTitle}
              description={copy.reviewsDescription}
            />
            <div className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4 shadow-[0_14px_34px_rgba(83,57,33,0.07)] sm:rounded-[1.8rem] sm:p-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#9a6b3d]">
                {language === "pt-BR" ? "Avaliacao geral" : "Overall rating"}
              </p>
              <div className="mt-3 flex items-end gap-3">
                <span className="font-serif text-4xl font-semibold text-zinc-950 sm:text-5xl">
                  {reviewMetrics.averageRating
                    ? reviewMetrics.averageRating.toFixed(1)
                    : "5.0"}
                </span>
                <div className="pb-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className="h-4 w-4 fill-[#f4b84f] text-[#f4b84f]"
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    {language === "pt-BR"
                      ? "Bem avaliado por clientes"
                      : language === "es"
                        ? "Bien valorado por clientes"
                        : language === "no"
                          ? "Godt vurdert av kunder"
                          : "Well rated by clients"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featuredReviews.map((testimonial) => (
              <article
                key={testimonial.id}
                className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4 shadow-[0_14px_34px_rgba(83,57,33,0.07)] transition-transform duration-200 hover:-translate-y-0.5 sm:rounded-[1.8rem] sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff4e8] text-[#9a6b3d]">
                    <Quote className="h-5 w-5" />
                  </span>
                  {testimonial.rating ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#eadfce] bg-[#fffaf3] px-2.5 py-1 text-xs font-semibold text-zinc-900">
                      <Star className="h-3.5 w-3.5 fill-[#f4b84f] text-[#f4b84f]" />
                      {testimonial.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {testimonial.text || testimonial.quote}
                </p>
                <div className="mt-5 border-t border-[#f0e8dd] pt-4">
                  <p className="font-semibold text-zinc-950">
                    {testimonial.authorName || testimonial.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    {testimonial.source === "google" ? (
                      <span className="rounded-full border border-[#eadfce] bg-[#fdf8f1] px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#8d6239]">
                        Google
                      </span>
                    ) : null}
                    {formatReviewDate(testimonial.reviewDate, language) ? (
                      <span>{formatReviewDate(testimonial.reviewDate, language)}</span>
                    ) : testimonial.source !== "google" ? (
                      <span>{testimonial.role}</span>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyChooseSalon({
  language,
  salon,
}: {
  language: SalonLanguage;
  salon?: Salon;
}) {
  const copy = getPublicText(language);
  const appliedCopy = salon ? getAppliedCopy(salon) : undefined;
  const benefits = salon ? getPublicBenefits(salon) : copy.benefits;

  return (
    <section className="bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f2_100%)] px-5 py-8 sm:px-8 sm:py-12 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-5 rounded-[1.8rem] border border-[#eadfce] bg-white/78 p-5 shadow-[0_18px_44px_rgba(83,57,33,0.055)] sm:rounded-[2.2rem] sm:p-7 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
        <SectionHeader
          title={appliedCopy?.whyChooseTitle || getCompactBenefitsTitle(language)}
          description={getCompactBenefitsDescription(language)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {benefits.slice(0, 3).map((item) => (
            <article
              key={item.title}
              className="rounded-[1.2rem] border border-[#eadfce] bg-[#fffaf4] p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <CheckCircle2 className="h-5 w-5 text-[#9a6b3d]" />
              <h3 className="mt-3 font-serif text-[1.25rem] font-semibold leading-tight text-zinc-950">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getCompactBenefitsTitle(language: SalonLanguage) {
  if (language === "pt-BR") {
    return "Detalhes do atendimento";
  }

  if (language === "es") {
    return "Detalles de la experiencia";
  }

  if (language === "no") {
    return "Detaljer ved opplevelsen";
  }

  return "Experience details";
}

function getCompactBenefitsDescription(language: SalonLanguage) {
  if (language === "pt-BR") {
    return "Alguns pontos simples para planejar sua visita com mais seguranca.";
  }

  if (language === "es") {
    return "Algunos detalles simples para planificar tu visita con mas confianza.";
  }

  if (language === "no") {
    return "Noen enkle detaljer som gjor det lettere a planlegge besoket.";
  }

  return "A few simple details to help you plan your visit with confidence.";
}

function formatReviewDate(reviewDate: string | undefined, language: SalonLanguage) {
  if (!reviewDate) {
    return "";
  }

  const date = parseReviewDate(reviewDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const localeByLanguage: Record<SalonLanguage, string> = {
    "pt-BR": "pt-BR",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    no: "nb-NO",
  };

  return new Intl.DateTimeFormat(localeByLanguage[language] ?? "en-US", {
    day: "2-digit",
    month: language === "en" ? "short" : "2-digit",
    year: "numeric",
  }).format(date);
}

function parseReviewDate(reviewDate: string) {
  const dateOnlyMatch = reviewDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(reviewDate);
}
