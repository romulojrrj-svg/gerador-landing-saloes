import { Scissors, Sparkle, Wand2 } from "lucide-react";
import type { SalonService } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type ServicesProps = {
  services: SalonService[];
};

const icons = [Scissors, Sparkle, Wand2];

export function Services({ services }: ServicesProps) {
  return (
    <section id="services" className="bg-white px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeader
            eyebrow="Services"
            title="A focused menu for high-intent beauty clients."
            description="Each service is designed to feel polished, personal, and easy to book from the first page visit."
          />

          <div className="grid gap-4">
            {services.map((service, index) => {
              const Icon = icons[index % icons.length];

              return (
                <article
                  key={service.title}
                  className="group rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6 transition hover:-translate-y-1 hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-2xl hover:shadow-rose-950/10"
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-zinc-950">
                          {service.title}
                        </h3>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm ring-1 ring-zinc-200">
                      {service.price}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
