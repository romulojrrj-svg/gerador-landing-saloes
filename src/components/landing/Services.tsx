import { ArrowUpRight, Scissors, Sparkle, Wand2 } from "lucide-react";
import {
  getAppliedCopy,
  getPublicServices,
  getPublicServicesIntro,
  getPublicServiceSummary,
  getPublicText,
  shouldShowPublicServices,
} from "@/lib/public-landing";
import type { Salon, SalonService } from "@/types/salon";
import type { SalonLanguage } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type ServicesProps = {
  services: SalonService[];
  language: SalonLanguage;
  salon?: Salon;
};

const icons = [Scissors, Sparkle, Wand2];

export function Services({ services, language, salon }: ServicesProps) {
  const copy = getPublicText(language);
  const appliedCopy = salon ? getAppliedCopy(salon) : undefined;

  if (salon && !shouldShowPublicServices(salon)) {
    return null;
  }

  const servicesIntro = salon
    ? getPublicServicesIntro(salon)
    : {
        title: copy.servicesTitle,
        description: copy.servicesDescription,
      };
  const publicServices = getPublicServices(
    services,
    language,
    Boolean(appliedCopy),
  );
  const observedServices = salon?.extractedBusinessInfo?.observedServices
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const serviceSummary = getPublicServiceSummary(services, language);
  const compactServices = observedServices?.length
    ? observedServices.slice(0, 6)
    : serviceSummary
      ? serviceSummary.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4)
      : [];
  const serviceEntries = compactServices.length
    ? compactServices.slice(0, 4).map((service, index) => ({
        id: `${service}-${index}`,
        title: service,
        description: getCompactServiceDescription(service, language),
      }))
    : publicServices.slice(0, 3).map((service) => ({
        id: service.id,
        title: service.title,
        description: service.description,
      }));

  if (!serviceEntries.length) {
    return null;
  }

  return (
    <section
      id="services"
      className="bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f2_100%)] px-5 py-8 sm:px-8 sm:py-11 lg:px-10"
    >
      <div className="mx-auto max-w-6xl rounded-[1.8rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fffaf4_0%,#ffffff_100%)] p-5 shadow-[0_18px_44px_rgba(83,57,33,0.06)] sm:rounded-[2.3rem] sm:p-7">
        <div className="max-w-2xl">
          <SectionHeader
            eyebrow={copy.servicesLabel}
            title={servicesIntro.title}
            description={servicesIntro.description}
          />
        </div>

        <div className="mt-6 grid gap-3">
          {serviceEntries.map((service, index) => {
            const Icon = icons[index % icons.length];

            return (
              <article
                key={service.id}
                className="group flex items-start gap-3 rounded-[1.35rem] border border-[#eadfce] bg-white/96 px-4 py-4 shadow-[0_14px_34px_rgba(83,57,33,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(83,57,33,0.1)] sm:rounded-[1.5rem] sm:px-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff4e8] text-[#9a6b3d]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-serif text-[1.2rem] font-semibold leading-tight text-zinc-950 sm:text-[1.28rem]">
                      {service.title}
                    </h3>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eadfce] bg-[#fdf8f1] text-[#8d6239]">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                    {service.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function getCompactServiceDescription(
  service: string,
  language: SalonLanguage,
) {
  const normalizedService = service.trim().toLowerCase();

  if (
    normalizedService.includes("cabelo") ||
    normalizedService.includes("hair") ||
    normalizedService.includes("cabello")
  ) {
    return getLocalizedCompactDescription(
      language,
      "Atendimentos voltados para estilo, finalizacao e cuidado com o visual.",
      "Appointments focused on styling, finishing, and everyday beauty care.",
      "Atenciones enfocadas en estilo, acabado y cuidado del look.",
      "Behandlinger med fokus pa styling, finish og pleie av looken.",
    );
  }

  if (
    normalizedService.includes("unha") ||
    normalizedService.includes("nail") ||
    normalizedService.includes("uñas")
  ) {
    return getLocalizedCompactDescription(
      language,
      "Cuidados para maos e pes com acabamento delicado e atencao aos detalhes.",
      "Care for hands and feet with a polished finish and attention to detail.",
      "Cuidados para manos y pies con acabado delicado y atencion al detalle.",
      "Pleie for hender og fotter med fint resultat og fokus pa detaljer.",
    );
  }

  if (
    normalizedService.includes("maqui") ||
    normalizedService.includes("makeup") ||
    normalizedService.includes("maquill")
  ) {
    return getLocalizedCompactDescription(
      language,
      "Producoes pensadas para eventos, fotos e momentos especiais.",
      "Looks prepared for events, photos, and special occasions.",
      "Looks pensados para eventos, fotos y ocasiones especiales.",
      "Looks til arrangementer, bilder og spesielle anledninger.",
    );
  }

  return getLocalizedCompactDescription(
    language,
    "Atendimento disponivel para quem busca cuidado, praticidade e boa apresentacao.",
    "Available appointments for clients looking for care, convenience, and a polished result.",
    "Atencion disponible para quienes buscan cuidado, practicidad y una buena presentacion.",
    "Tilgjengelige behandlinger for deg som onsker pleie, enkelhet og et pent resultat.",
  );
}

function getLocalizedCompactDescription(
  language: SalonLanguage,
  pt: string,
  en: string,
  es: string,
  no: string,
) {
  if (language === "pt-BR") {
    return pt;
  }

  if (language === "es") {
    return es;
  }

  if (language === "no") {
    return no;
  }

  return en;
}
