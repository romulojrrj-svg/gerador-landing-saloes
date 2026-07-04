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

export type SalonMigrationResult =
  | {
      ok: true;
      source: "local" | "server-local";
      total: number;
      created: number;
      updated: number;
      confirmed: number;
      failed: number;
      errors: string[];
      migratedSlugs: string[];
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
    await maybeSeedServerLocalFromLocalStorage();
    const serverLocalResult = await listServerLocalSalons();

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

export async function duplicateSalon(
  slug: string,
): Promise<SalonRepositoryResult> {
  if (getSalonRepositoryStatus().activeSource === "local") {
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

export async function getSupabaseSalonCount() {
  if (shouldUseAdminApi()) {
    const result = await fetchAdminSalonList();
    return result.ok ? result.salons.length : null;
  }

  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const { count, error } = await client
    .from("salons")
    .select("id", { count: "exact", head: true });

  if (error) {
    return null;
  }

  return count ?? 0;
}

export async function migrateLocalSalonsToSupabase(): Promise<SalonMigrationResult> {
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

  const sourceSalons = sourceResult.salons;

  if (!sourceSalons.length) {
    return {
      ok: false,
      error:
        migrationSource === "server-local"
          ? "Nenhum salao encontrado no server-local para migrar."
          : "Nenhum salao encontrado no localStorage para migrar.",
    };
  }

  const adminPreflight = await fetchAdminSalonList();

  if (!adminPreflight.ok) {
    return {
      ok: false,
      error: getSupabaseMigrationConfigError(adminPreflight.error),
    };
  }

  const errors: string[] = [];
  const migratedSlugs: string[] = [];
  let created = 0;
  let updated = 0;

  debugRepository("migrate-start", {
    source: migrationSource,
    total: sourceSalons.length,
    salons: sourceSalons.map((salon) => ({
      name: salon.name,
      slug: salon.slug,
      id: salon.id,
      status: salon.status,
    })),
  });

  for (const salon of sourceSalons) {
    debugRepository("migrate-row-start", {
      name: salon.name,
      slug: salon.slug,
      id: salon.id,
      status: salon.status,
      source: migrationSource,
    });

    const existingCheck = await fetchAdminRepository<{ salon: Salon }>(
      `/api/admin/salons/${encodeURIComponent(salon.slug)}`,
    );

    if (!existingCheck.ok && existingCheck.status !== 404) {
      const errorMessage = `${salon.name} (${salon.slug}): falha ao verificar existencia no Supabase. ${existingCheck.error}`;
      errors.push(errorMessage);
      debugRepository("migrate-row-verify-before-failed", {
        slug: salon.slug,
        status: existingCheck.status,
        error: existingCheck.error,
      });
      continue;
    }

    const existedBefore = existingCheck.ok;
    const upsertResult = await fetchAdminUpsertSalon(salon);

    if (!upsertResult.ok) {
      const errorMessage = `${salon.name} (${salon.slug}): ${upsertResult.error}`;
      errors.push(errorMessage);
      debugRepository("migrate-row-upsert-failed", {
        slug: salon.slug,
        error: upsertResult.error,
      });
      continue;
    }

    const confirmation = await fetchAdminRepository<{ salon: Salon }>(
      `/api/admin/salons/${encodeURIComponent(salon.slug)}`,
    );

    if (!confirmation.ok || !confirmation.data?.salon) {
      const errorMessage = `${salon.name} (${salon.slug}): upsert retornou sucesso, mas o salao nao foi confirmado no Supabase. ${confirmation.ok ? "Resposta sem salao." : confirmation.error}`;
      errors.push(errorMessage);
      debugRepository("migrate-row-confirmation-failed", {
        slug: salon.slug,
        status: confirmation.status,
        error: confirmation.ok ? "missing-confirmed-salon" : confirmation.error,
      });
      continue;
    }

    migratedSlugs.push(salon.slug);

    if (existedBefore) {
      updated += 1;
      debugRepository("migrate-row-updated", {
        slug: salon.slug,
        confirmedId: confirmation.data.salon.id,
      });
    } else {
      created += 1;
      debugRepository("migrate-row-created", {
        slug: salon.slug,
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
    total: sourceSalons.length,
    created,
    updated,
    confirmed,
    failed: errors.length,
    errors,
    migratedSlugs,
  };
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
    const { data, error } = await client
      .from("salons")
      .select("*")
      .order("updated_at", { ascending: false });

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
    const { data, error } = await client
      .from("salons")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

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

  const { data, error } = await client
    .from("salons")
    .insert(mapSalonToSupabaseRow(salon))
    .select("*")
    .single();

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

  const { data, error } = await client
    .from("salons")
    .update(mapSalonToSupabaseRow(salon))
    .eq("slug", slug)
    .select("*")
    .maybeSingle();

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
    const { data, error } = await client
      .from("salons")
      .upsert(mapSalonToSupabaseRow(salon), { onConflict: "slug" })
      .select("*")
      .single();

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

async function maybeSeedServerLocalFromLocalStorage() {
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

  const existingServerLocalSalons = await listServerLocalSalons();

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
