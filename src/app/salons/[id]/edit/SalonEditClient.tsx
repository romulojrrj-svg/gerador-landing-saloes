"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FileWarning, Sparkles } from "lucide-react";
import { SalonForm } from "@/components/salon/SalonForm";
import {
  getSalonBySlug,
  getSalonRepositoryStatus,
  getSalonRepositorySourceLabel,
  subscribeToSalonRepository,
  updateSalon,
  type SalonRepositorySource,
} from "@/lib/salon-repository";
import type { Salon, SalonFormInput } from "@/types/salon";

type SalonEditClientProps = {
  slug: string;
};

export function SalonEditClient({ slug }: SalonEditClientProps) {
  const router = useRouter();
  const repositoryStatus = getSalonRepositoryStatus();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [source, setSource] = useState<SalonRepositorySource>(
    repositoryStatus.activeSource,
  );
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadSalon() {
      setHasCheckedStorage(false);
      const result = await getSalonBySlug(slug);

      if (!isActive) {
        return;
      }

      if (result.ok) {
        setSalon(result.salon);
        setSource(result.source);
      } else {
        setSalon(null);
      }

      setHasCheckedStorage(true);
    }

    void loadSalon();
    const unsubscribe = subscribeToSalonRepository(() => {
      void loadSalon();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [slug]);

  async function handleUpdate(input: SalonFormInput) {
    setErrorMessage("");
    setSuccessMessage("");

    if (!input.name.trim()) {
      setErrorMessage("Informe o nome do salão antes de salvar.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateSalon(slug, input);

    if (!result.ok) {
      setIsSubmitting(false);
      setErrorMessage(
        result.error ||
          "Não foi possível salvar as alterações. Tente novamente.",
      );

      return;
    }

    setSalon(result.salon);
    setSource(result.source);
    setSuccessMessage("Alterações salvas com sucesso.");
    router.push(`/salons/${result.salon.slug}/preview`);
  }

  if (!hasCheckedStorage) {
    return <EditLoading />;
  }

  if (!salon) {
    return <EditNotFound slug={slug} />;
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
          <Link
            href={`/salons/${slug}/preview`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para prévia
          </Link>
          <Link href="/" className="btn btn-secondary min-h-10 px-4 py-2">
            Painel
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:px-10 lg:py-14">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <div className="rounded-[2rem] bg-zinc-950 p-7 text-white shadow-2xl shadow-zinc-950/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Sparkles className="h-6 w-6 text-rose-100" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-rose-100">
              Editando cadastro
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              {salon.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Atualize dados, links e direcionamento da landing. O slug atual é
              mantido para preservar a prévia já criada.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-6 text-zinc-300">
              Armazenamento deste salão:{" "}
              {getSalonRepositorySourceLabel(source)}.{" "}
              {repositoryStatus.message}
            </div>
          </div>
        </aside>

        <SalonForm
          key={salon.slug}
          mode="edit"
          initialSalon={salon}
          submitLabel="Salvar alterações"
          cancelHref={`/salons/${slug}/preview`}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          successMessage={successMessage}
          onSubmit={handleUpdate}
        />
      </section>
    </main>
  );
}

function EditLoading() {
  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-800">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-zinc-950">
            Carregando dados do salão...
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Buscando as informações salvas antes de abrir a edição.
          </p>
        </div>
      </section>
    </main>
  );
}

function EditNotFound({ slug }: { slug: string }) {
  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <section className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-xl rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-2xl shadow-zinc-950/10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-800">
            <FileWarning className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-zinc-950">
            Salão não encontrado
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Não encontramos um cadastro salvo para <strong>{slug}</strong>. Você
            pode voltar para a prévia de exemplo ou criar um novo salão.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/salons/${slug}/preview`} className="btn btn-secondary px-5 py-3">
              Ver prévia com exemplo
            </Link>
            <Link href="/salons/new" className="btn btn-primary px-5 py-3">
              Criar novo salão
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
