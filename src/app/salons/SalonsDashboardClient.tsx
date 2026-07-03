"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Clipboard,
  Copy,
  Database,
  Edit3,
  ExternalLink,
  Eye,
  Globe2,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { calculateLandingReadiness } from "@/lib/copy-generator";
import {
  getAbsoluteAppUrl,
  getApproachMessage,
  getCommercialReadinessLabel,
  getPreviewPath,
  getPublicLandingPath,
} from "@/lib/mvp-commercial";
import {
  deleteSalon,
  duplicateSalon,
  createSalon,
  getLocalSalonCount,
  getSalonRepositoryStatus,
  getSalonRepositorySourceLabel,
  getSupabaseSalonCount,
  listSalons,
  migrateLocalSalonsToSupabase,
  subscribeToSalonRepository,
  type SalonRepositorySource,
  type SalonRepositoryStatus,
} from "@/lib/salon-repository";
import { landingLanguageLabels } from "@/lib/salon-storage";
import type { Salon } from "@/types/salon";

export function SalonsDashboardClient() {
  const repositoryStatus = getSalonRepositoryStatus();
  const isDevelopment = process.env.NODE_ENV === "development";
  const requestedStorageMode = process.env.NEXT_PUBLIC_STORAGE_MODE ?? "default";
  const [salons, setSalons] = useState<Salon[]>([]);
  const [source, setSource] = useState<SalonRepositorySource>(
    repositoryStatus.activeSource,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isCreatingTestSalon, setIsCreatingTestSalon] = useState(false);
  const [pendingDeleteSalon, setPendingDeleteSalon] = useState<Salon | null>(
    null,
  );
  const [localCount, setLocalCount] = useState(0);
  const [supabaseCount, setSupabaseCount] = useState<number | null>(null);

  async function loadDashboard() {
    setIsLoading(true);
    const result = await listSalons();
    const nextLocalCount = getLocalSalonCount();
    const nextSupabaseCount = await getSupabaseSalonCount();

    console.debug?.("[salons-dashboard]", {
      storageMode: requestedStorageMode,
      repositorySource: result.source,
      salonsLoaded: result.salons.length,
    });

    if (result.ok) {
      setSalons(result.salons);
      setSource(result.source);
      if (result.warning) {
        setMessage(`Aviso: ${result.warning}`);
      }
    } else {
      setSalons(result.salons);
      setSource(result.source);
      setMessage(result.error);
    }

    setLocalCount(nextLocalCount);
    setSupabaseCount(nextSupabaseCount);
    setIsLoading(false);
  }

  useEffect(() => {
    let isActive = true;

    async function loadDashboardSafe() {
      const result = await listSalons();
      const nextLocalCount = getLocalSalonCount();
      const nextSupabaseCount = await getSupabaseSalonCount();

      if (!isActive) {
        return;
      }

      if (result.ok) {
        setSalons(result.salons);
        setSource(result.source);
        if (result.warning) {
          setMessage(`Aviso: ${result.warning}`);
        }
      } else {
        setSalons(result.salons);
        setSource(result.source);
        setMessage(result.error);
      }

      setLocalCount(nextLocalCount);
      setSupabaseCount(nextSupabaseCount);
      setIsLoading(false);
    }

    void loadDashboardSafe();
    const unsubscribe = subscribeToSalonRepository(() => {
      void loadDashboardSafe();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  async function handleDuplicate(slug: string) {
    setMessage("");
    const result = await duplicateSalon(slug);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setMessage(`Salão duplicado: ${result.salon.name}.`);
  }

  function handleDelete(salon: Salon) {
    setPendingDeleteSalon(salon);
  }

  async function confirmDelete() {
    if (!pendingDeleteSalon) {
      return;
    }

    const deleted = await deleteSalon(pendingDeleteSalon.slug);
    setMessage(
      deleted.ok
        ? `Salão excluído: ${pendingDeleteSalon.name}.`
        : deleted.error,
    );
    setPendingDeleteSalon(null);
  }

  async function handleMigration() {
    setMessage("");
    const result = await migrateLocalSalonsToSupabase();

    if (!result.ok) {
      setMessage(result.error);
      await loadDashboard();
      return;
    }

    const summary = `Migração concluída: ${result.created} criado${result.created === 1 ? "" : "s"}, ${result.updated} atualizado${result.updated === 1 ? "" : "s"}, ${result.failed} falha${result.failed === 1 ? "" : "s"}.`;
    setMessage(
      result.failed && result.errors.length
        ? `${summary} ${result.errors.join(" | ")}`
        : summary,
    );
    await loadDashboard();
  }

  async function handleCreateTestSalon() {
    setIsCreatingTestSalon(true);
    setMessage("");

    const result = await createSalon(buildDashboardTestSalonInput());

    setIsCreatingTestSalon(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setMessage(
      `Salão teste criado em ${getSalonRepositorySourceLabel(result.source)}: ${result.salon.name}.`,
    );
    await loadDashboard();
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Painel inicial
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/salons/import" className="btn btn-secondary min-h-10 px-4 py-2">
              <Database className="h-4 w-4" />
              Importar planilha
            </Link>
            <Link href="/salons/new" className="btn btn-primary min-h-10 px-4 py-2">
              <Plus className="h-4 w-4" />
              Criar landing para prospecção
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
              <Sparkles className="h-4 w-4 text-rose-400" />
              Painel operacional
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              Salões salvos
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              Centralize aqui os salões do Outscraper, gere a copy, revise a
              landing e copie o pacote de abordagem comercial sem sair do painel.
            </p>
          </div>
          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5">
            <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-4">
              <Metric label="Salões" value={String(salons.length)} />
              <Metric label="Origem" value={getSalonRepositorySourceLabel(source)} />
              <Metric
                label="Com Instagram"
                value={String(salons.filter((salon) => salon.instagramUrl).length)}
              />
              <Metric
                label="Com Google"
                value={String(salons.filter((salon) => salon.googleMapsUrl).length)}
              />
            </div>
          </div>
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
            {message}
          </p>
        ) : null}

        <DatabasePanel
          localCount={localCount}
          supabaseCount={supabaseCount}
          repositoryStatus={repositoryStatus}
          source={source}
          sourceCount={salons.length}
          onMigrate={handleMigration}
        />

        {isDevelopment ? (
          <DevStorageDebugPanel
            requestedStorageMode={requestedStorageMode}
            activeSource={source}
            salonCount={salons.length}
            isCreatingTestSalon={isCreatingTestSalon}
            onReload={() => void loadDashboard()}
            onCreateTestSalon={() => void handleCreateTestSalon()}
          />
        ) : null}

        <div className="mt-8 grid gap-4">
          {isLoading ? (
            <EmptyState title="Carregando salões..." />
          ) : salons.length ? (
            salons.map((salon) => (
              <SalonRow
                key={salon.slug}
                salon={salon}
                storageSource={source}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <EmptyState title="Nenhum salão salvo ainda." />
          )}
        </div>
      </section>

      {pendingDeleteSalon ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
                  Confirmar exclusão
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-zinc-950">
                  Excluir {pendingDeleteSalon.name}?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteSalon(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
                aria-label="Cancelar exclusão"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              Esta ação remove o cadastro do armazenamento ativo. O localStorage
              antigo não é apagado automaticamente durante o modo compartilhado
              nem durante uma migração para Supabase.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDeleteSalon(null)}
                className="btn btn-secondary px-5 py-3"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="btn border-rose-200 bg-rose-50 px-5 py-3 text-rose-950 hover:bg-rose-100"
              >
                Excluir salão
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function DevStorageDebugPanel({
  requestedStorageMode,
  activeSource,
  salonCount,
  isCreatingTestSalon,
  onReload,
  onCreateTestSalon,
}: {
  requestedStorageMode: string;
  activeSource: SalonRepositorySource;
  salonCount: number;
  isCreatingTestSalon: boolean;
  onReload: () => void;
  onCreateTestSalon: () => void;
}) {
  const serverLocalActive = activeSource === "server-local";

  return (
    <section className="mt-8 rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Debug de desenvolvimento
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-950">
            Storage atual: {activeSource}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            NEXT_PUBLIC_STORAGE_MODE={requestedStorageMode} · {salonCount} salão(ões) carregado(s)
          </p>
          {!serverLocalActive ? (
            <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
              server-local não está ativo. Reinicie o dev server após alterar .env.local.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onReload}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar salões
          </button>
          <button
            type="button"
            onClick={onCreateTestSalon}
            disabled={isCreatingTestSalon}
            className="btn btn-primary min-h-10 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {isCreatingTestSalon
              ? "Criando salão teste..."
              : "Criar salão teste no server-local"}
          </button>
          <Link
            href="/api/dev/salons"
            target="_blank"
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir /api/dev/salons
          </Link>
        </div>
      </div>
    </section>
  );
}

function DatabasePanel({
  localCount,
  supabaseCount,
  repositoryStatus,
  source,
  sourceCount,
  onMigrate,
}: {
  localCount: number;
  supabaseCount: number | null;
  repositoryStatus: SalonRepositoryStatus;
  source: SalonRepositorySource;
  sourceCount: number;
  onMigrate: () => void;
}) {
  const canMigrate =
    repositoryStatus.supabaseConfigured && repositoryStatus.supabaseWriteEnabled;
  const migrationSourceLabel = source === "server-local" ? "Server-local" : "LocalStorage";
  const migrationSourceCount = source === "server-local" ? sourceCount : localCount;

  return (
    <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
            <Database className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">
              Banco de dados
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
              Armazenamento atual: {getSalonRepositorySourceLabel(source)}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
              {repositoryStatus.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onMigrate}
          disabled={!canMigrate || migrationSourceCount === 0}
          className="btn btn-secondary min-h-10 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Migrar salões locais para Supabase
        </button>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Metric
          label={migrationSourceLabel}
          value={`${migrationSourceCount} salões`}
        />
        <Metric
          label="Supabase"
          value={
            repositoryStatus.supabaseConfigured
              ? `${supabaseCount ?? 0} salões`
              : "não configurado"
          }
        />
        <Metric
          label="Migração"
          value={canMigrate ? "disponível" : "bloqueada"}
        />
      </div>
    </section>
  );
}

function SalonRow({
  salon,
  storageSource,
  onDuplicate,
  onDelete,
}: {
  salon: Salon;
  storageSource: SalonRepositorySource;
  onDuplicate: (slug: string) => void;
  onDelete: (salon: Salon) => void;
}) {
  const [feedback, setFeedback] = useState("");
  const readiness = calculateLandingReadiness(salon);
  const hasGeneratedCopy = Boolean(salon.copySuggestions || salon.generatedCopy);
  const hasAppliedCopy = Boolean(salon.generatedCopy?.status === "applied");
  const previewPath = getPreviewPath(salon.slug);
  const publicPath = getPublicLandingPath(salon.slug);
  const previewUrl = getAbsoluteAppUrl(previewPath);
  const publicUrl = getAbsoluteAppUrl(publicPath);
  const approachMessage = getApproachMessage(salon);
  const readinessLabel = getCommercialReadinessLabel(salon);

  async function handleCopyPublicLink() {
    const copied = await copyTextToClipboard(publicUrl);
    setFeedback(
      copied ? "Link público copiado." : "Não foi possível copiar o link público.",
    );
  }

  async function handleCopyApproachMessage() {
    const copied = await copyTextToClipboard(approachMessage);
    setFeedback(
      copied
        ? "Mensagem de abordagem copiada."
        : "Não foi possível copiar a mensagem de abordagem.",
    );
  }

  return (
    <article className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-zinc-950">{salon.name}</h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">
              {salon.status}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-600">
            <Badge icon={MapPin} label={salon.location || "Sem localização"} />
            <Badge
              icon={Globe2}
              label={
                landingLanguageLabels[salon.language] ??
                landingLanguageLabels[salon.landingLanguage] ??
                salon.language
              }
            />
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
              Criado em {formatDate(salon.createdAt)}
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600">
              Atualizado em {formatDate(salon.updatedAt)}
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatusPill
              active={Boolean(salon.instagramUrl)}
              label={`Instagram: ${salon.instagramUrl ? "sim" : "não"}`}
            />
            <StatusPill
              active={Boolean(salon.googleMapsUrl)}
              label={`Google: ${salon.googleMapsUrl ? "sim" : "não"}`}
            />
            <StatusPill
              active={salon.hasRealImages}
              label={`Fotos reais: ${salon.hasRealImages ? "sim" : "não"}`}
            />
            <StatusPill
              active={salon.hasRealReviews}
              label={`Reviews reais: ${salon.hasRealReviews ? "sim" : "não"}`}
            />
            <StatusPill
              active={isReadyToPublish(salon)}
              label={`Pronto: ${isReadyToPublish(salon) ? "sim" : "não"}`}
            />
            <StatusPill
              active={hasGeneratedCopy}
              label={`Textos: ${hasGeneratedCopy ? "gerados" : "pendente"}`}
            />
            <StatusPill
              active={hasAppliedCopy}
              label={`Copy aplicada: ${hasAppliedCopy ? "sim" : "não"}`}
            />
            <StatusPill
              active={readiness.score >= 70}
              label={`Score: ${readiness.score}/100`}
            />
            <StatusPill active={salon.status === "published"} label={readinessLabel} />
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-950">Abordagem comercial</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Link público, preview interno e mensagem pronta para abrir a
                  conversa com o salão.
                </p>
              </div>
              <span className="rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                {readinessLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-xs leading-5 text-zinc-600">
              <div>
                <p className="font-semibold text-zinc-900">Link de preview interno</p>
                <p className="break-all">{previewUrl}</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Link público da landing</p>
                <p className="break-all">{publicUrl}</p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">Mensagem de abordagem</p>
                <p className="text-sm leading-6 text-zinc-700">{approachMessage}</p>
              </div>
            </div>

            {storageSource !== "supabase" ? (
              <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
                {storageSource === "server-local"
                  ? "Este link funciona em qualquer dispositivo conectado ao mesmo dev server local. Para envio externo real, ainda será preciso publicar com deploy."
                  : "Este link funciona apenas neste navegador/ambiente local. Para enviar ao cliente, publique com Supabase e deploy."}
              </p>
            ) : null}

            {feedback ? (
              <p className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-xs font-semibold text-teal-950">
                {feedback}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link
            href={`/salons/${salon.slug}/edit`}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Link>
          <Link
            href={`/salons/${salon.slug}/edit#copy-assistant`}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <Sparkles className="h-4 w-4" />
            Gerar textos
          </Link>
          <Link href={previewPath} className="btn btn-secondary min-h-10 px-4 py-2">
            <Eye className="h-4 w-4" />
            Ver prévia
          </Link>
          <Link
            href={publicPath}
            target="_blank"
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <ExternalLink className="h-4 w-4" />
            Página pública
          </Link>
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <Clipboard className="h-4 w-4" />
            Copiar link público
          </button>
          <button
            type="button"
            onClick={handleCopyApproachMessage}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <Clipboard className="h-4 w-4" />
            Copiar mensagem
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(salon.slug)}
            className="btn btn-secondary min-h-10 px-4 py-2"
          >
            <Copy className="h-4 w-4" />
            Duplicar
          </button>
          <button
            type="button"
            onClick={() => onDelete(salon)}
            className="btn min-h-10 border-rose-200 bg-rose-50 px-4 py-2 text-rose-950 hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-2xl font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function Badge({
  icon: Icon,
  label,
}: {
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
      <Icon className="h-4 w-4 text-teal-700" />
      {label}
    </span>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-2xl px-3 py-2 text-xs font-semibold ${
        active
          ? "bg-teal-50 text-teal-900 ring-1 ring-teal-100"
          : "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
      }`}
    >
      {label}
    </span>
  );
}

function isReadyToPublish(salon: Salon) {
  const hasContact = Boolean(
    salon.bookingUrl ||
      salon.whatsapp ||
      salon.phone ||
      salon.instagramUrl ||
      salon.googleMapsUrl,
  );
  const hasSelectedRealImage = salon.galleryImages.some(
    (image) => image.isReal && image.selectedForLanding,
  );

  return Boolean(
    salon.name &&
      salon.location &&
      hasContact &&
      salon.services.length &&
      hasSelectedRealImage,
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-8 text-center">
      <p className="text-lg font-semibold text-zinc-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-500">
        Crie um cadastro para começar a gerar prévias.
      </p>
      <Link href="/salons/new" className="btn btn-primary mt-5 px-5 py-3">
        Criar landing para prospecção
      </Link>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "data indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildDashboardTestSalonInput() {
  return {
    name: "Studio Bella Hair",
    location: "Rio de Janeiro, Brasil",
    city: "Rio de Janeiro",
    country: "Brasil",
    status: "published" as const,
    language: "pt-BR" as const,
    positioningLine:
      "Landing de teste para validar o storage compartilhado em desenvolvimento.",
    description:
      "Cadastro de teste criado diretamente pelo painel para validar o modo server-local.",
    visualStyle: "Luxo suave",
    brandTone: "Premium e acolhedor",
    instagramUrl: "https://www.instagram.com/studiobellahair/",
    googleMapsUrl: "https://maps.google.com/?q=Studio+Bella+Hair",
    websiteUrl: "",
    bookingUrl: "",
    whatsapp: "+55 21 98888-0000",
    phone: "",
    businessHours: "Segunda a sabado, de 09:00 as 19:00",
    address: "Rua teste, 100 - Rio de Janeiro",
    extractedBusinessInfo: {
      businessHours: "Segunda a sabado, de 09:00 as 19:00",
      address: "Rua teste, 100 - Rio de Janeiro",
      observedServices: "cabelo, escova, coloracao",
      differentiators: "Teste interno para validar armazenamento compartilhado.",
      visualNotes: "Uso interno de desenvolvimento.",
    },
    manualAssistantNotes:
      "Criado pelo painel de debug para validar o modo server-local.",
    selectedServices: ["Cabelo", "Coloracao"],
    notes:
      "Salão de teste criado automaticamente no painel de desenvolvimento.",
  };
}

async function copyTextToClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
