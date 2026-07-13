import {
  createSalonDefaults,
  deleteSalon as deleteLocalSalon,
  duplicateSalon as duplicateLocalSalon,
  generateUniqueSlug as generateLocalUniqueSlug,
  getSalonBySlug as getLocalSalonBySlug,
  getSalonIndex,
  getSalonStorageChangedEvent,
  listSalons as listLocalSalons,
  mergeSalonUpdates,
  normalizeSlug,
  salonFormInputToPartialSalon,
  saveSalon as saveLocalSalon,
} from "@/lib/salon-storage";
import { estimatePayloadSize, logPerfEvent } from "@/lib/perf-logs";
import { filterValidLandingImages, getValidImageUrl } from "@/lib/salon-images";
import {
  getSupabaseClient,
  isSupabaseConfigured,
  isSupabaseWriteEnabled,
} from "@/lib/supabase/client";
import {
  isProductionEnvironment,
  isServerLocalStorageEnabled,
} from "@/lib/storage-mode";
import {
  mapSalonToSupabaseRow,
  mapSupabaseRowToSalon,
  type SupabaseSalonRow,
} from "@/lib/supabase/salon-mapper";
import type { Salon, SalonFormInput } from "@/types/salon";

const REPOSITORY_CHANGED_EVENT = "salon-lg:repository:changed";

export type SalonRepositorySource = "local" | "server-local" | "supabase";

export type SalonRepositoryStatus = {
  activeSource: SalonRepositorySource;
  label: "Local" | "Servidor local" | "Supabase";
  supabaseConfigured: boolean;
  supabaseWriteEnabled: boolean;
  message: string;
};

export type SalonRepositoryResult =
  | {
      ok: true;
      salon: Salon;
      source: SalonRepositorySource;
      warning?: string;
    }
  | {
      ok: false;
      error: string;
      source?: SalonRepositorySource;
    };

export type SalonRepositoryListResult =
  | {
      ok: true;
      salons: Salon[];
      source: SalonRepositorySource;
      warning?: string;
    }
  | {
      ok: false;
      error: string;
      salons: Salon[];
      source: SalonRepositorySource;
    };

export type SalonMigrationScope =
  | "profile"
  | "contacts"
  | "services"
  | "copy"
  | "images"
  | "reviews"
  | "publication"
  | "commercial";

export type SalonMigrationItem = {
  id: string;
  slug: string;
  name: string;
  action: "create" | "update" | "skip";
  status:
    | "ready"
    | "blocked-newer-production"
    | "no-changes"
    | "migrated"
    | "failed";
  changedFields: string[];
  localUpdatedAt: string;
  productionUpdatedAt?: string;
  reason?: string;
};

export type SalonMigrationOptions = {
  selectedSlugs: string[];
  dryRun?: boolean;
  force?: boolean;
  scopes?: SalonMigrationScope[];
  expectedProductionVersions?: Record<string, string | null>;
};

export const DEFAULT_SALON_MIGRATION_SCOPES: SalonMigrationScope[] = [
  "profile",
  "contacts",
  "services",
  "copy",
];

const SALON_MIGRATION_SCOPE_FIELDS: Record<
  SalonMigrationScope,
  Array<keyof Salon>
> = {
  profile: [
    "name",
    "location",
    "city",
    "country",
    "language",
    "landingLanguage",
    "positioningLine",
    "description",
    "heroOverlayTitle",
    "heroOverlaySubtitle",
    "visualStyle",
    "brandTone",
    "businessHours",
    "address",
    "extractedBusinessInfo",
    "notes",
  ],
  contacts: [
    "instagramUrl",
    "instagramProfileUrl",
    "googleMapsUrl",
    "googleBusinessUrl",
    "websiteUrl",
    "bookingUrl",
    "whatsapp",
    "phone",
    "socialLinks",
  ],
  services: [
    "services",
    "selectedServices",
    "serviceCategories",
    "featuredServices",
    "suggestedServices",
  ],
  copy: [
    "headline",
    "subheadline",
    "aboutText",
    "ctaPrimary",
    "ctaSecondary",
    "ctaTitle",
    "ctaText",
    "suggestedCopy",
    "copySuggestions",
    "generatedCopy",
    "copyHistory",
    "lastGeneratedAt",
    "lastAppliedAt",
    "generatedCopyStatus",
    "aiBrief",
    "promptMetadata",
    "manualAssistantNotes",
  ],
  images: [
    "galleryImages",
    "gallery",
    "realImages",
    "imageCandidates",
    "imageSelectionSummary",
    "layoutImagePlan",
    "heroImage",
    "images",
    "hasRealImages",
    "imagesSourceStatus",
    "suggestedImages",
    "importedInstagramImages",
    "instagramImportStatus",
    "sourceMaterials",
    "sourceProfile",
    "lastImportAt",
    "importErrors",
  ],
  reviews: [
    "testimonials",
    "realReviews",
    "googleRating",
    "googleReviewCount",
    "hasRealReviews",
    "reviewsSourceStatus",
    "googleReviewsImportStatus",
  ],
  publication: ["status"],
  commercial: ["commercialStatus"],
};

export type SalonMigrationResult =
  | {
      ok: true;
      source: "local" | "server-local";
      dryRun: boolean;
      force: boolean;
      scopes: SalonMigrationScope[];
      selectedSlugs: string[];
      total: number;
      plannedCreates: number;
      plannedUpdates: number;
      created: number;
      updated: number;
      confirmed: number;
      skipped: number;
      failed: number;
      errors: string[];
      migratedSlugs: string[];
      items: SalonMigrationItem[];
    }
  | {
      ok: false;
      error: string;
    };

export function getSalonRepositoryChangedEvent() {
  return REPOSITORY_CHANGED_EVENT;
}

export function getSalonRepositoryStatus(): SalonRepositoryStatus {
  const supabaseConfigured = isSupabaseConfigured();
  const supabaseWriteEnabled = isSupabaseWriteEnabled();
  const serverLocalEnabled = isServerLocalStorageEnabled();

  if (serverLocalEnabled) {
    return {
      activeSource: "server-local",
      label: "Servidor local",
      supabaseConfigured,
      supabaseWriteEnabled,
      message:
        "Modo compartilhado de desenvolvimento ativo. Os salões ficam salvos em arquivo no servidor local para aparecerem também no celular e em outros navegadores da mesma rede.",
    };
  }

  if (isProductionEnvironment()) {
    return {
      activeSource: "supabase",
      label: "Supabase",
      supabaseConfigured,
      supabaseWriteEnabled,
      message: !supabaseConfigured
        ? "Producao exige Supabase configurado. O painel interno nao deve usar localStorage nem server-local."
        : !supabaseWriteEnabled
          ? "Supabase configurado para leitura publica. Para criar, editar e importar em producao, habilite NEXT_PUBLIC_SUPABASE_WRITE_MODE=enabled e a API administrativa server-side."
          : "Supabase ativo para producao. O painel interno usa a API administrativa protegida por senha.",
    };
  }

  if (!supabaseConfigured) {
    return {
      activeSource: "local",
      label: "Local",
      supabaseConfigured,
      supabaseWriteEnabled,
      message:
        "Supabase não configurado. O sistema continuará usando localStorage.",
    };
  }

  if (!supabaseWriteEnabled) {
    return {
      activeSource: "local",
      label: "Local",
      supabaseConfigured,
      supabaseWriteEnabled,
      message:
        "Supabase configurado para leitura. Escritas internas continuam no localStorage até habilitar modo de escrita seguro.",
    };
  }

  return {
    activeSource: "supabase",
    label: "Supabase",
    supabaseConfigured,
    supabaseWriteEnabled,
    message:
      "Supabase configurado. Escritas estão habilitadas para o MVP; confirme as políticas RLS antes de usar fora do ambiente controlado.",
    };
}

export function getSalonRepositorySourceLabel(source: SalonRepositorySource) {
  if (source === "supabase") {
    return "Supabase";
  }

  if (source === "server-local") {
    return "Servidor local";
  }

  return "Local";
}

function debugRepository(event: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.debug("[salon-repository]", event, {
    storageMode: process.env.NEXT_PUBLIC_STORAGE_MODE ?? "default",
    activeSource: getSalonRepositoryStatus().activeSource,
    ...payload,
  });
}

export async function listSalons(): Promise<SalonRepositoryListResult> {
  const status = getSalonRepositoryStatus();
  debugRepository("list-start", { requestedSource: status.activeSource });

  if (shouldUseAdminApi()) {
    return fetchAdminSalonList();
  }

  if (status.activeSource === "server-local") {
    let serverLocalResult = await listServerLocalSalons();

    if (serverLocalResult.ok && serverLocalResult.salons.length === 0) {
      await maybeSeedServerLocalFromLocalStorage(serverLocalResult);
      serverLocalResult = await listServerLocalSalons();
    }

    if (serverLocalResult.ok) {
      debugRepository("list-success", {
        source: "server-local",
        count: serverLocalResult.salons.length,
      });
      return serverLocalResult;
    }

    debugRepository("list-fallback-local", {
      source: "server-local",
      error: serverLocalResult.error,
    });
    return {
      ok: true,
      salons: listLocalSalons(),
      source: "local",
      warning: serverLocalResult.error,
    };
  }

  if (status.activeSource !== "supabase") {
    return {
      ok: true,
      salons: listLocalSalons(),
      source: "local",
    };
  }

  const supabaseResult = await tryListSupabaseSalons();

  if (supabaseResult.ok) {
    return supabaseResult;
  }

  if (isProductionEnvironment()) {
    return supabaseResult;
  }

  return {
    ok: true,
    salons: listLocalSalons(),
    source: "local",
    warning: supabaseResult.error,
  };
}

/**
 * Loads the Supabase dataset for the local dashboard without changing the
 * active repository. This is useful in server-local development, where a
 * published salon may have been written to Supabase but is not present in the
 * shared local file yet.
 */
export async function listSupabaseSalonsForDashboard() {
  if (typeof window !== "undefined") {
    const adminResult = await fetchAdminSalonList();

    if (adminResult.ok) {
      return adminResult;
    }
  }

  return tryListSupabaseSalons();
}

export async function getSalonBySlug(
  slug: string,
): Promise<SalonRepositoryResult> {
  debugRepository("get-start", { slug });
  if (shouldUseAdminApi()) {
    return fetchAdminSalonBySlug(slug);
  }

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    await maybeSeedServerLocalFromLocalStorage();
    const serverLocalResult = await getServerLocalSalonBySlug(slug);

    if (serverLocalResult.ok && serverLocalResult.salon) {
      debugRepository("get-success", { slug, source: "server-local" });
      return {
        ok: true,
        salon: serverLocalResult.salon,
        source: "server-local",
      };
    }

    const localSalon = getLocalSalonBySlug(slug);

    if (localSalon) {
      return {
        ok: true,
        salon: localSalon,
        source: "local",
        warning: serverLocalResult.ok ? undefined : serverLocalResult.error,
      };
    }

    return {
      ok: false,
      error:
        serverLocalResult.ok || !serverLocalResult.error
          ? "Salão não encontrado."
          : serverLocalResult.error,
      source: "server-local",
    };
  }

  const supabaseResult = await tryGetSupabaseSalonBySlug(slug);

  if (supabaseResult.ok && supabaseResult.salon) {
    return {
      ok: true,
      salon: supabaseResult.salon,
      source: "supabase",
    };
  }

  if (isProductionEnvironment()) {
    return {
      ok: false,
      error:
        supabaseResult.ok || !supabaseResult.error
          ? "Salao nao encontrado."
          : supabaseResult.error,
      source: "supabase",
    };
  }

  const localSalon = getLocalSalonBySlug(slug);

  if (localSalon) {
    return {
      ok: true,
      salon: localSalon,
      source: "local",
      warning: supabaseResult.ok ? undefined : supabaseResult.error,
    };
  }

  return {
    ok: false,
    error:
      supabaseResult.ok || !supabaseResult.error
        ? "Salão não encontrado."
        : supabaseResult.error,
  };
}

export async function getPublicSalonBySlug(slug: string) {
  debugRepository("public-get-start", { slug });

  if (
    isProductionEnvironment() ||
    getSalonRepositoryStatus().activeSource === "supabase"
  ) {
    const supabaseResult = await tryGetSupabaseSalonBySlug(slug);

    if (supabaseResult.ok && supabaseResult.salon) {
      return {
        ok: true as const,
        salon: supabaseResult.salon,
        source: "supabase" as const,
      };
    }

    return {
      ok: false as const,
      error:
        supabaseResult.ok || !supabaseResult.error
          ? "Landing publica indisponivel."
          : supabaseResult.error,
      source: "supabase" as const,
    };
  }

  return getSalonBySlug(slug);
}

export async function createSalon(
  data: SalonFormInput,
): Promise<SalonRepositoryResult> {
  const status = getSalonRepositoryStatus();
  debugRepository("create-start", {
    name: data.name,
    source: status.activeSource,
  });

  if (shouldUseAdminApi()) {
    return fetchAdminCreateSalon(data);
  }

  if (status.activeSource === "server-local") {
    const slug = await generateUniqueRepositorySlug(data.name);
    const salon = buildSalonForCreate(data, slug);
    const serverLocalResult = await saveServerLocalSalon(salon);

    if (serverLocalResult.ok) {
      notifyRepositoryChanged();
      return serverLocalResult;
    }

    const localResult = createLocalSalonFromInput(data);
    notifyRepositoryChanged();

    return localResult.ok
      ? {
          ...localResult,
          warning: `Servidor local falhou; salvo localmente. ${serverLocalResult.error}`,
        }
      : serverLocalResult;
  }

  if (status.activeSource !== "supabase") {
    if (isProductionEnvironment()) {
      return {
        ok: false,
        error:
          "Producao exige Supabase configurado. Este cadastro nao pode ser salvo em localStorage.",
        source: "supabase",
      };
    }

    const result = createLocalSalonFromInput(data);
    notifyRepositoryChanged();

    return result;
  }

  const slug = await generateUniqueRepositorySlug(data.name);
  const salon = buildSalonForCreate(data, slug);
  const supabaseResult = await insertSupabaseSalon(salon);

  if (supabaseResult.ok) {
    saveLocalSalon(supabaseResult.salon);
    notifyRepositoryChanged();
    return supabaseResult;
  }

  if (isProductionEnvironment()) {
    return supabaseResult;
  }

  const localResult = createLocalSalonFromInput(data);
  notifyRepositoryChanged();

  return localResult.ok
    ? {
        ...localResult,
        warning: `Supabase falhou; salvo localmente. ${supabaseResult.error}`,
      }
    : supabaseResult;
}

export async function updateSalon(
  slug: string,
  data: SalonFormInput,
): Promise<SalonRepositoryResult> {
  debugRepository("update-start", { slug });

  if (shouldUseAdminApi()) {
    return fetchAdminUpdateSalon(slug, data);
  }

  const existingResult = await getSalonBySlug(slug);

  if (!existingResult.ok) {
    return existingResult;
  }

  const updatedSalon = mergeSalonUpdates(
    existingResult.salon,
    salonFormInputToPartialSalon(data),
  );

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    const serverLocalResult = await saveServerLocalSalon(updatedSalon);

    if (serverLocalResult.ok) {
      notifyRepositoryChanged();
      return serverLocalResult;
    }

    const localResult = saveLocalSalon(updatedSalon);
    notifyRepositoryChanged();

    return localResult.ok
      ? {
          ...localResult,
          source: "local",
          warning: `Servidor local falhou; alterações salvas localmente. ${serverLocalResult.error}`,
        }
      : serverLocalResult;
  }

  if (getSalonRepositoryStatus().activeSource !== "supabase") {
    if (isProductionEnvironment()) {
      return {
        ok: false,
        error:
          "Producao exige Supabase configurado. Esta edicao nao pode cair em localStorage.",
        source: "supabase",
      };
    }

    const localResult = saveLocalSalon(updatedSalon);
    notifyRepositoryChanged();

    return localResult.ok
      ? { ...localResult, source: "local" }
      : { ...localResult, source: "local" };
  }

  const supabaseResult = await updateSupabaseSalon(slug, updatedSalon);

  if (supabaseResult.ok) {
    saveLocalSalon(supabaseResult.salon);
    notifyRepositoryChanged();
    return supabaseResult;
  }

  if (isProductionEnvironment()) {
    return supabaseResult;
  }

  const localResult = saveLocalSalon(updatedSalon);
  notifyRepositoryChanged();

  return localResult.ok
    ? {
        ...localResult,
        source: "local",
        warning: `Supabase falhou; alterações salvas localmente. ${supabaseResult.error}`,
      }
    : supabaseResult;
}

export async function upsertSalon(salon: Salon): Promise<SalonRepositoryResult> {
  debugRepository("upsert-start", { slug: salon.slug, source: getSalonRepositoryStatus().activeSource });
  if (shouldUseAdminApi()) {
    return fetchAdminUpsertSalon(salon);
  }

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    const serverLocalResult = await saveServerLocalSalon(salon);

    if (serverLocalResult.ok) {
      notifyRepositoryChanged();
      return serverLocalResult;
    }

    const localResult = saveLocalSalon(salon);
    notifyRepositoryChanged();

    return localResult.ok
      ? {
          ...localResult,
          source: "local",
          warning: `Servidor local falhou; salvo localmente. ${serverLocalResult.error}`,
        }
      : serverLocalResult;
  }

  if (getSalonRepositoryStatus().activeSource !== "supabase") {
    if (isProductionEnvironment()) {
      return {
        ok: false,
        error:
          "Producao exige Supabase configurado. Este salao nao pode ser salvo em localStorage.",
        source: "supabase",
      };
    }

    const localResult = saveLocalSalon(salon);
    notifyRepositoryChanged();

    return localResult.ok
      ? { ...localResult, source: "local" }
      : { ...localResult, source: "local" };
  }

  const supabaseResult = await upsertSupabaseSalon(salon);

  if (supabaseResult.ok) {
    saveLocalSalon(supabaseResult.salon);
    notifyRepositoryChanged();
    return supabaseResult;
  }

  if (isProductionEnvironment()) {
    return supabaseResult;
  }

  const localResult = saveLocalSalon(salon);
  notifyRepositoryChanged();

  return localResult.ok
    ? {
        ...localResult,
        source: "local",
        warning: `Supabase falhou; salvo localmente. ${supabaseResult.error}`,
      }
    : supabaseResult;
}

export async function upsertSalonFromSource(
  salon: Salon,
  source: SalonRepositorySource,
): Promise<SalonRepositoryResult> {
  if (source !== "supabase") {
    return upsertSalon(salon);
  }

  if (typeof window !== "undefined") {
    const adminResult = await fetchAdminUpsertSalon(salon);

    if (adminResult.ok) {
      return adminResult;
    }
  }

  return upsertSupabaseSalon(salon);
}

export async function deleteSalon(slug: string) {
  debugRepository("delete-start", { slug, source: getSalonRepositoryStatus().activeSource });
  if (shouldUseAdminApi()) {
    return fetchAdminDeleteSalon(slug);
  }

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    const serverLocalDeleted = await deleteServerLocalSalon(slug);

    if (serverLocalDeleted.ok) {
      notifyRepositoryChanged();
      return serverLocalDeleted;
    }

    const deletedLocally = deleteLocalSalon(slug);
    notifyRepositoryChanged();

    return deletedLocally
      ? {
          ok: true as const,
          source: "local" as const,
          warning: `Servidor local falhou; exclusão concluída apenas no navegador. ${serverLocalDeleted.error}`,
        }
      : serverLocalDeleted;
  }

  if (getSalonRepositoryStatus().activeSource === "supabase") {
    const supabaseDeleted = await deleteSupabaseSalon(slug);

    if (!supabaseDeleted.ok) {
      return supabaseDeleted;
    }
  }

  if (isProductionEnvironment()) {
    return {
      ok: false as const,
      error: "Producao nao deve excluir via localStorage.",
      source: "supabase" as const,
    };
  }

  const deleted = deleteLocalSalon(slug);
  notifyRepositoryChanged();

  return deleted
    ? { ok: true as const, source: getSalonRepositoryStatus().activeSource }
    : {
        ok: false as const,
        error: "Não foi possível excluir este salão.",
        source: "local" as const,
      };
}

export async function deleteSalonFromSource(
  slug: string,
  source: SalonRepositorySource,
) {
  if (source !== "supabase") {
    return deleteSalon(slug);
  }

  if (typeof window !== "undefined") {
    const adminResult = await fetchAdminDeleteSalon(slug);

    if (adminResult.ok) {
      notifyRepositoryChanged();
      return adminResult;
    }
  }

  const supabaseResult = await deleteSupabaseSalon(slug);

  if (supabaseResult.ok) {
    notifyRepositoryChanged();
  }

  return supabaseResult;
}

export async function duplicateSalon(
  slug: string,
  preferredSource?: SalonRepositorySource,
): Promise<SalonRepositoryResult> {
  const sourceToUse = preferredSource ?? getSalonRepositoryStatus().activeSource;

  if (sourceToUse === "supabase" && typeof window !== "undefined") {
    const adminResult = await fetchAdminDuplicateSalon(slug);

    if (adminResult.ok) {
      saveLocalSalon(adminResult.salon);
      notifyRepositoryChanged();
    }

    return adminResult;
  }

  if (sourceToUse === "local") {
    const localResult = duplicateLocalSalon(slug);
    notifyRepositoryChanged();

    return localResult.ok
      ? { ...localResult, source: "local" }
      : { ...localResult, source: "local" };
  }

  const existingResult = await getSalonBySlug(slug);

  if (!existingResult.ok) {
    return existingResult;
  }

  const now = new Date().toISOString();
  const duplicatedSalon = createSalonDefaults({
    ...existingResult.salon,
    id: createId(),
    name: `${existingResult.salon.name} (cópia)`,
    slug: await generateUniqueRepositorySlug(`${existingResult.salon.name} copia`),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  });

  return upsertSalon(duplicatedSalon);
}

export function getLocalSalonCount() {
  if (isProductionEnvironment()) {
    return 0;
  }

  return getSalonIndex().length;
}

export async function listMigrationSourceSalons() {
  if (isProductionEnvironment()) {
    return [] as Salon[];
  }

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    const result = await listServerLocalSalons();
    return result.ok ? result.salons : [];
  }

  return listLocalSalons();
}

export async function getSupabaseSalonCount() {
  if (shouldUseAdminApi()) {
    const result = await fetchAdminSalonList();
    return result.ok ? result.salons.length : null;
  }

  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const query = client
    .from("salons")
    .select("id", { count: "exact", head: true });
  const result = await Promise.race([
    query,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 4_000);
    }),
  ]);

  if (!result) {
    return null;
  }

  const { count, error } = result;

  if (error) {
    return null;
  }

  return count ?? 0;
}

export async function migrateLocalSalonsToSupabase(
  options: SalonMigrationOptions,
): Promise<SalonMigrationResult> {
  const selectedSlugs = Array.from(
    new Set(options.selectedSlugs.map((slug) => normalizeSlug(slug)).filter(Boolean)),
  );
  const dryRun = options.dryRun !== false;
  const force = options.force === true;
  const scopes = options.scopes?.length
    ? Array.from(new Set(options.scopes))
    : DEFAULT_SALON_MIGRATION_SCOPES;

  if (!selectedSlugs.length) {
    return {
      ok: false,
      error: "Selecione pelo menos um salão. Por segurança, nenhum salão é migrado por padrão.",
    };
  }

  if (isProductionEnvironment()) {
    return {
      ok: false,
      error:
        "Migracao local para Supabase deve ser feita fora de producao. Use desenvolvimento ou um ambiente controlado.",
    };
  }

  const status = getSalonRepositoryStatus();

  if (!status.supabaseConfigured) {
    return {
      ok: false,
      error:
        "Supabase nao configurado. Verifique NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  if (!status.supabaseWriteEnabled) {
    return {
      ok: false,
      error:
        "Migração bloqueada: habilite NEXT_PUBLIC_SUPABASE_WRITE_MODE=enabled apenas em ambiente controlado e confirme as políticas RLS.",
    };
  }

  const migrationSource = status.activeSource === "server-local" ? "server-local" : "local";
  const sourceResult =
    migrationSource === "server-local"
      ? await listServerLocalSalons()
      : ({
          ok: true,
          salons: listLocalSalons(),
        } as const);

  if (!sourceResult.ok) {
    return {
      ok: false,
      error: `Nao foi possivel ler os saloes de ${migrationSource === "server-local" ? "server-local" : "localStorage"}: ${sourceResult.error}`,
    };
  }

  const sourceSalonMap = new Map(
    sourceResult.salons.map((salon) => [normalizeSlug(salon.slug), salon]),
  );
  const sourceSalons = selectedSlugs.flatMap((slug) => {
    const salon = sourceSalonMap.get(slug);
    return salon ? [salon] : [];
  });

  if (!sourceSalons.length) {
    return {
      ok: false,
      error:
        migrationSource === "server-local"
          ? "Nenhum dos salões selecionados foi encontrado no server-local."
          : "Nenhum dos salões selecionados foi encontrado no localStorage.",
    };
  }

  const errors: string[] = [];
  const migratedSlugs: string[] = [];
  const items: SalonMigrationItem[] = [];
  const productionSalonMap = new Map<string, Salon>();

  for (const sourceSalon of sourceSalons) {
    const productionResult = await fetchAdminRepository<{ salon: Salon }>(
      `/api/admin/salons/${encodeURIComponent(sourceSalon.slug)}`,
    );

    if (productionResult.ok) {
      productionSalonMap.set(
        normalizeSlug(sourceSalon.slug),
        productionResult.data.salon,
      );
      continue;
    }

    if (productionResult.status !== 404) {
      return {
        ok: false,
        error: getSupabaseMigrationConfigError(productionResult.error),
      };
    }
  }
  const preparedSalons = new Map<
    string,
    { salon: Salon; productionUpdatedAt?: string; localUpdatedAt: string }
  >();
  let created = 0;
  let updated = 0;

  debugRepository("migrate-start", {
    source: migrationSource,
    dryRun,
    force,
    scopes,
    total: selectedSlugs.length,
    salons: sourceSalons.map((salon) => ({
      name: salon.name,
      slug: salon.slug,
      id: salon.id,
      status: salon.status,
    })),
  });

  for (const salon of sourceSalons) {
    const productionSalon = productionSalonMap.get(normalizeSlug(salon.slug));
    const migrationSalon = buildScopedMigrationSalon(salon, productionSalon, scopes);
    const changedFields = getChangedMigrationFields(
      productionSalon,
      migrationSalon,
      scopes,
    );
    const productionIsNewer =
      productionSalon &&
      toTimestamp(productionSalon.updatedAt) > toTimestamp(salon.updatedAt);
    const hasReviewedVersion = Object.prototype.hasOwnProperty.call(
      options.expectedProductionVersions ?? {},
      salon.slug,
    );
    const reviewedProductionUpdatedAt =
      options.expectedProductionVersions?.[salon.slug] ?? null;
    const currentProductionUpdatedAt = productionSalon?.updatedAt ?? null;

    if (
      !dryRun &&
      !force &&
      (!hasReviewedVersion ||
        reviewedProductionUpdatedAt !== currentProductionUpdatedAt)
    ) {
      items.push({
        id: salon.id,
        slug: salon.slug,
        name: salon.name,
        action: "skip",
        status: "blocked-newer-production",
        changedFields,
        localUpdatedAt: salon.updatedAt,
        productionUpdatedAt: productionSalon?.updatedAt,
        reason: hasReviewedVersion
          ? "Produção mudou depois do DRY_RUN. Gere uma nova prévia antes de aplicar."
          : "Aplicação sem versão revisada. Execute o DRY_RUN antes de confirmar.",
      });
      continue;
    }

    if (productionIsNewer && !force) {
      items.push({
        id: salon.id,
        slug: salon.slug,
        name: salon.name,
        action: "skip",
        status: "blocked-newer-production",
        changedFields,
        localUpdatedAt: salon.updatedAt,
        productionUpdatedAt: productionSalon.updatedAt,
        reason:
          "Produção é mais recente. Marque FORCE explicitamente somente após revisar o conflito.",
      });
      continue;
    }

    if (productionSalon && !changedFields.length) {
      items.push({
        id: salon.id,
        slug: salon.slug,
        name: salon.name,
        action: "skip",
        status: "no-changes",
        changedFields: [],
        localUpdatedAt: salon.updatedAt,
        productionUpdatedAt: productionSalon.updatedAt,
        reason: "Nenhuma diferença encontrada dentro do escopo selecionado.",
      });
      continue;
    }

    items.push({
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      action: productionSalon ? "update" : "create",
      status: "ready",
      changedFields,
      localUpdatedAt: salon.updatedAt,
      productionUpdatedAt: productionSalon?.updatedAt,
    });
    preparedSalons.set(salon.slug, {
      salon: migrationSalon,
      productionUpdatedAt: productionSalon?.updatedAt,
      localUpdatedAt: salon.updatedAt,
    });

    debugRepository("migrate-row-start", {
      name: salon.name,
      slug: salon.slug,
      id: salon.id,
      status: salon.status,
      source: migrationSource,
    });

  }

  const plannedCreates = items.filter((item) => item.action === "create").length;
  const plannedUpdates = items.filter((item) => item.action === "update").length;

  if (dryRun) {
    return {
      ok: true,
      source: migrationSource,
      dryRun: true,
      force,
      scopes,
      selectedSlugs,
      total: selectedSlugs.length,
      plannedCreates,
      plannedUpdates,
      created: 0,
      updated: 0,
      confirmed: 0,
      skipped: items.filter((item) => item.action === "skip").length,
      failed: 0,
      errors,
      migratedSlugs,
      items,
    };
  }

  for (const item of items) {
    if (item.status !== "ready") {
      continue;
    }

    const prepared = preparedSalons.get(item.slug);

    if (!prepared) {
      continue;
    }

    const upsertResult = await fetchAdminMigrateSalon(prepared.salon, {
      sourceUpdatedAt: prepared.localUpdatedAt,
      expectedProductionUpdatedAt: prepared.productionUpdatedAt,
      force,
    });

    if (!upsertResult.ok) {
      const errorMessage = `${item.name} (${item.slug}): ${upsertResult.error}`;
      errors.push(errorMessage);
      item.status = "failed";
      item.reason = upsertResult.error;
      debugRepository("migrate-row-upsert-failed", {
        slug: item.slug,
        error: upsertResult.error,
      });
      continue;
    }

    const confirmation = await fetchAdminRepository<{ salon: Salon }>(
      `/api/admin/salons/${encodeURIComponent(item.slug)}`,
    );

    if (!confirmation.ok || !confirmation.data?.salon) {
      const errorMessage = `${item.name} (${item.slug}): gravação retornou sucesso, mas o salão não foi confirmado no Supabase. ${confirmation.ok ? "Resposta sem salão." : confirmation.error}`;
      errors.push(errorMessage);
      item.status = "failed";
      item.reason = errorMessage;
      debugRepository("migrate-row-confirmation-failed", {
        slug: item.slug,
        status: confirmation.status,
        error: confirmation.ok ? "missing-confirmed-salon" : confirmation.error,
      });
      continue;
    }

    item.status = "migrated";
    migratedSlugs.push(item.slug);

    if (item.action === "update") {
      updated += 1;
      debugRepository("migrate-row-updated", {
        slug: item.slug,
        confirmedId: confirmation.data.salon.id,
      });
    } else {
      created += 1;
      debugRepository("migrate-row-created", {
        slug: item.slug,
        confirmedId: confirmation.data.salon.id,
      });
    }
  }

  notifyRepositoryChanged();

  const confirmed = created + updated;

  if (confirmed === 0) {
    return {
      ok: false,
      error: errors.length
        ? `Migracao falhou: nenhum salao foi confirmado no Supabase. ${errors.join(" | ")}`
        : "Migracao falhou: nenhum salao foi confirmado no Supabase.",
    };
  }

  return {
    ok: true,
    source: migrationSource,
    dryRun: false,
    force,
    scopes,
    selectedSlugs,
    total: selectedSlugs.length,
    plannedCreates,
    plannedUpdates,
    created,
    updated,
    confirmed,
    skipped: items.filter((item) => item.action === "skip").length,
    failed: errors.length,
    errors,
    migratedSlugs,
    items,
  };
}

function buildScopedMigrationSalon(
  localSalon: Salon,
  productionSalon: Salon | undefined,
  scopes: SalonMigrationScope[],
) {
  const targetSalon =
    productionSalon ??
    createSalonDefaults({
      id: localSalon.id,
      slug: localSalon.slug,
      name: localSalon.name,
      createdAt: localSalon.createdAt,
      updatedAt: localSalon.updatedAt,
      status: "draft",
    });
  const nextSalon = { ...targetSalon } as Salon;
  const mutableSalon = nextSalon as unknown as Record<string, unknown>;
  const localRecord = localSalon as unknown as Record<string, unknown>;

  for (const scope of scopes) {
    for (const field of SALON_MIGRATION_SCOPE_FIELDS[scope]) {
      mutableSalon[field] = localRecord[field];
    }
  }

  if (scopes.includes("contacts") && !scopes.includes("images")) {
    nextSalon.sourceProfile = {
      ...targetSalon.sourceProfile,
      instagramProfileUrl:
        localSalon.instagramProfileUrl || localSalon.instagramUrl || undefined,
      googleBusinessUrl:
        localSalon.googleBusinessUrl || localSalon.googleMapsUrl || undefined,
    };
  }

  if (scopes.includes("images") && productionSalon) {
    const mergedImages = mergeMigrationImages(
      localSalon.galleryImages,
      productionSalon.galleryImages,
    );
    nextSalon.galleryImages = mergedImages;
    nextSalon.gallery = mergedImages;
    nextSalon.realImages = mergedImages.filter((image) => image.isReal);
  }

  nextSalon.id = productionSalon?.id ?? localSalon.id;
  nextSalon.slug = localSalon.slug;
  nextSalon.createdAt = productionSalon?.createdAt ?? localSalon.createdAt;
  nextSalon.updatedAt = localSalon.updatedAt;

  return createSalonDefaults(nextSalon);
}

function mergeMigrationImages(
  localImages: Salon["galleryImages"],
  productionImages: Salon["galleryImages"],
) {
  const validProductionImages = filterValidLandingImages(productionImages, {
    includeLogo: true,
    requireReal: false,
    requireSelected: false,
  });
  const validLocalImages = filterValidLandingImages(localImages, {
    includeLogo: true,
    requireReal: false,
    requireSelected: false,
  });
  const imagesByIdentity = new Map<string, (typeof validLocalImages)[number]>();

  for (const image of [...validProductionImages, ...validLocalImages]) {
    const identity = image.id || getValidImageUrl(image);

    if (identity) {
      imagesByIdentity.set(identity, image);
    }
  }

  return Array.from(imagesByIdentity.values());
}

function getChangedMigrationFields(
  productionSalon: Salon | undefined,
  migrationSalon: Salon,
  scopes: SalonMigrationScope[],
) {
  const fields = Array.from(
    new Set(scopes.flatMap((scope) => SALON_MIGRATION_SCOPE_FIELDS[scope])),
  );

  if (!productionSalon) {
    return fields.map(String);
  }

  return fields
    .filter(
      (field) =>
        JSON.stringify(productionSalon[field] ?? null) !==
        JSON.stringify(migrationSalon[field] ?? null),
    )
    .map(String);
}

function toTimestamp(value: string | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function subscribeToSalonRepository(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const storageChangedEvent = getSalonStorageChangedEvent();

  window.addEventListener("storage", callback);
  window.addEventListener(storageChangedEvent, callback);
  window.addEventListener(REPOSITORY_CHANGED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(storageChangedEvent, callback);
    window.removeEventListener(REPOSITORY_CHANGED_EVENT, callback);
  };
}

let hasAttemptedServerLocalSeed = false;

function createLocalSalonFromInput(data: SalonFormInput): SalonRepositoryResult {
  const slug = generateLocalUniqueSlug(data.name);
  const salon = buildSalonForCreate(data, slug);
  const result = saveLocalSalon(salon);

  return result.ok
    ? { ...result, source: "local" }
    : { ...result, source: "local" };
}

function buildSalonForCreate(data: SalonFormInput, slug: string) {
  const now = new Date().toISOString();

  return createSalonDefaults({
    ...salonFormInputToPartialSalon(data),
    id: createId(),
    slug,
    status: data.status ?? "preview",
    sourceMode: "manual",
    generationStatus: "idle",
    createdAt: now,
    updatedAt: now,
  });
}

async function generateUniqueRepositorySlug(name: string, currentSlug?: string) {
  const baseSlug = normalizeSlug(name);
  let nextSlug = baseSlug;
  let suffix = 2;

  while (await repositorySlugExists(nextSlug, currentSlug)) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
}

async function repositorySlugExists(slug: string, currentSlug?: string) {
  if (slug === currentSlug) {
    return false;
  }

  if (shouldUseAdminApi()) {
    const adminResult = await fetchAdminSalonBySlug(slug);

    if (adminResult.ok) {
      return true;
    }
  }

  if (getSalonRepositoryStatus().activeSource === "server-local") {
    const serverLocalResult = await getServerLocalSalonBySlug(slug);

    if (serverLocalResult.ok && serverLocalResult.salon) {
      return true;
    }
  }

  if (getLocalSalonBySlug(slug)) {
    return true;
  }

  const supabaseResult = await tryGetSupabaseSalonBySlug(slug);

  return Boolean(supabaseResult.ok && supabaseResult.salon);
}

async function tryListSupabaseSalons(): Promise<SalonRepositoryListResult> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      ok: false,
      error: "Supabase não configurado.",
      salons: [],
      source: "supabase",
    };
  }

  try {
    const startedAt = Date.now();
    const { data, error } = await client
      .from("salons")
      .select(
        "id,slug,name,status,commercial_status,language,country,city,address,description,headline,subheadline,booking_url,whatsapp,phone,website_url,instagram_url,google_maps_url,business_hours,notes,readiness_score,created_at,updated_at,services,copy_suggestions,generated_copy,source_profile,social_links,cta,seo,metadata",
      )
      .order("updated_at", { ascending: false });

    logPerfEvent({
      route: "/salons",
      step: "listSupabaseSalons",
      ms: Date.now() - startedAt,
      count: data?.length ?? 0,
      source: "supabase",
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
        salons: [],
        source: "supabase",
      };
    }

    return {
      ok: true,
      salons: ((data ?? []) as SupabaseSalonRow[]).map(mapSupabaseRowToSalon),
      source: "supabase",
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Erro ao listar salões no Supabase."),
      salons: [],
      source: "supabase",
    };
  }
}

async function tryGetSupabaseSalonBySlug(
  slug: string,
): Promise<
  | { ok: true; salon: Salon | null }
  | { ok: false; error: string; salon?: null }
> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, error: "Supabase não configurado." };
  }

  try {
    const startedAt = Date.now();
    const { data, error } = await client
      .from("salons")
      .select(
        "id,slug,name,status,commercial_status,language,country,city,address,description,headline,subheadline,booking_url,whatsapp,phone,website_url,instagram_url,google_maps_url,business_hours,notes,readiness_score,created_at,updated_at,services,real_images,real_reviews,copy_suggestions,copy_history,generated_copy,source_profile,social_links,cta,seo,metadata",
      )
      .eq("slug", slug)
      .maybeSingle();

    logPerfEvent({
      route: "/salons/[id]/edit",
      step: "getSupabaseSalonBySlug",
      ms: Date.now() - startedAt,
      slug,
      source: "supabase",
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      salon: data ? mapSupabaseRowToSalon(data as SupabaseSalonRow) : null,
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Erro ao buscar salão no Supabase."),
    };
  }
}

async function insertSupabaseSalon(salon: Salon): Promise<SalonRepositoryResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, error: "Supabase não configurado.", source: "supabase" };
  }

  const startedAt = Date.now();
  const { data, error } = await client
    .from("salons")
    .insert(mapSalonToSupabaseRow(salon, { compact: true }))
    .select("id,slug,updated_at")
    .maybeSingle();

  logPerfEvent({
    route: "/salons/[id]/edit",
    step: "insertSupabaseSalon",
    ms: Date.now() - startedAt,
    id: salon.id,
    slug: salon.slug,
    payloadKb: estimatePayloadSize(mapSalonToSupabaseRow(salon, { compact: true })),
    imagesCount: salon.galleryImages?.filter((image) => image.isReal).length ?? 0,
    servicesCount: salon.services?.length ?? 0,
    source: "supabase",
  });

  if (error) {
    return { ok: false, error: error.message, source: "supabase" };
  }

  return {
    ok: true,
    salon: data ? mapSupabaseRowToSalon(data as SupabaseSalonRow) : salon,
    source: "supabase",
  };
}

async function updateSupabaseSalon(
  slug: string,
  salon: Salon,
): Promise<SalonRepositoryResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, error: "Supabase não configurado.", source: "supabase" };
  }

  const startedAt = Date.now();
  const { data, error } = await client
    .from("salons")
    .update(mapSalonToSupabaseRow(salon, { compact: true }))
    .eq("slug", slug)
    .select("id,slug,updated_at")
    .maybeSingle();

  logPerfEvent({
    route: "/salons/[id]/edit",
    step: "updateSupabaseSalon",
    ms: Date.now() - startedAt,
    id: salon.id,
    slug,
    payloadKb: estimatePayloadSize(mapSalonToSupabaseRow(salon, { compact: true })),
    imagesCount: salon.galleryImages?.filter((image) => image.isReal).length ?? 0,
    servicesCount: salon.services?.length ?? 0,
    source: "supabase",
  });

  if (error) {
    return { ok: false, error: error.message, source: "supabase" };
  }

  return {
    ok: true,
    salon: data ? mapSupabaseRowToSalon(data as SupabaseSalonRow) : salon,
    source: "supabase",
  };
}

async function upsertSupabaseSalon(salon: Salon): Promise<SalonRepositoryResult> {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false, error: "Supabase não configurado.", source: "supabase" };
  }

  try {
    const startedAt = Date.now();
    const { data, error } = await client
      .from("salons")
      .upsert(mapSalonToSupabaseRow(salon, { compact: true }), { onConflict: "slug" })
      .select("id,slug,updated_at")
      .maybeSingle();

    logPerfEvent({
      route: "/salons/[id]/edit",
      step: "upsertSupabaseSalon",
      ms: Date.now() - startedAt,
      id: salon.id,
      slug: salon.slug,
      payloadKb: estimatePayloadSize(mapSalonToSupabaseRow(salon, { compact: true })),
      imagesCount: salon.galleryImages?.filter((image) => image.isReal).length ?? 0,
      servicesCount: salon.services?.length ?? 0,
      source: "supabase",
    });

    if (error) {
      return { ok: false, error: error.message, source: "supabase" };
    }

    return {
      ok: true,
      salon: data ? mapSupabaseRowToSalon(data as SupabaseSalonRow) : salon,
      source: "supabase",
    };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Erro ao salvar salÃ£o no Supabase."),
      source: "supabase",
    };
  }
}

async function deleteSupabaseSalon(slug: string) {
  const client = getSupabaseClient();

  if (!client) {
    return { ok: false as const, error: "Supabase não configurado." };
  }

  const { error } = await client.from("salons").delete().eq("slug", slug);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

function notifyRepositoryChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(REPOSITORY_CHANGED_EVENT));
}

function shouldUseAdminApi() {
  return (
    typeof window !== "undefined" &&
    getSalonRepositoryStatus().activeSource === "supabase"
  );
}

async function maybeSeedServerLocalFromLocalStorage(
  knownServerLocalResult?: SalonRepositoryListResult,
) {
  if (
    hasAttemptedServerLocalSeed ||
    !isServerLocalStorageEnabled() ||
    typeof window === "undefined"
  ) {
    return;
  }

  hasAttemptedServerLocalSeed = true;

  const localSalons = listLocalSalons();

  if (!localSalons.length) {
    return;
  }

  const existingServerLocalSalons =
    knownServerLocalResult ?? (await listServerLocalSalons());

  if (
    !existingServerLocalSalons.ok ||
    existingServerLocalSalons.salons.length > 0
  ) {
    return;
  }

  await saveManyServerLocalSalons(localSalons);
}

async function listServerLocalSalons(): Promise<SalonRepositoryListResult> {
  const response = await fetchServerLocalRepository<{
    salons: Salon[];
  }>("/api/dev/salons");

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      salons: [],
      source: "server-local",
    };
  }

  return {
    ok: true,
    salons: response.data.salons,
    source: "server-local",
  };
}

async function getServerLocalSalonBySlug(slug: string): Promise<
  | { ok: true; salon: Salon | null }
  | { ok: false; error: string; salon?: null }
> {
  const response = await fetchServerLocalRepository<{
    salon: Salon;
  }>(`/api/dev/salons/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    if (response.status === 404) {
      return { ok: true, salon: null };
    }

    return { ok: false, error: response.error };
  }

  return {
    ok: true,
    salon: response.data.salon,
  };
}

async function saveServerLocalSalon(
  salon: Salon,
): Promise<SalonRepositoryResult> {
  const response = await fetchServerLocalRepository<{ salon: Salon }>(
    `/api/dev/salons/${encodeURIComponent(salon.slug)}`,
    {
      method: "PUT",
      body: JSON.stringify({ salon }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "server-local",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "server-local",
  };
}

async function saveManyServerLocalSalons(salons: Salon[]) {
  return fetchServerLocalRepository<{ salons: Salon[] }>("/api/dev/salons", {
    method: "POST",
    body: JSON.stringify({ salons }),
  });
}

async function deleteServerLocalSalon(slug: string) {
  const response = await fetchServerLocalRepository(
    `/api/dev/salons/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    return {
      ok: false as const,
      error: response.error,
      source: "server-local" as const,
    };
  }

  return {
    ok: true as const,
    source: "server-local" as const,
  };
}

async function fetchServerLocalRepository<TData>(
  input: string,
  init?: RequestInit,
): Promise<
  | { ok: true; data: TData; status: number }
  | { ok: false; error: string; status: number }
> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      error:
        "O armazenamento compartilhado de desenvolvimento só pode ser acessado pelo navegador conectado ao dev server.",
      status: 500,
    };
  }

  try {
    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const payload = (await response.json().catch(() => null)) as
      | ({ success?: boolean; error?: string } & TData)
      | null;

    if (!response.ok || !payload?.success) {
      return {
        ok: false,
        error:
          payload?.error ||
          `Falha ao acessar o armazenamento compartilhado (${response.status}).`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data: payload,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao acessar o armazenamento compartilhado.",
      status: 500,
    };
  }
}

async function fetchAdminSalonList(): Promise<SalonRepositoryListResult> {
  const response = await fetchAdminRepository<{ salons: Salon[] }>(
    "/api/admin/salons",
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      salons: [],
      source: "supabase",
    };
  }

  return {
    ok: true,
    salons: response.data.salons,
    source: "supabase",
  };
}

async function fetchAdminSalonBySlug(
  slug: string,
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    `/api/admin/salons/${encodeURIComponent(slug)}`,
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminCreateSalon(
  input: SalonFormInput,
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    "/api/admin/salons",
    {
      method: "POST",
      body: JSON.stringify({ input }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminUpdateSalon(
  slug: string,
  input: SalonFormInput,
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    `/api/admin/salons/${encodeURIComponent(slug)}`,
    {
      method: "PUT",
      body: JSON.stringify({ input }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminUpsertSalon(
  salon: Salon,
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    `/api/admin/salons/${encodeURIComponent(salon.slug)}`,
    {
      method: "PUT",
      body: JSON.stringify({ salon }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminMigrateSalon(
  salon: Salon,
  guard: {
    sourceUpdatedAt: string;
    expectedProductionUpdatedAt?: string;
    force: boolean;
  },
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    `/api/admin/salons/${encodeURIComponent(salon.slug)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        salon,
        migrationGuard: guard,
      }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminDeleteSalon(slug: string) {
  const response = await fetchAdminRepository(
    `/api/admin/salons/${encodeURIComponent(slug)}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    return {
      ok: false as const,
      error: response.error,
      source: "supabase" as const,
    };
  }

  return {
    ok: true as const,
    source: "supabase" as const,
  };
}

async function fetchAdminDuplicateSalon(
  slug: string,
): Promise<SalonRepositoryResult> {
  const response = await fetchAdminRepository<{ salon: Salon }>(
    `/api/admin/salons/${encodeURIComponent(slug)}/duplicate`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      error: response.error,
      source: "supabase",
    };
  }

  return {
    ok: true,
    salon: response.data.salon,
    source: "supabase",
  };
}

async function fetchAdminRepository<TData>(
  input: string,
  init?: RequestInit,
): Promise<
  | { ok: true; data: TData; status: number }
  | { ok: false; error: string; status: number }
> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      error:
        "A API administrativa so pode ser acessada pelo navegador autenticado do painel.",
      status: 500,
    };
  }

  try {
    debugRepository("admin-api-request", {
      input,
      method: init?.method ?? "GET",
    });

    const response = await fetch(input, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const payload = (await response.json().catch(() => null)) as
      | ({ success?: boolean; error?: string } & TData)
      | null;

    if (!response.ok || !payload?.success) {
      debugRepository("admin-api-failed", {
        input,
        method: init?.method ?? "GET",
        status: response.status,
        error:
          payload?.error ||
          `Falha ao acessar a API administrativa (${response.status}).`,
      });
      return {
        ok: false,
        error:
          payload?.error ||
          `Falha ao acessar a API administrativa (${response.status}).`,
        status: response.status,
      };
    }

    return {
      ok: true,
      data: payload,
      status: response.status,
    };
  } catch (error) {
    debugRepository("admin-api-exception", {
      input,
      method: init?.method ?? "GET",
      error:
        error instanceof Error
          ? error.message
          : "Erro ao acessar a API administrativa.",
    });
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao acessar a API administrativa.",
      status: 500,
    };
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `salon-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSupabaseMigrationConfigError(error: string) {
  if (
    error.includes("SUPABASE_SERVICE_ROLE_KEY") ||
    error.includes("NEXT_PUBLIC_SUPABASE_WRITE_MODE") ||
    error.includes("Supabase")
  ) {
    return `Supabase nao configurado. Verifique NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY. ${error}`;
  }

  return error;
}
