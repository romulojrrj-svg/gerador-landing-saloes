"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { SalonForm } from "@/components/salon/SalonForm";
import { createSalon, getSalonRepositoryStatus } from "@/lib/salon-repository";
import type { SalonFormInput } from "@/types/salon";

export default function NewSalonPage() {
  const router = useRouter();
  const repositoryStatus = getSalonRepositoryStatus();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(input: SalonFormInput) {
    setErrorMessage("");

    if (!input.name.trim()) {
      setErrorMessage("Informe o nome do salão antes de gerar a prévia.");
      return;
    }

    setIsSubmitting(true);
    const result = await createSalon(input);

    if (!result.ok) {
      setIsSubmitting(false);
      setErrorMessage(
        result.error ||
          "Não foi possível salvar a prévia neste navegador. Verifique se o localStorage está habilitado e tente novamente.",
      );

      return;
    }

    router.push(`/salons/${result.salon.slug}/preview`);
  }

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
            className="btn btn-primary min-h-10 px-4 py-2"
          >
            Prévia de exemplo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[96rem] gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[minmax(18rem,0.62fr)_minmax(0,1.38fr)] lg:px-10 lg:py-14 2xl:max-w-[104rem]">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <div className="rounded-[2rem] bg-zinc-950 p-7 text-white shadow-2xl shadow-zinc-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-6 w-6 text-rose-100" />
            </div>
            <h1 className="mt-8 text-4xl font-semibold leading-tight">
              Criar perfil do salão
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Cadastre um salão, salve os dados neste navegador e gere uma
              prévia navegável da landing. Depois você poderá editar o cadastro
              sem perder as informações.
            </p>

            <div className="mt-8 grid gap-3 text-sm">
              {[
                "Cadastrar salão",
                "Gerar prévia",
                "Revisar e editar",
                "Abrir página pública",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-teal-100">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-6 text-zinc-300">
              Armazenamento atual: {repositoryStatus.label}.{" "}
              {repositoryStatus.message}
            </div>
          </div>
        </aside>

        <SalonForm
          mode="create"
          submitLabel="Gerar prévia"
          cancelHref="/"
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          onSubmit={handleCreate}
        />
      </section>
    </main>
  );
}
