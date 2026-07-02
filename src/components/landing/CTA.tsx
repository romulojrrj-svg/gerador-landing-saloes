import { ArrowRight, CalendarCheck, Clock3, MapPin, Phone } from "lucide-react";
import { getPrimaryContactAction, getPublicCta } from "@/lib/public-landing";
import type { Salon } from "@/types/salon";

type CTAProps = {
  salon: Salon;
};

export function CTA({ salon }: CTAProps) {
  const cta = getPublicCta(salon);
  const action = getPrimaryContactAction(salon);

  return (
    <section
      id="booking"
      className="px-5 pb-14 pt-4 sm:px-8 sm:pb-18 lg:px-10"
    >
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#e7dac8] bg-[linear-gradient(135deg,#201913_0%,#30261e_100%)] p-5 text-white shadow-[0_28px_80px_rgba(24,24,27,0.2)] sm:rounded-[2.6rem] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#f4dcb6]">
              <CalendarCheck className="h-4 w-4" />
              {getClosingEyebrow(salon.language)}
            </div>
            <h2 className="mt-5 max-w-3xl font-serif text-[2rem] font-semibold leading-tight sm:text-4xl">
              {getClosingTitle(salon.language)}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
              {getClosingText(salon.language)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-300">
              {salon.location ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2">
                  <MapPin className="h-4 w-4 text-[#f4dcb6]" />
                  {salon.location}
                </span>
              ) : null}
              {salon.businessHours ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2">
                  <Clock3 className="h-4 w-4 text-[#f4dcb6]" />
                  {salon.businessHours}
                </span>
              ) : null}
              {salon.phone ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2">
                  <Phone className="h-4 w-4 text-[#f4dcb6]" />
                  {salon.phone}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/12 bg-white/[0.06] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.24)] sm:p-5">
            {cta.href ? (
              <a
                href={cta.href}
                target={cta.external ? "_blank" : undefined}
                rel={cta.external ? "noreferrer" : undefined}
                className={
                  action.href?.startsWith("https://wa.me/")
                    ? "btn w-full border border-[#24b75d] bg-[#22c55e] px-6 py-3.5 text-base font-semibold text-white shadow-[0_16px_40px_rgba(34,197,94,0.24)] transition hover:-translate-y-0.5 hover:bg-[#16a34a] active:scale-[0.99]"
                    : "btn w-full border border-[#d6b68d] bg-[#f5dfba] px-6 py-3.5 text-base font-semibold text-zinc-950 shadow-[0_16px_40px_rgba(245,223,186,0.22)] transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.99]"
                }
              >
                {cta.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-sm leading-7 text-zinc-300">{cta.noContactText}</p>
            )}

            <p className="mt-4 text-sm leading-7 text-zinc-300">
              {cta.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function getClosingEyebrow(language: Salon["language"]) {
  if (language === "pt-BR") {
    return "Contato rapido";
  }

  if (language === "es") {
    return "Contacto rapido";
  }

  if (language === "no") {
    return "Rask kontakt";
  }

  return "Quick contact";
}

function getClosingTitle(language: Salon["language"]) {
  if (language === "pt-BR") {
    return "Entre em contato com o salao";
  }

  if (language === "es") {
    return "Ponte en contacto con el salon";
  }

  if (language === "no") {
    return "Ta kontakt med salongen";
  }

  return "Get in touch with the salon";
}

function getClosingText(language: Salon["language"]) {
  if (language === "pt-BR") {
    return "Escolha o melhor canal para tirar duvidas, planejar sua visita e combinar seu atendimento com praticidade.";
  }

  if (language === "es") {
    return "Elige el mejor canal para resolver dudas, planificar tu visita y coordinar tu cita.";
  }

  if (language === "no") {
    return "Velg den beste kanalen for sporsmal, planlegging av besok og booking.";
  }

  return "Choose the best channel for questions, planning your visit, and arranging your appointment.";
}
