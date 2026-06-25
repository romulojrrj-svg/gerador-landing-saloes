import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  LayoutTemplate,
  Palette,
  Sparkles,
} from "lucide-react";

const workflow = [
  {
    title: "Capturar a identidade do salão",
    description:
      "Reunir posicionamento, serviços, atmosfera, provas sociais e preferências de agendamento em um cadastro elegante.",
    icon: BadgeCheck,
  },
  {
    title: "Gerar uma estrutura premium",
    description:
      "Montar uma landing page focada em conversão com seções reutilizáveis e blocos prontos para salões.",
    icon: LayoutTemplate,
  },
  {
    title: "Ajustar a direção visual",
    description:
      "Manter o layout refinado, editorial e adaptável para marcas de beleza em mercados internacionais.",
    icon: Palette,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-950">
            Salon LG
          </span>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/salons/maison-lumiere/preview"
            className="rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-white"
          >
            Prévia
          </Link>
          <Link
            href="/salons/new"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Novo salão
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-rose-400" />
            Sistema de landing pages para beleza
          </div>
          <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl">
            Gerador de Landing Pages para Salões
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Um painel focado em transformar perfis de salões em prévias de
            landing pages elegantes, persuasivas e com estética premium para o
            mercado de beleza.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/salons/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Criar perfil do salão
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/salons/maison-lumiere/preview"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white/70 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:border-rose-200 hover:bg-rose-50"
            >
              Ver prévia de exemplo
            </Link>
          </div>
        </div>

        <div className="relative min-h-[520px]">
          <div className="absolute inset-0 rounded-[3rem] bg-zinc-950 shadow-2xl shadow-zinc-950/20" />
          <div className="absolute inset-4 overflow-hidden rounded-[2.35rem] bg-[#f8f3ee]">
            <div className="h-40 bg-[linear-gradient(135deg,#111827_0%,#0f766e_52%,#fecdd3_100%)]" />
            <div className="-mt-14 px-6 pb-6">
              <div className="rounded-[2rem] bg-white p-6 shadow-2xl shadow-zinc-950/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
                      Salão de exemplo
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-zinc-950">
                      Maison Lumiere Atelier
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      Luxury hair artistry, skin rituals, and luminous styling
                      in Mayfair.
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-zinc-900">
                    Premium
                  </span>
                </div>

                <div className="mt-7 grid gap-3">
                  {workflow.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="flex gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-4"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-zinc-950">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-600">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
