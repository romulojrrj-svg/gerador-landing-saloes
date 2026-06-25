import { Quote } from "lucide-react";
import type { SalonTestimonial } from "@/types/salon";
import { SectionHeader } from "./SectionHeader";

type TestimonialsProps = {
  testimonials: SalonTestimonial[];
};

export function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section className="bg-white px-6 py-24 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <SectionHeader
            eyebrow="Client proof"
            title="Trust signals that feel personal, not generic."
            description="Testimonials are positioned to reinforce service quality, atmosphere, and emotional payoff."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6"
              >
                <Quote className="h-7 w-7 fill-rose-100 text-rose-200" />
                <p className="mt-6 text-sm leading-7 text-zinc-700">
                  {testimonial.quote}
                </p>
                <div className="mt-8">
                  <p className="font-semibold text-zinc-950">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {testimonial.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
