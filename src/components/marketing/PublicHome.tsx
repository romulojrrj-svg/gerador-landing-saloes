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
  "Página profissional em um único link",
  "Fotos, serviços e diferenciais organizados",
  "Localização, rota e botão de contato direto",
  "Visual pensado para bio do Instagram e WhatsApp",
  "Experiência otimizada para celular",
  "Prévia personalizada antes de fechar",
];

const audienceItems = [
  "Salões de beleza",
  "Barbearias",
  "Spas e massagens",
  "Clínicas de estética",
  "Nail designers",
  "Negócios locais que atendem por WhatsApp ou Instagram",
];

const flowItems = [
  "Você envia o Instagram ou as informações do negócio",
  "Nós montamos uma prévia visual sem compromisso",
  "Ajustamos fotos, textos e detalhes importantes",
  "Sua página fica pronta para compartilhar",
];

const exampleCards = [
  {
    title: "Beauty salon",
    label: "Visual elegante",
    description: "Fotos, serviços, localização e agendamento em um layout premium.",
  },
  {
    title: "Barber shop",
    label: "Presença forte",
    description: "Página rápida para apresentar ambiente, estilo e botão direto para contato.",
  },
  {
    title: "Massage & Spa",
    label: "Experiência calma",
    description: "Uma apresentação clara para reforçar cuidado, confiança e bem-estar.",
  },
  {
    title: "Nails studio",
    label: "Fácil de compartilhar",
    description: "Ideal para concentrar portfólio, mapa, horários e chamada para WhatsApp.",
  },
];

const trustPoints = [
  "Feito para negócios que vendem pelo WhatsApp e Instagram",
  "Visual responsivo para celular",
  "Página rápida, clara e profissional",
  "Prévia personalizada antes de fechar",
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
      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24 lg:pt-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-teal-200/90">
                Studio preview
              </p>
              <p className="text-sm font-semibold text-white">
                Páginas profissionais para negócios locais
              </p>
            </div>
          </Link>
          <a
            href={PUBLIC_SERVICE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-on-dark min-h-11 px-5 py-2.5"
          >
            Solicitar prévia
          </a>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:gap-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/7 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100 backdrop-blur">
              <Star className="h-4 w-4 text-amber-300" />
              Prévia personalizada sem compromisso
            </div>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.02] text-white sm:text-5xl lg:text-7xl">
              Uma página profissional para seu negócio vender mais confiança em um único link
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Criamos uma prévia personalizada para salões, barbearias, spas e
              negócios locais, reunindo fotos, serviços, localização e botão
              direto para contato.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={PUBLIC_SERVICE_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="btn btn-light min-h-12 px-6 py-3 text-base"
              >
                Solicitar prévia sem compromisso
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#como-funciona"
                className="btn btn-on-dark min-h-12 px-6 py-3 text-base"
              >
                Ver como funciona
              </a>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
              {[
                "Tudo pronto para compartilhar no celular",
                "Organização clara de fotos, serviços e mapa",
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

          <div className="relative min-h-[30rem]">
            <div className="absolute inset-0 rounded-[2.75rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%),linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))] blur-3xl" />
            <div className="relative mx-auto flex max-w-[34rem] justify-center gap-4">
              <PhoneMockup variant="primary" />
              <PhoneMockup variant="secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeliverablesSection() {
  return (
    <section className="bg-[#f8fafc] px-6 py-16 text-zinc-950 sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="O que entregamos"
          title="Uma página enxuta, bonita e pronta para passar confiança"
          description="Tudo o que o cliente precisa ver em poucos segundos, com visual profissional e foco em conversão por WhatsApp, Instagram ou agendamento."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    <section className="bg-white px-6 py-16 text-zinc-950 sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-[#fff7f1] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-500">
            Antes
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
            Informações espalhadas no Instagram
          </h2>
          <ul className="mt-6 grid gap-3 text-sm leading-7 text-zinc-600">
            <li>Fotos sem contexto comercial em sequência</li>
            <li>Serviços, localização e horários dispersos</li>
            <li>Cliente precisa perguntar tudo no direct</li>
          </ul>
        </div>
        <div className="rounded-[2rem] border border-teal-100 bg-[linear-gradient(180deg,#f4fffd_0%,#ffffff_100%)] p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
            Depois
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-950">
            Tudo organizado em uma página profissional
          </h2>
          <ul className="mt-6 grid gap-3 text-sm leading-7 text-zinc-600">
            <li>Visual mais confiável para compartilhar em bio e WhatsApp</li>
            <li>Fotos, serviços, mapa e contato no mesmo link</li>
            <li>Mais clareza para quem está decidindo agendar</li>
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
      className="bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] px-6 py-16 text-zinc-950 sm:px-8 lg:px-10 lg:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)]">
          <SectionHeader
            eyebrow="Para quem é"
            title="Negócios locais que precisam parecer mais organizados e profissionais"
            description="Especialmente para marcas que já atendem bem, mas ainda dependem de Instagram, direct e conversa manual para explicar tudo."
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
            title="Uma prévia rápida, clara e fácil de aprovar"
            description="O processo foi pensado para apresentar o negócio com agilidade, sem transformar tudo em projeto longo ou complexo."
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
    <section className="bg-white px-6 py-16 text-zinc-950 sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Projetos / exemplos"
          title="Exemplos de presença digital pensados para negócios locais"
          description="Uma apresentação bonita, clara e compatível com diferentes estilos de atendimento."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
    <section className="bg-[linear-gradient(180deg,#f7f9fc_0%,#ffffff_100%)] px-6 py-16 text-zinc-950 sm:px-8 lg:px-10 lg:py-18">
      <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_20px_52px_rgba(15,23,42,0.06)] sm:px-8">
        <SectionHeader
          eyebrow="Confiança"
          title="Uma presença digital mais clara para negócios que atendem rápido e bem"
          description="Sem promessas exageradas. A proposta é apresentar melhor o negócio e facilitar o próximo passo do cliente."
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
    <section className="border-t border-white/10 bg-[linear-gradient(180deg,#0b1730_0%,#07111f_100%)] px-6 py-16 text-white sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
          <MessageCircle className="h-4 w-4" />
          Atendimento por WhatsApp
        </div>
        <h2 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
          Quer ver como a página do seu negócio pode ficar?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
          Envie o Instagram ou as informações principais do negócio e receba
          uma prévia visual para avaliar com calma.
        </p>
        <div className="mt-8 flex justify-center">
          <a
            href={PUBLIC_SERVICE_WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-light min-h-12 px-7 py-3 text-base"
          >
            Solicitar prévia no WhatsApp
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
      className={`relative mt-10 h-[32rem] w-[15rem] rounded-[2.5rem] border border-white/15 p-3 shadow-[0_26px_70px_rgba(4,12,24,0.42)] backdrop-blur sm:h-[35rem] sm:w-[16.5rem] ${
        isPrimary
          ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))]"
          : "translate-y-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))]"
      }`}
    >
      <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/35" />
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] bg-[#f8f2ea]">
        <div
          className={`h-36 ${
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
                  Página pronta para compartilhar
                </p>
                <p className="text-xs text-zinc-500">Fotos, mapa e CTA no mesmo link</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-[#f5f7fb] p-3">
                <div className="h-24 rounded-[1rem] bg-[linear-gradient(135deg,#fde68a_0%,#fb7185_100%)]" />
                <p className="mt-3 text-sm font-semibold text-zinc-900">Prévia visual do negócio</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Apresentação clara, profissional e compatível com celular.
                </p>
              </div>
              <div className="grid gap-2">
                <PhoneListItem
                  icon={<MapPin className="h-4 w-4" />}
                  label="Localização e rota"
                />
                <PhoneListItem
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="Botão direto para contato"
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
          compact ? "text-3xl sm:text-4xl" : "text-3xl sm:text-5xl"
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
