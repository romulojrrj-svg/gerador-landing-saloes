import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  LayoutPanelTop,
  MapPin,
  MessageCircle,
  Smartphone,
  Sparkles,
  Star,
} from "lucide-react";
import { PUBLIC_SERVICE_WHATSAPP_URL } from "@/lib/public-site-config";

const deliveryItems = [
  "Pagina profissional em um unico link",
  "Fotos, servicos e diferenciais organizados",
  "Localizacao, rota e botao de contato direto",
  "Visual pensado para bio do Instagram e WhatsApp",
  "Experiencia otimizada para celular",
  "Previa personalizada antes de fechar",
];

const audienceItems = [
  "Saloes de beleza",
  "Barbearias",
  "Spas e massagens",
  "Clinicas de estetica",
  "Nail designers",
  "Negocios locais que atendem por WhatsApp ou Instagram",
];

const flowItems = [
  "Voce envia o Instagram ou as informacoes do negocio",
  "Nos montamos uma previa visual sem compromisso",
  "Ajustamos fotos, textos e detalhes importantes",
  "Sua pagina fica pronta para compartilhar",
];

const exampleCards = [
  {
    title: "Beauty salon",
    label: "Visual elegante",
    description: "Fotos, servicos, localizacao e agendamento em um layout premium.",
  },
  {
    title: "Barber shop",
    label: "Presenca forte",
    description: "Pagina rapida para apresentar ambiente, estilo e botao direto para contato.",
  },
  {
    title: "Massage & Spa",
    label: "Experiencia calma",
    description: "Uma apresentacao clara para reforcar cuidado, confianca e bem-estar.",
  },
  {
    title: "Nails studio",
    label: "Facil de compartilhar",
    description: "Ideal para concentrar portfolio, mapa, horarios e chamada para WhatsApp.",
  },
];

const trustPoints = [
  "Feito para negocios que vendem pelo WhatsApp e Instagram",
  "Visual responsivo para celular",
  "Pagina rapida, clara e profissional",
  "Previa personalizada antes de fechar",
];

export function PublicHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-white">
      <HeroSection />
      <DeliverablesSection />
      <BeforeAfterSection />
      <AudienceAndFlowSection />
      <ExamplesSection />
      <TrustSection />
      <FinalCtaSection />
    </main>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_28rem),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.16),transparent_20rem),linear-gradient(180deg,#07111f_0%,#0b1730_42%,#101c39_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_34%,rgba(255,255,255,0.02)_68%,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24 lg:pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="min-w-0 flex items-center gap-3 pr-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal-200 ring-1 ring-white/15 backdrop-blur sm:h-11 sm:w-11">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-teal-200/90 sm:text-xs sm:tracking-[0.26em]">
                Studio preview
              </p>
              <p className="text-xs font-semibold text-white sm:text-sm">
                Paginas profissionais para negocios locais
              </p>
            </div>
          </Link>
          <a
            href={PUBLIC_SERVICE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-on-dark min-h-10 w-full shrink-0 px-4 py-2 text-sm sm:min-h-11 sm:w-auto sm:px-5 sm:py-2.5"
          >
            Solicitar previa
          </a>
        </div>

        <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-14">
          <div className="max-w-3xl">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/7 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-teal-100 backdrop-blur sm:px-4 sm:text-xs sm:tracking-[0.22em]">
              <Star className="h-4 w-4 text-amber-300" />
              Previa personalizada sem compromisso
            </div>
            <h1 className="mt-5 max-w-5xl text-[2.4rem] font-semibold leading-[0.96] text-white sm:text-5xl sm:leading-[1.02] lg:text-7xl">
              Uma pagina profissional para seu negocio vender mais confianca em um unico link
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Criamos uma previa personalizada para saloes, barbearias, spas e
              negocios locais, reunindo fotos, servicos, localizacao e botao
              direto para contato.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={PUBLIC_SERVICE_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-light min-h-12 w-full px-6 py-3 text-base sm:w-auto"
              >
                Solicitar previa sem compromisso
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#como-funciona"
                className="btn btn-on-dark min-h-12 w-full px-6 py-3 text-base sm:w-auto"
              >
                Ver como funciona
              </a>
            </div>

            <div className="mt-7 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              {[
                "Tudo pronto para compartilhar no celular",
                "Organizacao clara de fotos, servicos e mapa",
                "WhatsApp ou agendamento em destaque",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[11rem] sm:min-h-[30rem]">
            <div className="absolute inset-0 rounded-[2.75rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] blur-3xl" />
            <div className="relative sm:hidden">
              <CompactPreviewCard />
            </div>
            <div className="relative mx-auto hidden max-w-[34rem] justify-center gap-4 sm:flex">
              <PhoneMockup variant="primary" />
              <PhoneMockup variant="secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CompactPreviewCard() {
  return (
    <div className="rounded-[2rem] border border-white/12 bg-white/10 p-4 shadow-[0_22px_60px_rgba(4,12,24,0.28)] backdrop-blur">
      <div className="rounded-[1.5rem] border border-white/12 bg-[#f8f2ea] p-4 text-zinc-950">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e7f7f4] text-teal-700">
            <LayoutPanelTop className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Previa pronta para compartilhar</p>
            <p className="text-xs text-zinc-500">Fotos, mapa e contato em um unico link</p>
          </div>
        </div>
        <div className="mt-4 h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,#fde68a_0%,#fb7185_100%)]" />
        <div className="mt-4 grid gap-2">
          <PhoneListItem
            icon={<MapPin className="h-4 w-4" />}
            label="Localizacao e rota"
          />
          <PhoneListItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="CTA direto para WhatsApp"
          />
        </div>
      </div>
    </div>
  );
}

function DeliverablesSection() {
  return (
    <section className="bg-[#f8fafc] px-4 py-14 text-zinc-950 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="O que entregamos"
          title="Uma pagina enxuta, bonita e pronta para passar confianca"
          description="Tudo o que o cliente precisa ver em poucos segundos, com visual profissional e foco em conversao por WhatsApp, Instagram ou agendamento."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deliveryItems.map((item) => (
            <article
              key={item}
              className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef7f7] text-teal-700">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold leading-7 text-zinc-900">{item}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  return (
    <section className="bg-white px-4 py-14 text-zinc-950 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-[2rem] border border-slate-200 bg-[#fff7f1] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
            Antes
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
            Informacoes espalhadas no Instagram
          </h2>
          <ul className="mt-6 grid gap-3 text-sm leading-7 text-zinc-600">
            <li>Fotos sem contexto comercial em sequencia</li>
            <li>Servicos, localizacao e horarios dispersos</li>
            <li>Cliente precisa perguntar tudo no direct</li>
          </ul>
        </div>
        <div className="rounded-[2rem] border border-teal-100 bg-[linear-gradient(180deg,#f4fffd_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            Depois
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
            Tudo organizado em uma pagina profissional
          </h2>
          <ul className="mt-6 grid gap-3 text-sm leading-7 text-zinc-600">
            <li>Visual mais confiavel para compartilhar em bio e WhatsApp</li>
            <li>Fotos, servicos, mapa e contato no mesmo link</li>
            <li>Mais clareza para quem esta decidindo agendar</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function AudienceAndFlowSection() {
  return (
    <section
      id="como-funciona"
      className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-4 py-14 text-zinc-950 sm:px-8 sm:py-16 lg:px-10 lg:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:gap-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <SectionHeader
            eyebrow="Para quem e"
            title="Negocios locais que precisam parecer mais organizados e profissionais"
            description="Especialmente para marcas que ja atendem bem, mas ainda dependem de Instagram, direct e conversa manual para explicar tudo."
            compact
          />
          <div className="mt-6 grid gap-3">
            {audienceItems.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-zinc-700"
              >
                <Sparkles className="h-4 w-4 text-teal-700" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-[#0d172b] p-6 text-white shadow-[0_20px_48px_rgba(15,23,42,0.18)]">
          <SectionHeader
            eyebrow="Como funciona"
            title="Uma previa rapida, clara e facil de aprovar"
            description="O processo foi pensado para apresentar o negocio com agilidade, sem transformar tudo em projeto longo ou complexo."
            compact
            dark
          />
          <div className="mt-6 grid gap-4">
            {flowItems.map((item, index) => (
              <div
                key={item}
                className="flex gap-4 rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-teal-100 ring-1 ring-white/10">
                  0{index + 1}
                </span>
                <p className="pt-1 text-sm leading-7 text-slate-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExamplesSection() {
  return (
    <section className="bg-white px-4 py-14 text-zinc-950 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Projetos / exemplos"
          title="Exemplos de presenca digital pensados para negocios locais"
          description="Uma apresentacao bonita, clara e compativel com diferentes estilos de atendimento."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {exampleCards.map((card, index) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(15,23,42,0.08)]"
            >
              <div
                className={`h-44 ${
                  index === 0
                    ? "bg-[linear-gradient(140deg,#fde68a_0%,#fb7185_100%)]"
                    : index === 1
                      ? "bg-[linear-gradient(140deg,#111827_0%,#334155_55%,#93c5fd_100%)]"
                      : index === 2
                        ? "bg-[linear-gradient(140deg,#cffafe_0%,#ddd6fe_100%)]"
                        : "bg-[linear-gradient(140deg,#fbcfe8_0%,#fef3c7_100%)]"
                }`}
              >
                <div className="flex h-full items-end p-5">
                  <div className="rounded-[1.35rem] border border-white/30 bg-white/20 px-4 py-3 text-white backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em]">
                      {card.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold">{card.title}</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-7 text-zinc-600">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_100%)] px-4 py-14 text-zinc-950 sm:px-8 sm:py-16 lg:px-10 lg:py-18">
      <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-slate-200 bg-white px-5 py-8 shadow-[0_20px_52px_rgba(15,23,42,0.06)] sm:px-8">
        <SectionHeader
          eyebrow="Confianca"
          title="Uma presenca digital mais clara para negocios que atendem rapido e bem"
          description="Sem promessas exageradas. A proposta e apresentar melhor o negocio e facilitar o proximo passo do cliente."
          compact
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustPoints.map((item) => (
            <div
              key={item}
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium leading-7 text-zinc-700"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="border-t border-white/10 bg-[linear-gradient(180deg,#0b1730_0%,#07111f_100%)] px-4 py-14 text-white sm:px-8 sm:py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
          <MessageCircle className="h-4 w-4" />
          Atendimento por WhatsApp
        </div>
        <h2 className="mt-6 text-3xl font-semibold leading-tight sm:text-5xl">
          Quer ver como a pagina do seu negocio pode ficar?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
          Envie o Instagram ou as informacoes principais do negocio e receba
          uma previa visual para avaliar com calma.
        </p>
        <div className="mt-8 flex justify-center">
          <a
            href={PUBLIC_SERVICE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-light min-h-12 w-full px-7 py-3 text-base sm:w-auto"
          >
            Solicitar previa no WhatsApp
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ variant }: { variant: "primary" | "secondary" }) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`relative mt-2 h-[24.5rem] w-full max-w-[16.5rem] rounded-[2.2rem] border border-white/15 p-3 shadow-[0_26px_70px_rgba(4,12,24,0.42)] backdrop-blur sm:mt-10 sm:h-[35rem] sm:w-[16.5rem] sm:max-w-none sm:rounded-[2.5rem] ${
        isPrimary
          ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))]"
          : "hidden translate-y-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] sm:block"
      }`}
    >
      <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/35" />
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-[#f8f2ea]">
        <div
          className={`h-28 sm:h-36 ${
            isPrimary
              ? "bg-[linear-gradient(140deg,#0f172a_0%,#0f766e_55%,#fbcfe8_100%)]"
              : "bg-[linear-gradient(140deg,#111827_0%,#312e81_58%,#67e8f9_100%)]"
          }`}
        />
        <div className="-mt-10 px-4 pb-4">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/92 p-4 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff8f7] text-teal-700">
                <LayoutPanelTop className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  Pagina pronta para compartilhar
                </p>
                <p className="text-xs text-zinc-500">Fotos, mapa e CTA no mesmo link</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[#f5f7fb] p-3">
                <div className="h-20 rounded-[1rem] bg-[linear-gradient(135deg,#fde68a_0%,#fb7185_100%)] sm:h-24" />
                <p className="mt-3 text-sm font-semibold text-zinc-900">Previa visual do negocio</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Apresentacao clara, profissional e compativel com celular.
                </p>
              </div>
              <div className="grid gap-2">
                <PhoneListItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Localizacao e rota"
                />
                <PhoneListItem
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Botao direto para contato"
                />
                <PhoneListItem
                  icon={<Smartphone className="h-4 w-4" />}
                  label="Ideal para bio do Instagram"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneListItem({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700">
      <span className="text-teal-700">{icon}</span>
      {label}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  compact = false,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <div className={compact ? "max-w-2xl" : "max-w-3xl"}>
      <p
        className={`text-xs font-semibold uppercase tracking-[0.22em] ${
          dark ? "text-teal-200" : "text-teal-700"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 font-semibold leading-tight ${
          compact ? "text-2xl sm:text-4xl" : "text-2xl sm:text-5xl"
        } ${dark ? "text-white" : "text-zinc-950"}`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-sm leading-7 sm:text-base sm:leading-8 ${
          dark ? "text-slate-300" : "text-zinc-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
