import { ArrowRight, CalendarCheck } from "lucide-react";

type CTAProps = {
  title: string;
  text: string;
};

export function CTA({ title, text }: CTAProps) {
  return (
    <section id="booking" className="bg-zinc-950 px-6 py-24 text-white sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">
            <CalendarCheck className="h-4 w-4" />
            Limited appointments
          </div>
          <h2 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
            {text}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
          <div className="grid gap-3 text-sm text-zinc-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span>Consultation window</span>
              <strong className="text-white">45 minutes</strong>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span>Lead stylist match</span>
              <strong className="text-white">Included</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Personal beauty plan</span>
              <strong className="text-white">Same day</strong>
            </div>
          </div>
          <a
            href="mailto:hello@maisonlumiere.example"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            Request booking
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
