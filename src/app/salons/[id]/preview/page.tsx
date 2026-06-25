import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye, Sparkles } from "lucide-react";
import { CTA, Gallery, Hero, Services, Testimonials } from "@/components/landing";
import { mockSalon } from "@/data/mockSalon";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Prévia de ${mockSalon.name}`,
    description: `Prévia mockada de landing page gerada para ${id}.`,
  };
}

export default async function SalonPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const salon = {
    ...mockSalon,
    id,
  };

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
            <Link
              href="/salons/new"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              <Sparkles className="h-4 w-4" />
              Editar cadastro
            </Link>
          </div>
        </div>
      </header>

      <Hero salon={salon} />

      <section className="bg-zinc-950 px-6 py-8 text-white sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          {salon.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] px-6 py-5"
            >
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.18em] text-zinc-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Services services={salon.services} />
      <Gallery images={salon.gallery} />
      <Testimonials testimonials={salon.testimonials} />
      <CTA title={salon.ctaTitle} text={salon.ctaText} />
    </main>
  );
}
