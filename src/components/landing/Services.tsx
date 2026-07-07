import { ArrowUpRight, Scissors, Sparkle, Wand2 } from "lucide-react";
import {
  getAppliedCopy,
  getPublicServices,
  getPublicServicesIntro,
  getPublicServiceSummary,
  getPublicText,
  shouldShowPublicServices,
} from "@/lib/public-landing";
import type { Salon, SalonLanguage, SalonService } from "@/types/salon";
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
  const serviceEntries = !publicServices.length && compactServices.length
    ? compactServices.slice(0, 4).map((service, index) => ({
        id: `${service}-${index}`,
        title: service,
        description: undefined,
      }))
    : publicServices.slice(0, 4).map((service) => ({
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
                  {service.description ? (
                    <p className="mt-1.5 text-sm leading-6 text-zinc-600">
                      {service.description}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
