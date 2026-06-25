import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  ExternalLink,
  Globe2,
  ImagePlus,
  AtSign,
  Languages,
  Link2,
  MapPin,
  MapPinned,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

const services = [
  "Design de cabelo",
  "Coloração",
  "Rituais de pele",
  "Noivas e eventos",
  "Ateliê de unhas",
  "Maquiagem",
];

const vibes = ["Editorial", "Luxo suave", "Minimalista", "Bem-estar"];

const sourceFields = [
  {
    label: "Link do Instagram",
    placeholder: "https://www.instagram.com/nomedoseusalao",
    defaultValue: "https://www.instagram.com/maisonlumiere",
    help: "Será usado futuramente para sugerir fotos, estilo visual e provas sociais.",
    icon: AtSign,
  },
  {
    label: "Link do Google Maps / Perfil da Empresa",
    placeholder: "https://maps.google.com/...",
    defaultValue: "https://maps.google.com/?q=Maison+Lumiere+Atelier",
    help: "Preparado para buscar endereço, avaliações, fotos públicas e dados do negócio.",
    icon: MapPinned,
  },
  {
    label: "Site",
    optional: "opcional",
    placeholder: "https://www.seusalao.com",
    defaultValue: "https://maisonlumiere.example",
    help: "Pode ajudar a preservar tom de marca, serviços e informações já publicadas.",
    icon: Globe2,
  },
  {
    label: "Link de agendamento",
    optional: "opcional",
    placeholder: "https://booking.seusalao.com",
    defaultValue: "https://booking.maisonlumiere.example",
    help: "Será usado como destino principal dos botões de conversão da landing.",
    icon: ExternalLink,
  },
];

const imageActions = [
  {
    label: "Buscar do Instagram",
    description: "Mockado",
    icon: AtSign,
  },
  {
    label: "Buscar do Google",
    description: "Mockado",
    icon: Search,
  },
  {
    label: "Enviar manualmente",
    description: "Envio futuro",
    icon: Upload,
  },
  {
    label: "Colar URL da imagem",
    description: "URL externa",
    icon: Link2,
  },
];

const imageSlots = [
  {
    title: "Imagem principal",
    description: "Capa da landing, ideal para fachada, equipe ou ambiente premium.",
  },
  {
    title: "Imagem do ambiente",
    description: "Interior, recepção, estações de atendimento ou detalhes do espaço.",
  },
  {
    title: "Imagem de serviço",
    description: "Tratamento, atendimento em andamento ou produto aplicado.",
  },
  {
    title: "Imagem de resultado",
    description: "Transformação, finalização, antes/depois ou look pronto.",
  },
];

export default function NewSalonPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link
            href="/salons/maison-lumiere/preview"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Prévia de exemplo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-14">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <div className="rounded-[2rem] bg-zinc-950 p-7 text-white shadow-2xl shadow-zinc-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-6 w-6 text-rose-100" />
            </div>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">
              Criar perfil do salão
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Este cadastro visual prepara as informações que depois alimentarão
              o gerador de landing pages. Por enquanto, tudo permanece estático
              e mockado.
            </p>

            <div className="mt-8 grid gap-3 text-sm">
              {[
                "Posicionamento da marca",
                "Menu de serviços",
                "Fontes de imagens",
                "Chamada para agendamento",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-100">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <form className="grid gap-5">
          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-zinc-950">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Identidade do salão
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Dados centrais usados para orientar o título, o tom de voz e a
                  proposta da landing page.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Nome do salão
                </span>
                <input
                  type="text"
                  defaultValue="Maison Lumiere Atelier"
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Localização
                </span>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    defaultValue="Mayfair, London"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
                  />
                </div>
              </label>
              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Frase de posicionamento
                </span>
                <textarea
                  rows={4}
                  defaultValue="Luxury hair artistry, skin rituals, and luminous styling in the heart of Mayfair."
                  className="resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
                />
              </label>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-800">
                <Globe2 className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Direção da marca
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Configure o estilo, os serviços e o idioma em que a landing
                  pública será apresentada ao cliente final.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-6">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Idioma da landing
                </span>
                <div className="relative">
                  <Languages className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <select
                    defaultValue="en"
                    className="w-full appearance-none rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
                  >
                    <option value="pt-BR">Português do Brasil</option>
                    <option value="en">Inglês</option>
                    <option value="es">Espanhol</option>
                    <option value="fr">Francês</option>
                  </select>
                </div>
                <span className="text-xs leading-5 text-zinc-500">
                  A interface interna fica em português. O conteúdo público pode
                  seguir o idioma escolhido para o salão.
                </span>
              </label>

              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  Estilo visual
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {vibes.map((vibe, index) => (
                    <label
                      key={vibe}
                      className="flex cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition has-[:checked]:border-zinc-950 has-[:checked]:bg-zinc-950 has-[:checked]:text-white"
                    >
                      <input
                        type="radio"
                        name="vibe"
                        defaultChecked={index === 1}
                        className="sr-only"
                      />
                      {vibe}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-zinc-800">
                  Serviços oferecidos
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service, index) => (
                    <label
                      key={service}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={index < 4}
                        className="h-4 w-4 accent-teal-700"
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-zinc-950">
                <Camera className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">
                  Fontes e imagens do salão
                </h2>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Prepare links e imagens para que, futuramente, o sistema possa
                  sugerir ativos a partir do Instagram, Google, uploads manuais
                  ou URLs coladas.
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {sourceFields.map((field) => {
                const Icon = field.icon;

                return (
                  <label key={field.label} className="grid gap-2">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-800">
                      {field.label}
                      {field.optional ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          {field.optional}
                        </span>
                      ) : null}
                    </span>
                    <div className="relative">
                      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="url"
                        defaultValue={field.defaultValue}
                        placeholder={field.placeholder}
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-11 pr-4 text-sm text-zinc-950 outline-none transition focus:border-teal-700 focus:bg-white"
                      />
                    </div>
                    <span className="text-xs leading-5 text-zinc-500">
                      {field.help}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Métodos de imagem preparados
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Botões visuais mockados para a próxima etapa de integração.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {imageActions.map((action) => {
                    const Icon = action.icon;

                    return (
                      <button
                        key={action.label}
                        type="button"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-rose-200 hover:bg-rose-50"
                      >
                        <Icon className="h-4 w-4 text-teal-700" />
                        <span className="flex flex-col text-left leading-tight">
                          {action.label}
                          <span className="text-[11px] font-medium text-zinc-500">
                            {action.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {imageSlots.map((slot) => (
                <button
                  key={slot.title}
                  type="button"
                  className="group flex min-h-72 flex-col rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-4 text-left transition hover:border-rose-300 hover:bg-rose-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-200 transition group-hover:text-rose-500">
                    <ImagePlus className="h-6 w-6" />
                  </span>
                  <span className="mt-5 text-sm font-semibold text-zinc-950">
                    {slot.title}
                  </span>
                  <span className="mt-2 text-xs leading-5 text-zinc-500">
                    {slot.description}
                  </span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-6">
                    {["Instagram", "Google", "Manual", "URL"].map((source) => (
                      <span
                        key={source}
                        className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-500 ring-1 ring-zinc-200"
                      >
                        {source}
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-3 rounded-[1.5rem] border border-teal-100 bg-teal-50/70 p-4 text-sm leading-6 text-teal-950">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
              <p>
                A busca automática de imagens usará fontes conectadas ou dados
                públicos aprovados do negócio. Você sempre poderá substituir as
                imagens manualmente antes de publicar.
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-white"
            >
              Cancelar
            </Link>
            <Link
              href="/salons/maison-lumiere/preview"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Ver landing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
