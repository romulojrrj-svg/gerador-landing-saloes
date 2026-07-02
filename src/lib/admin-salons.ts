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
import type { Salon, SalonFormInput } from "@/types/salon";

type AdminSalonResult =
  | { ok: true; salon: Salon }
  | { ok: false; error: string };

type AdminSalonListResult =
  | { ok: true; salons: Salon[] }
  | { ok: false; error: string; salons: Salon[] };

export async function listAdminSalons(): Promise<AdminSalonListResult> {
  const client = getConfiguredAdminClient();

  if (!client.ok) {
    return {
      ok: false,
      error: client.error,
      salons: [],
    };
  }

  const { data, error } = await client.client
    .from("salons")
    .select("*")
    .order("updated_at", { ascending: false });

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

  const { data, error } = await client.client
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

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

export async function upsertAdminSalon(salon: Salon): Promise<AdminSalonResult> {
  return saveAdminSalon(salon);
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

async function saveAdminSalon(salon: Salon): Promise<AdminSalonResult> {
  const writeAccess = getConfiguredAdminClient({ requireWrite: true });

  if (!writeAccess.ok) {
    return {
      ok: false,
      error: writeAccess.error,
    };
  }

  const payload = ensureCompleteSalon({
    ...salon,
    updatedAt: new Date().toISOString(),
  });
  const row = mapSalonToSupabaseRow(payload);
  debugAdminSalons("save-start", {
    slug: payload.slug,
    name: payload.name,
    status: payload.status,
    hasInstagram: Boolean(payload.instagramUrl),
    hasGoogleMaps: Boolean(payload.googleMapsUrl),
    servicesCount: payload.services?.length ?? 0,
    imagesCount: payload.galleryImages?.length ?? 0,
    reviewsCount: payload.testimonials?.length ?? 0,
    writeMode: process.env.NEXT_PUBLIC_SUPABASE_WRITE_MODE ?? "disabled",
  });
  const { data, error } = await writeAccess.client
    .from("salons")
    .upsert(row, { onConflict: "slug" })
    .select("*")
    .single();

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

  debugAdminSalons("save-success", {
    slug: payload.slug,
    returnedId: (data as SupabaseSalonRow | null)?.id ?? null,
  });

  return {
    ok: true,
    salon: mapSupabaseRowToSalon(data as SupabaseSalonRow),
  };
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

function debugAdminSalons(event: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.debug("[admin-salons]", event, payload);
}
