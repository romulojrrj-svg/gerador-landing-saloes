"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Globe2,
  LoaderCircle,
  Sparkles,
  Upload,
  XCircle,
} from "lucide-react";
import {
  buildImportReport,
  buildOutscraperPreview,
  buildSalonForOutscraperImport,
  detectOutscraperColumns,
  makeUniqueSlug,
  type OutscraperDetectedColumn,
  type OutscraperInstagramImageImportItem,
  type OutscraperInstagramImageImportReport,
  type OutscraperImportPreviewRow,
  type OutscraperImportReport,
  type OutscraperImportStats,
  type OutscraperRawRow,
} from "@/lib/outscraper-import";
import { enrichImportedSalonWithImages } from "@/lib/instagram-image-provider";
import {
  getSalonRepositoryStatus,
  listSalons,
  subscribeToSalonRepository,
  upsertSalon,
} from "@/lib/salon-repository";
import { landingLanguageLabels } from "@/lib/salon-storage";
import { normalizeSalonLayoutImagePlan } from "@/lib/salon-image-plan";
import type { Salon, SalonLanguage } from "@/types/salon";

const supportedExtensions = [".csv", ".xlsx", ".xls"];

export function SalonsImportClient() {
  const repositoryStatus = getSalonRepositoryStatus();
  const [existingSalons, setExistingSalons] = useState<Salon[]>([]);
  const [isLoadingSalons, setIsLoadingSalons] = useState(true);
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<OutscraperRawRow[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<OutscraperDetectedColumn[]>([]);
  const [manualSelectedIds, setManualSelectedIds] = useState<string[] | null>(null);
  const [defaultLanguage, setDefaultLanguage] = useState<SalonLanguage>("en");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [enrichInstagramImages, setEnrichInstagramImages] = useState(true);
  const [applyAiCurationOnImport, setApplyAiCurationOnImport] = useState(
    process.env.NEXT_PUBLIC_AI_CURATE_ON_IMPORT === "true" ||
    process.env.AI_CURATE_ON_IMPORT === "true",
  );
  const [report, setReport] = useState<OutscraperImportReport | null>(null);

  const refreshExistingSalons = useCallback(async () => {
    setIsLoadingSalons(true);
    const result = await listSalons();
    setExistingSalons(result.salons);
    setIsLoadingSalons(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadExistingSalons() {
      setIsLoadingSalons(true);
      const result = await listSalons();

      if (!active) {
        return;
      }

      setExistingSalons(result.salons);
      setIsLoadingSalons(false);
    }

    void loadExistingSalons();
    const unsubscribe = subscribeToSalonRepository(() => {
      void loadExistingSalons();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const previewData = useMemo(() => {
    if (!rawRows.length) {
      return {
        previewRows: [] as OutscraperImportPreviewRow[],
        stats: null as OutscraperImportStats | null,
      };
    }

    const nextPreview = buildOutscraperPreview(rawRows, existingSalons);

    return {
      previewRows: nextPreview.previewRows,
      stats: nextPreview.stats,
    };
  }, [existingSalons, rawRows]);

  const previewRows = previewData.previewRows;
  const stats = previewData.stats;
  const selectedIds =
    manualSelectedIds ??
    previewRows.filter((row) => row.defaultSelected).map((row) => row.id);

  const selectedRows = useMemo(
    () => previewRows.filter((row) => selectedIds.includes(row.id)),
    [previewRows, selectedIds],
  );

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    setIsParsing(true);
    setMessage("");
    setErrors([]);
    setReport(null);
    setManualSelectedIds(null);
    setImportProgress("");

    try {
      const extension = getFileExtension(file.name);

      if (!supportedExtensions.includes(extension)) {
        setErrors(["Formato nao suportado. Envie um arquivo .csv, .xlsx ou .xls."]);
        return;
      }

      const parsed = await parseSpreadsheetFile(file);
      setFileName(file.name);
      setDetectedColumns(detectOutscraperColumns(parsed.headers));
      setRawRows(parsed.rows);
      setMessage(
        `${parsed.rows.length} linha(s) lida(s). Revise a previa antes de importar.`,
      );
    } catch (error) {
      setErrors([
        error instanceof Error
          ? error.message
          : "Nao foi possivel ler a planilha enviada.",
      ]);
    } finally {
      setIsParsing(false);
    }
  }

  function toggleRow(id: string) {
    setManualSelectedIds((current) => {
      const baseSelection =
        current ?? previewRows.filter((row) => row.defaultSelected).map((row) => row.id);

      return baseSelection.includes(id)
        ? baseSelection.filter((item) => item !== id)
        : [...baseSelection, id];
    });
  }

  function selectImportableRows() {
    setManualSelectedIds(previewRows.filter((row) => row.importable).map((row) => row.id));
  }

  function clearSelection() {
    setManualSelectedIds([]);
  }

  async function handleImportSelected() {
    const rowsToImport = [...selectedRows];

    if (!rowsToImport.length) {
      setMessage("Selecione pelo menos uma linha antes de importar.");
      return;
    }

    setIsImporting(true);
    setMessage("");
    setErrors([]);
    setReport(null);

    logImportDebug("import-start", {
      rawRows: rawRows.length,
      selectedRows: rowsToImport.length,
      defaultLanguage,
      repository: repositoryStatus.activeSource,
    });

    try {
      const takenSlugs = new Set(existingSalons.map((salon) => salon.slug));
      const duplicateKeys = {
        instagram: new Set(
          existingSalons
            .map((salon) => normalizeExternalUrl(salon.instagramUrl))
            .filter(Boolean),
        ),
        location: new Set(
          existingSalons
            .map((salon) => normalizeExternalUrl(salon.googleMapsUrl))
            .filter(Boolean),
        ),
        nameCity: new Set(
          existingSalons
            .map((salon) => buildNameCityKey(salon.name, salon.city || salon.location))
            .filter(Boolean),
        ),
      };

      let skippedDuplicates = 0;
      let skippedInvalid = 0;
      const createdRows: OutscraperImportPreviewRow[] = [];
      const createdSlugs: string[] = [];
      const importErrors: string[] = [];
      const instagramImageItems: OutscraperInstagramImageImportItem[] = [];

      for (const [index, row] of rowsToImport.entries()) {
        try {
          if (!row.valid) {
            skippedInvalid += 1;
            continue;
          }

          const instagramKey = normalizeExternalUrl(row.mapped.instagramUrl);
          const locationKey = normalizeExternalUrl(row.mapped.googleMapsUrl);
          const nameCityKey = buildNameCityKey(
            row.mapped.name,
            row.mapped.city || row.mapped.location,
          );

          const isDuplicate =
            row.duplicateReasons.length > 0 ||
            (instagramKey && duplicateKeys.instagram.has(instagramKey)) ||
            (locationKey && duplicateKeys.location.has(locationKey)) ||
            (nameCityKey && duplicateKeys.nameCity.has(nameCityKey));

          if (isDuplicate) {
            skippedDuplicates += 1;
            continue;
          }

          const slug = makeUniqueSlug(row.mapped.name, takenSlugs);
          let salon = buildSalonForOutscraperImport(
            row.mapped,
            slug,
            defaultLanguage,
            "draft",
          );
          let instagramImageItem: OutscraperInstagramImageImportItem | null = null;

          if (index === 0) {
            logImportDebug("import-sample-salon", {
              rowNumber: row.rowNumber,
              name: salon.name,
              slug: salon.slug,
              status: salon.status,
              instagramUrl: salon.instagramUrl,
              googleMapsUrl: salon.googleMapsUrl,
            });
          }

          if (enrichInstagramImages && row.mapped.instagramUrl) {
            setImportProgress(
              `Buscando imagens do Instagram (${index + 1}/${rowsToImport.length}): ${row.mapped.name}`,
            );

            const enrichment = await enrichImportedSalonWithImages(salon);
            salon = enrichment.salon;
            instagramImageItem = {
              name: salon.name,
              slug: salon.slug,
              instagramUrl: enrichment.instagramUrl,
              status: enrichment.ok ? "success" : "failed",
              candidatesFound: enrichment.candidatesFound,
              imagesSaved: enrichment.imagesSaved,
              heroSelected: enrichment.heroSelected,
              galleryCount: enrichment.galleryCount,
              experienceCount: enrichment.experienceCount,
              resultCount: enrichment.resultCount,
              error: enrichment.error,
              errorType: enrichment.errorType,
            };

            logImportDebug("instagram-enrichment", {
              name: salon.name,
              slug: salon.slug,
              ok: enrichment.ok,
              candidatesFound: enrichment.candidatesFound,
              imagesSaved: enrichment.imagesSaved,
              error: enrichment.error,
              debug: enrichment.debug,
            });
          } else if (enrichInstagramImages && !row.mapped.instagramUrl) {
            instagramImageItem = {
              name: salon.name,
              slug: salon.slug,
              instagramUrl: "",
              status: "skipped",
              candidatesFound: 0,
              imagesSaved: 0,
              heroSelected: false,
              galleryCount: 0,
              experienceCount: 0,
              resultCount: 0,
              error: "Salao sem Instagram informado.",
              errorType: "missing_url",
            };
          }

          if (applyAiCurationOnImport && salon.galleryImages?.length) {
            setImportProgress(`Curando imagens com IA (${index + 1}/${rowsToImport.length}): ${salon.name}`);

            try {
              const curated = await fetch("/api/ai/curate-images", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  salonId: salon.id,
                  salonName: salon.name,
                  businessType: salon.extractedBusinessInfo?.observedServices || "salão de beleza",
                  language: salon.language,
                  services: salon.services?.map((service) => service.title) ?? [],
                  images: (salon.galleryImages ?? [])
                    .filter((image) => image.isReal && image.url?.trim())
                    .slice(0, 20)
                    .map((image) => ({
                      id: image.id,
                      url: image.src || image.url,
                      source: image.source,
                      caption: image.alt || image.title,
                      currentType: image.type,
                    })),
                }),
              });
              const curatedPayload = (await curated.json()) as {
                success?: boolean;
                error?: string;
                data?: {
                  logoImageId?: string | null;
                  heroImageIds?: string[];
                  spaceImageIds?: string[];
                  galleryImageIds?: string[];
                  ignoredImageIds?: string[];
                };
              };

              if (curated.ok && curatedPayload.success && curatedPayload.data) {
                const plan = normalizeSalonLayoutImagePlan({
                  mode: "chatgpt_manual",
                  logoImageId: curatedPayload.data.logoImageId ?? null,
                  topImageIds: curatedPayload.data.heroImageIds ?? [],
                  heroImageId: (curatedPayload.data.heroImageIds?.length ?? 0) === 1 ? curatedPayload.data.heroImageIds?.[0] ?? null : null,
                  heroMosaicImageIds: (curatedPayload.data.heroImageIds?.length ?? 0) > 1 ? curatedPayload.data.heroImageIds ?? [] : [],
                  galleryImageIds: curatedPayload.data.galleryImageIds ?? [],
                  spaceEnabled: Boolean(curatedPayload.data.spaceImageIds?.length),
                  spaceImageIds: curatedPayload.data.spaceImageIds ?? [],
                  experienceImageIds: curatedPayload.data.spaceImageIds ?? [],
                  resultImageIds: [],
                  ignoredImageIds: curatedPayload.data.ignoredImageIds ?? [],
                  warnings: [],
                  generatedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                salon = {
                  ...salon,
                  layoutImagePlan: plan,
                  imageSelectionSummary: {
                    logoId: plan?.logoImageId ?? undefined,
                    heroId: plan?.topImageIds?.[0] ?? undefined,
                    interiorIds: plan?.spaceImageIds ?? [],
                    resultIds: [],
                    galleryIds: plan?.galleryImageIds ?? [],
                    ignoredIds: plan?.ignoredImageIds ?? [],
                    selectedAt: new Date().toISOString(),
                    appliedAt: new Date().toISOString(),
                  },
                };
                logImportDebug("ai-curation-applied", {
                  name: salon.name,
                  slug: salon.slug,
                });
              } else {
                logImportDebug("ai-curation-failed", {
                  name: salon.name,
                  slug: salon.slug,
                  error: curatedPayload.error,
                });
              }
            } catch (error) {
              logImportDebug("ai-curation-exception", {
                name: salon.name,
                slug: salon.slug,
                error: error instanceof Error ? error.message : "Erro inesperado",
              });
            }
          }

          const result = await upsertSalon(salon);

          if (!result.ok) {
            importErrors.push(
              `${row.mapped.name || `Linha ${row.rowNumber}`}: ${result.error}`,
            );
            logImportDebug("import-row-failed", {
              rowNumber: row.rowNumber,
              name: row.mapped.name,
              error: result.error,
            });
            continue;
          }

          createdRows.push(row);
          createdSlugs.push(result.salon.slug);
          if (instagramImageItem) {
            instagramImageItems.push({
              ...instagramImageItem,
              slug: result.salon.slug,
            });
          }

          if (instagramKey) {
            duplicateKeys.instagram.add(instagramKey);
          }

          if (locationKey) {
            duplicateKeys.location.add(locationKey);
          }

          if (nameCityKey) {
            duplicateKeys.nameCity.add(nameCityKey);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Erro inesperado ao importar esta linha.";
          importErrors.push(
            `${row.mapped.name || `Linha ${row.rowNumber}`}: ${errorMessage}`,
          );
          logImportDebug("import-row-exception", {
            rowNumber: row.rowNumber,
            name: row.mapped.name,
            error: errorMessage,
          });
        }
      }

      setReport(
        buildImportReport(
          rowsToImport,
          createdRows,
          createdSlugs,
          skippedDuplicates,
          skippedInvalid,
          buildInstagramImageImportReport(
            enrichInstagramImages,
            createdRows,
            instagramImageItems,
          ),
        ),
      );
      setErrors(importErrors);

      if (createdRows.length > 0) {
        setMessage(
          `Importacao concluida. ${createdRows.length} salao(oes) criado(s), ${skippedDuplicates} duplicado(s) pulado(s) e ${skippedInvalid} linha(s) invalida(s).`,
        );
      } else if (importErrors.length > 0) {
        setMessage(
          "Nenhum salao foi criado. Revise os erros abaixo e tente novamente.",
        );
      } else {
        setMessage(
          "Nenhum salao novo foi criado. Revise a selecao e os duplicados sinalizados.",
        );
      }

      logImportDebug("import-finished", {
        selectedRows: rowsToImport.length,
        createdRows: createdRows.length,
        skippedDuplicates,
        skippedInvalid,
        importErrors: importErrors.length,
        createdSlugs,
      });

      await refreshExistingSalons();
      setImportProgress("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Nao foi possivel concluir a importacao.";
      setErrors([errorMessage]);
      setMessage("A importacao falhou antes de concluir. Revise o erro abaixo.");
      logImportDebug("import-fatal-error", { error: errorMessage });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf8]">
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5 sm:px-8 lg:px-10">
          <Link
            href="/salons"
            className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition hover:text-zinc-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o painel
          </Link>
          <Link href="/salons/new" className="btn btn-secondary min-h-10 px-4 py-2">
            Novo salao manual
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 shadow-sm">
              <FileSpreadsheet className="h-4 w-4 text-rose-400" />
              Importacao de planilhas
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
              Importar CSV, XLSX ou XLS
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-600 sm:text-base">
              Envie uma planilha do Outscraper, revise colunas, duplicados e
              linhas validas, depois importe somente os saloes selecionados
              como rascunho.
            </p>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-950/5">
            <div className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              <Metric label="Armazenamento" value={repositoryStatus.label} />
              <Metric
                label="Saloes atuais"
                value={isLoadingSalons ? "..." : String(existingSalons.length)}
              />
              <Metric
                label="Idioma padrao"
                value={landingLanguageLabels[defaultLanguage] ?? defaultLanguage}
              />
            </div>
          </div>
        </div>

        <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.42fr]">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Arquivo da planilha</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Aceita .csv, .xlsx e .xls. O parser le o arquivo inteiro sem usar
                split manual e respeita colunas com aspas, virgulas internas e campos vazios.
              </p>

              <label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/50">
                <Upload className="h-7 w-7 text-teal-700" />
                <span className="mt-3 text-base font-semibold text-zinc-900">
                  {fileName || "Selecionar planilha do Outscraper"}
                </span>
                <span className="mt-2 text-sm leading-6 text-zinc-500">
                  Formatos aceitos: CSV, XLSX e XLS
                </span>
                <input
                  data-testid="outscraper-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="sr-only"
                  onChange={(event) => void handleFileChange(event.currentTarget.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-950">
                Configuracao da importacao
              </p>
              <label className="mt-4 grid gap-2">
                <span className="text-sm font-semibold text-zinc-800">
                  Idioma padrao das landings importadas
                </span>
                <select
                  value={defaultLanguage}
                  onChange={(event) =>
                    setDefaultLanguage(event.currentTarget.value as SalonLanguage)
                  }
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-teal-700"
                >
                  {Object.entries(landingLanguageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Todos os saloes entram como rascunho. Duplicados sao sinalizados
                na previa e pulados por padrao.
              </p>
              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={enrichInstagramImages}
                  onChange={(event) => setEnrichInstagramImages(event.currentTarget.checked)}
                  className="mt-1 h-4 w-4 accent-teal-700"
                />
                <span>
                  <span className="block font-semibold text-zinc-950">
                    Buscar imagens do Instagram no lote
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    Usa o navegador local logado para tentar coletar varias imagens por salao.
                    Se o Instagram bloquear, o relatorio mostra o motivo por salao.
                  </span>
                </span>
              </label>
              <label className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={applyAiCurationOnImport}
                  onChange={(event) => setApplyAiCurationOnImport(event.currentTarget.checked)}
                  className="mt-1 h-4 w-4 accent-teal-700"
                />
                <span>
                  <span className="block font-semibold text-zinc-950">
                    Aplicar curadoria automática com IA após coletar fotos
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    Usa o Gemini 2.5 Flash no servidor para organizar logo, destaque, nosso espaço, galeria e ignoradas. Se falhar, o salão salva normalmente com as imagens no banco de fotos.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {isParsing ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Lendo a planilha...
            </p>
          ) : null}

          {message ? (
            <p className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950">
              {message}
            </p>
          ) : null}

          {importProgress ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {importProgress}
            </p>
          ) : null}

          {errors.length ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
              <p className="font-semibold">Erros encontrados</p>
              <ul className="mt-2 grid gap-1 text-sm leading-6">
                {errors.map((error) => (
                  <li key={error}>- {error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {detectedColumns.length ? (
          <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Colunas detectadas</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  O sistema identifica automaticamente colunas reconhecidas do Outscraper.
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                {detectedColumns.filter((column) => column.recognized).length} reconhecidas
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {detectedColumns.map((column) => (
                <span
                  key={`${column.header}-${column.normalizedHeader}`}
                  className={`rounded-full px-3 py-2 text-xs font-semibold ${
                    column.recognized
                      ? "bg-teal-50 text-teal-900 ring-1 ring-teal-100"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {column.header}
                  {column.field ? ` -> ${column.field}` : ""}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {stats ? (
          <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric label="Linhas lidas" value={String(stats.totalRows)} />
              <Metric label="Validas" value={String(stats.validRows)} />
              <Metric label="Invalidas" value={String(stats.invalidRows)} />
              <Metric label="Sem Instagram" value={String(stats.withoutInstagram)} />
              <Metric label="Duplicados" value={String(stats.duplicateRows)} />
              <Metric label="Importaveis" value={String(stats.importableRows)} />
              <Metric label="Com photo" value={String(stats.withPhoto)} />
              <Metric label="Com logo" value={String(stats.withLogo)} />
              <Metric label="Com booking" value={String(stats.withBookingUrl)} />
              <Metric label="Com horario" value={String(stats.withOpeningHours)} />
              <Metric label="Com servicos" value={String(stats.withMainServices)} />
              <Metric label="Com reviews" value={String(stats.withReviews)} />
            </div>
          </section>
        ) : null}

        {previewRows.length ? (
          <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Previa antes de importar</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Revise duplicados, valide os dados e escolha exatamente quais linhas devem entrar no sistema.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectImportableRows}
                  className="btn btn-secondary min-h-10 px-4 py-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Selecionar importaveis
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="btn btn-secondary min-h-10 px-4 py-2"
                >
                  <XCircle className="h-4 w-4" />
                  Limpar selecao
                </button>
                <button
                  data-testid="import-selected-button"
                  type="button"
                  onClick={() => void handleImportSelected()}
                  disabled={isImporting || selectedRows.length === 0}
                  className="btn btn-primary min-h-10 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isImporting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {`Importar ${selectedRows.length} selecionado(s)`}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">
                {selectedRows.length} selecionada(s)
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">
                {previewRows.length} linha(s) na previa
              </span>
            </div>

            <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                    <th className="px-4 py-3">Selecionar</th>
                    <th className="px-4 py-3">Linha</th>
                    <th className="px-4 py-3">Salao</th>
                    <th className="px-4 py-3">Cidade</th>
                    <th className="px-4 py-3">Instagram</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Slug previsto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {previewRows.map((row) => (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="h-4 w-4 accent-teal-700"
                        />
                      </td>
                      <td className="px-4 py-4 text-zinc-500">{row.rowNumber}</td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-zinc-950">{row.mapped.name || "Sem nome"}</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          {row.mapped.address || row.mapped.location || "Sem localizacao principal"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {row.mapped.city || row.mapped.location || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {row.hasInstagram ? (
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
                            Disponivel
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
                            Sem Instagram
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid gap-2">
                          {row.valid ? (
                            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100">
                              Valida
                            </span>
                          ) : (
                            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-900 ring-1 ring-rose-100">
                              Invalida
                            </span>
                          )}

                          {row.duplicateReasons.length ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
                              Duplicado
                            </span>
                          ) : null}

                          {row.hasPhoto ? (
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              Photo
                            </span>
                          ) : null}
                          {row.hasLogo ? (
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              Logo
                            </span>
                          ) : null}
                          {row.hasReviews ? (
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                              Reviews
                            </span>
                          ) : null}
                        </div>

                        {row.invalidReasons.length ? (
                          <ul className="mt-2 grid gap-1 text-xs leading-5 text-rose-700">
                            {row.invalidReasons.map((reason) => (
                              <li key={reason}>- {reason}</li>
                            ))}
                          </ul>
                        ) : null}

                        {row.duplicateReasons.length ? (
                          <ul className="mt-2 grid gap-1 text-xs leading-5 text-amber-700">
                            {row.duplicateReasons.map((reason) => (
                              <li key={reason}>- {reason}</li>
                            ))}
                          </ul>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-zinc-500">{row.predictedSlug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {report ? (
          <section className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-950/5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-950">Relatorio da importacao</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Resultado do ultimo lote importado.
                </p>
              </div>
              <Link href="/salons" className="btn btn-secondary min-h-10 px-4 py-2">
                <Globe2 className="h-4 w-4" />
                Ver saloes no painel
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <Metric label="Criados" value={String(report.created)} />
              <Metric label="Duplicados pulados" value={String(report.skippedDuplicates)} />
              <Metric label="Invalidos pulados" value={String(report.skippedInvalid)} />
              <Metric label="Com Instagram" value={String(report.withInstagram)} />
              <Metric label="Sem Instagram" value={String(report.withoutInstagram)} />
              <Metric label="Com photo" value={String(report.withPhoto)} />
              <Metric label="Com logo" value={String(report.withLogo)} />
              <Metric label="Com booking" value={String(report.withBookingUrl)} />
              <Metric label="Com horario" value={String(report.withOpeningHours)} />
              <Metric label="Com servicos" value={String(report.withMainServices)} />
              <Metric label="Com reviews" value={String(report.withReviews)} />
              <Metric label="Slugs" value={String(report.createdSlugs.length)} />
              {report.instagramImages ? (
                <>
                  <Metric
                    label="IG tentados"
                    value={String(report.instagramImages.attempted)}
                  />
                  <Metric
                    label="IG com imagens"
                    value={String(report.instagramImages.withImages)}
                  />
                  <Metric
                    label="Imagens salvas"
                    value={String(report.instagramImages.totalImagesSaved)}
                  />
                  <Metric
                    label="Media imagens"
                    value={report.instagramImages.averageImagesPerSalon.toFixed(1)}
                  />
                </>
              ) : null}
            </div>

            {report.createdSlugs.length ? (
              <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-950">Slugs criados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {report.createdSlugs.map((slug) => (
                    <span
                      key={slug}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200"
                    >
                      {slug}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {report.instagramImages ? (
              <InstagramImageImportReport report={report.instagramImages} />
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function InstagramImageImportReport({
  report,
}: {
  report: OutscraperInstagramImageImportReport;
}) {
  const failedItems = report.items.filter((item) => item.status === "failed");
  const successItems = report.items.filter((item) => item.status === "success");

  return (
    <div className="mt-5 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            Enriquecimento de imagens do Instagram
          </p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {report.enabled
              ? "Resultado da busca em lote via navegador local. Falhas nao interrompem a importacao."
              : "Busca de imagens do Instagram desativada neste lote."}
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
          {report.withImages}/{report.salonsWithInstagram} com imagens
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Com Instagram" value={String(report.salonsWithInstagram)} />
        <Metric label="Tentados" value={String(report.attempted)} />
        <Metric label="Falhas" value={String(report.failed)} />
        <Metric label="Candidatas" value={String(report.totalCandidatesFound)} />
        <Metric label="Salvas" value={String(report.totalImagesSaved)} />
      </div>

      {successItems.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Saloes com imagens aplicadas
          </p>
          <div className="mt-2 grid gap-2">
            {successItems.slice(0, 8).map((item) => (
              <div
                key={`${item.slug}-success`}
                className="rounded-2xl border border-teal-100 bg-white px-4 py-3 text-sm text-zinc-700"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-semibold text-zinc-950">{item.name}</p>
                  <span className="text-xs font-semibold text-teal-800">
                    {item.imagesSaved} imagem(ns) salva(s)
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {item.candidatesFound} candidata(s), hero{" "}
                  {item.heroSelected ? "selecionado" : "nao selecionado"}, galeria{" "}
                  {item.galleryCount}, experiencia {item.experienceCount}, resultados{" "}
                  {item.resultCount}.
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {failedItems.length ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
            Falhas na busca
          </p>
          <div className="mt-2 grid gap-2">
            {failedItems.map((item) => (
              <div
                key={`${item.slug}-failed`}
                className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm text-zinc-700"
              >
                <p className="font-semibold text-zinc-950">{item.name}</p>
                <p className="mt-1 text-xs leading-5 text-rose-700">
                  {item.error || "Nao foi possivel buscar imagens deste Instagram."}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
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

async function parseSpreadsheetFile(file: File) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", raw: false });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("A planilha nao possui abas validas.");
  }

  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!matrix.length) {
    throw new Error("A planilha enviada esta vazia.");
  }

  const [headerRow, ...valueRows] = matrix;
  const rawHeaders = headerRow.map((value) => String(value ?? "").trim());
  const headers = rawHeaders.filter(Boolean);

  if (!headers.length) {
    throw new Error("Nao foi possivel detectar as colunas da planilha.");
  }

  const rows = valueRows
    .map((values) => {
      const entry: OutscraperRawRow = {};

      rawHeaders.forEach((header, index) => {
        if (!header) {
          return;
        }

        entry[header] = String(values[index] ?? "").trim();
      });

      return entry;
    })
    .filter((row) =>
      Object.values(row).some((value) => String(value ?? "").trim().length > 0),
    );

  return { headers, rows };
}

function getFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function normalizeExternalUrl(value?: string) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/\/+$/, "");
  }
}

function buildNameCityKey(name?: string, cityOrLocation?: string) {
  const left = normalizeText(name);
  const right = normalizeText(cityOrLocation);

  if (!left || !right) {
    return "";
  }

  return `${left}::${right}`;
}

function normalizeText(value?: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function buildInstagramImageImportReport(
  enabled: boolean,
  createdRows: OutscraperImportPreviewRow[],
  items: OutscraperInstagramImageImportItem[],
): OutscraperInstagramImageImportReport {
  const attemptedItems = items.filter((item) => item.status !== "skipped");
  const successItems = items.filter((item) => item.status === "success");
  const failedItems = items.filter((item) => item.status === "failed");
  const totalImagesSaved = successItems.reduce(
    (total, item) => total + item.imagesSaved,
    0,
  );

  return {
    enabled,
    salonsWithInstagram: createdRows.filter((row) => row.hasInstagram).length,
    attempted: attemptedItems.length,
    withImages: successItems.filter((item) => item.imagesSaved > 0).length,
    failed: failedItems.length,
    totalCandidatesFound: attemptedItems.reduce(
      (total, item) => total + item.candidatesFound,
      0,
    ),
    totalImagesSaved,
    averageImagesPerSalon: successItems.length
      ? totalImagesSaved / successItems.length
      : 0,
    items,
  };
}

function logImportDebug(stage: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.log("[outscraper-import]", stage, payload);
}
