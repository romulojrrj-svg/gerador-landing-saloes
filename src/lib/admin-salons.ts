import "server-only";

import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  mapSalonToSupabaseRow,
  mapSupabaseRowToSalon,
  type SupabaseSalonRow,
} from "@/lib/supabase/salon-mapper";
import {
  createSalonDefaults,
  ensureCompleteSalon,
  mergeSalonUpdates,
  normalizeSlug,
  salonFormInputToPartialSalon,
} from "@/lib/salon-storage";
import { estimatePayloadSize, logPerfEvent } from "@/lib/perf-logs";
import { normalizePremiumEditorial } from "@/lib/premium-editorial";
import type { Salon, SalonFormInput } from "@/types/salon";

type AdminSalonResult =
  | { ok: true; salon: Salon }
  | { ok: false; error: string };

type AdminSalonListResult =
  | { ok: true; salons: Salon[] }
  | { ok: false; error: string; salons: Salon[] };

export type AdminSalonMigrationGuard = {
  sourceUpdatedAt: string;
  expectedProductionUpdatedAt?: string;
  force: boolean;
};

export async function listAdminSalons(): Promise<AdminSalonListResult> {
  const client = getConfiguredAdminClient();

  if (!client.ok) {
    return {
      ok: false,
      error: client.error,
      salons: [],
    };
  }

  const startedAt = Date.now();
  const { data, error } = await client.client
    .from("salons")
    .select(
      "id,slug,name,status,commercial_status,language,country,city,address,description,headline,subheadline,booking_url,whatsapp,phone,website_url,instagram_url,google_maps_url,business_hours,notes,readiness_score,created_at,updated_at,services,real_images,real_reviews,copy_suggestions,copy_history,generated_copy,source_profile,social_links,cta,seo,metadata",
    )
    .order("updated_at", { ascending: false });

  logPerfEvent({
    route: "/salons",
    step: "listAdminSalons",
    ms: Date.now() - startedAt,
    count: data?.length ?? 0,
    source: "supabase-admin",
  });

  if (error) {
    debugAdminSalons("list-failed", { error: error.message });
    return {
      ok: false,
      error: error.message,
      salons: [],
    };
  }

  return {
    ok: true,
    salons: ((data ?? []) as SupabaseSalonRow[]).map(mapSupabaseRowToSalon),
  };
}

export async function getAdminSalonBySlug(slug: string): Promise<AdminSalonResult> {
  const client = getConfiguredAdminClient();

  if (!client.ok) {
    return {
      ok: false,
      error: client.error,
    };
  }

  const startedAt = Date.now();
  const { data, error } = await client.client
    .from("salons")
    .select(
      "id,slug,name,status,commercial_status,language,country,city,address,description,headline,subheadline,booking_url,whatsapp,phone,website_url,instagram_url,google_maps_url,business_hours,notes,readiness_score,created_at,updated_at,services,real_images,real_reviews,copy_suggestions,copy_history,generated_copy,source_profile,social_links,cta,seo,metadata",
    )
    .eq("slug", slug)
    .maybeSingle();

  logPerfEvent({
    route: "/salons/[id]/edit",
    step: "getAdminSalonBySlug",
    ms: Date.now() - startedAt,
    slug,
    source: "supabase-admin",
  });

  if (error) {
    debugAdminSalons("get-failed", { slug, error: error.message });
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "Salao nao encontrado.",
    };
  }

  return {
    ok: true,
    salon: mapSupabaseRowToSalon(data as SupabaseSalonRow),
  };
}

export async function createAdminSalonFromInput(
  input: SalonFormInput,
): Promise<AdminSalonResult> {
  const writeAccess = getConfiguredAdminClient({ requireWrite: true });

  if (!writeAccess.ok) {
    return {
      ok: false,
      error: writeAccess.error,
    };
  }

  const slug = await generateUniqueAdminSlug(input.name);
  const now = new Date().toISOString();
  const salon = createSalonDefaults({
    ...salonFormInputToPartialSalon(input),
    id: crypto.randomUUID(),
    slug,
    status: input.status ?? "preview",
    sourceMode: "manual",
    generationStatus: "idle",
    createdAt: now,
    updatedAt: now,
  });

  return saveAdminSalon(salon);
}

export async function duplicateAdminSalonAsPremium(slug: string): Promise<AdminSalonResult> {
  const existing = await getAdminSalonBySlug(slug);

  if (!existing.ok) {
    return existing;
  }

  const name = `${existing.salon.name} 2`;
  const requestedSlug = normalizeSlug(name);
  const existingDuplicate = await getAdminSalonBySlug(requestedSlug);

  if (existingDuplicate.ok) {
    return existingDuplicate;
  }

  const now = new Date().toISOString();
  const duplicated = ensureCompleteSalon({
    ...existing.salon,
    id: crypto.randomUUID(),
    slug: await generateUniqueAdminSlug(name),
    name,
    status: "draft",
    template: "premium_editorial",
    premiumEditorial: normalizePremiumEditorial(existing.salon.premiumEditorial, {
      ...existing.salon,
      name,
    }),
    createdAt: now,
    updatedAt: now,
  });

  return saveAdminSalon(duplicated);
}

export async function publishAdminSalon(slug: string): Promise<AdminSalonResult> {
  const existing = await getAdminSalonBySlug(slug);

  if (!existing.ok) {
    return existing;
  }

  return saveAdminSalon({
    ...existing.salon,
    status: "published",
    updatedAt: new Date().toISOString(),
  });
}

export async function updateAdminSalonFromInput(
  slug: string,
  input: SalonFormInput,
): Promise<AdminSalonResult> {
  const existing = await getAdminSalonBySlug(slug);

  if (!existing.ok) {
    return existing;
  }

  const updatedSalon = mergeSalonUpdates(
    existing.salon,
    salonFormInputToPartialSalon(input),
  );

  return saveAdminSalon(updatedSalon);
}

export async function upsertAdminSalon(
  salon: Salon,
  migrationGuard?: AdminSalonMigrationGuard,
): Promise<AdminSalonResult> {
  return migrationGuard
    ? saveMigratedAdminSalon(salon, migrationGuard)
    : saveAdminSalon(salon);
}

export async function deleteAdminSalon(slug: string) {
  const writeAccess = getConfiguredAdminClient({ requireWrite: true });

  if (!writeAccess.ok) {
    return {
      ok: false as const,
      error: writeAccess.error,
    };
  }

  const { error } = await writeAccess.client.from("salons").delete().eq("slug", slug);

  if (error) {
    return {
      ok: false as const,
      error: error.message,
    };
  }

  return {
    ok: true as const,
  };
}

function getConfiguredAdminClient(options?: { requireWrite?: boolean }) {
  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false as const,
      error:
        "SUPABASE_SERVICE_ROLE_KEY nao configurado. Defina a chave server-side para usar o painel com Supabase em producao.",
    };
  }

  if (
    options?.requireWrite &&
    process.env.NEXT_PUBLIC_SUPABASE_WRITE_MODE !== "enabled"
  ) {
    return {
      ok: false as const,
      error:
        "NEXT_PUBLIC_SUPABASE_WRITE_MODE precisa estar como enabled para liberar criacao, edicao e importacao no painel.",
    };
  }

  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      ok: false as const,
      error: "Nao foi possivel inicializar o cliente administrativo do Supabase.",
    };
  }

  return {
    ok: true as const,
    client,
  };
}

async function saveMigratedAdminSalon(
  salon: Salon,
  guard: AdminSalonMigrationGuard,
): Promise<AdminSalonResult> {
  const writeAccess = getConfiguredAdminClient({ requireWrite: true });

  if (!writeAccess.ok) {
    return {
      ok: false,
      error: writeAccess.error,
    };
  }

  const { data: currentRow, error: readError } = await writeAccess.client
    .from("salons")
    .select("id,slug,updated_at")
    .eq("slug", salon.slug)
    .maybeSingle();

  if (readError) {
    return {
      ok: false,
      error: `Nao foi possivel validar a versao atual de producao: ${readError.message}`,
    };
  }

  const currentUpdatedAt = currentRow?.updated_at as string | undefined;

  if (currentUpdatedAt && !guard.force) {
    if (!guard.expectedProductionUpdatedAt) {
      return {
        ok: false,
        error:
          "Migracao bloqueada: execute o DRY_RUN novamente antes de atualizar este salao.",
      };
    }

    if (currentUpdatedAt !== guard.expectedProductionUpdatedAt) {
      return {
        ok: false,
        error:
          "Migracao bloqueada: a producao mudou depois do DRY_RUN. Revise os dados e gere uma nova previa.",
      };
    }

    if (toAdminTimestamp(currentUpdatedAt) > toAdminTimestamp(guard.sourceUpdatedAt)) {
      return {
        ok: false,
        error:
          "Migracao bloqueada: updated_at da producao e mais recente que o local. Use FORCE somente apos revisar o conflito.",
      };
    }
  }

  const payload = ensureCompleteSalon({
    ...salon,
    id: (currentRow?.id as string | undefined) ?? salon.id,
    updatedAt: new Date().toISOString(),
  });
  const row = mapSalonToSupabaseRow(payload, { compact: true });

  if (currentRow) {
    let updateQuery = writeAccess.client
      .from("salons")
      .update(row)
      .eq("slug", salon.slug);

    if (!guard.force && guard.expectedProductionUpdatedAt) {
      updateQuery = updateQuery.eq(
        "updated_at",
        guard.expectedProductionUpdatedAt,
      );
    }

    const { data, error } = await updateQuery
      .select("id,slug,updated_at")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error: formatSupabaseError(error),
      };
    }

    if (!data) {
      return {
        ok: false,
        error:
          "Migracao bloqueada: nenhum registro corresponde mais a versao revisada no DRY_RUN.",
      };
    }
  } else {
    const { error } = await writeAccess.client.from("salons").insert(row);

    if (error) {
      return {
        ok: false,
        error: formatSupabaseError(error),
      };
    }
  }

  debugAdminSalons("migration-save-success", {
    slug: payload.slug,
    force: guard.force,
    sourceUpdatedAt: guard.sourceUpdatedAt,
    previousProductionUpdatedAt: currentUpdatedAt ?? null,
  });

  return {
    ok: true,
    salon: payload,
  };
}

async function saveAdminSalon(salon: Salon): Promise<AdminSalonResult> {
  const writeAccess = getConfiguredAdminClient({ requireWrite: true });

  if (!writeAccess.ok) {
    return {
      ok: false,
      error: writeAccess.error,
    };
  }

  const startedAt = Date.now();
  const payload = ensureCompleteSalon({
    ...salon,
    updatedAt: new Date().toISOString(),
  });
  const row = mapSalonToSupabaseRow(payload, { compact: true });
  const payloadKb = estimatePayloadSize(row);
  debugAdminSalons("save-start", {
    slug: payload.slug,
    name: payload.name,
    status: payload.status,
    commercialStatus: payload.commercialStatus,
    hasInstagram: Boolean(payload.instagramUrl),
    hasGoogleMaps: Boolean(payload.googleMapsUrl),
    servicesCount: payload.services?.length ?? 0,
    imagesCount: payload.galleryImages?.length ?? 0,
    reviewsCount: payload.testimonials?.length ?? 0,
    writeMode: process.env.NEXT_PUBLIC_SUPABASE_WRITE_MODE ?? "disabled",
    payloadKb,
  });
  logPerfEvent({
    route: "/salons/[id]/edit",
    step: "buildPayload",
    id: payload.id,
    slug: payload.slug,
    payloadKb,
    imagesCount: payload.galleryImages?.filter((image) => image.isReal).length ?? 0,
    servicesCount: payload.services?.length ?? 0,
    source: "supabase-admin",
  });
  debugAdminSalons("save-start", {
    slug: payload.slug,
    name: payload.name,
    status: payload.status,
    commercialStatus: payload.commercialStatus,
    hasInstagram: Boolean(payload.instagramUrl),
    hasGoogleMaps: Boolean(payload.googleMapsUrl),
    servicesCount: payload.services?.length ?? 0,
    imagesCount: payload.galleryImages?.length ?? 0,
    reviewsCount: payload.testimonials?.length ?? 0,
    writeMode: process.env.NEXT_PUBLIC_SUPABASE_WRITE_MODE ?? "disabled",
  });
  let { data, error } = await writeAccess.client
    .from("salons")
    .upsert(row, { onConflict: "slug" })
    .select("id,slug,updated_at")
    .maybeSingle();

  if (error && shouldRetryWithoutCommercialStatus(error)) {
    debugAdminSalons("save-retry-without-commercial-status", {
      slug: payload.slug,
      error: error.message,
    });
    ({ data, error } = await writeAccess.client
      .from("salons")
      .upsert(stripCommercialStatus(row), { onConflict: "slug" })
      .select("id,slug,updated_at")
      .maybeSingle());
  }

  if (error) {
    debugAdminSalons("save-failed", {
      slug: payload.slug,
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      rowKeys: Object.keys(row),
    });
    return {
      ok: false,
      error: formatSupabaseError(error),
    };
  }

  logPerfEvent({
    route: "/salons/[id]/edit",
    step: "supabaseUpsert",
    id: payload.id,
    slug: payload.slug,
    ms: Date.now() - startedAt,
    payloadKb,
    imagesCount: payload.galleryImages?.filter((image) => image.isReal).length ?? 0,
    servicesCount: payload.services?.length ?? 0,
    source: "supabase-admin",
  });

  debugAdminSalons("save-success", {
    slug: payload.slug,
    returnedId: (data as SupabaseSalonRow | null)?.id ?? null,
  });

  return {
    ok: true,
    salon: payload,
  };
}

function toAdminTimestamp(value: string | undefined) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function generateUniqueAdminSlug(name: string, currentSlug?: string) {
  const baseSlug = normalizeSlug(name);
  let nextSlug = baseSlug;
  let suffix = 2;

  while (await adminSlugExists(nextSlug, currentSlug)) {
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return nextSlug;
}

async function adminSlugExists(slug: string, currentSlug?: string) {
  if (slug === currentSlug) {
    return false;
  }

  const existing = await getAdminSalonBySlug(slug);

  return existing.ok;
}

function formatSupabaseError(error: {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  return [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" | ");
}

function shouldRetryWithoutCommercialStatus(error: {
  message: string;
  details?: string | null;
}) {
  const combinedMessage = `${error.message} ${error.details ?? ""}`.toLowerCase();

  return combinedMessage.includes("commercial_status");
}

function stripCommercialStatus<
  T extends {
    commercial_status?: unknown;
  },
>(row: T) {
  const fallbackRow = { ...row };

  delete fallbackRow.commercial_status;

  return fallbackRow;
}

function debugAdminSalons(event: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.debug("[admin-salons]", event, payload);
}
