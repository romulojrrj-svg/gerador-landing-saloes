import "server-only";

import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapSupabaseRowToSalon,
  type SupabaseSalonRow,
} from "@/lib/supabase/salon-mapper";
import type { Salon } from "@/types/salon";

export async function getPublicSalonBySlugServer(slug: string) {
  if (isServerLocalStorageEnabled()) {
    return {
      checked: false,
      salon: null,
    };
  }

  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      checked: false,
      salon: null,
      error: "Cliente publico do salao indisponivel no servidor.",
    };
  }

  const { data, error } = await client
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[public-salon-server] fetch failed", {
        slug,
        error: error.message,
      });
    }

    return {
      checked: false,
      salon: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      checked: true,
      salon: null,
    };
  }

  const salon = mapSupabaseRowToSalon(data as SupabaseSalonRow);

  return {
    checked: true,
    salon: salon satisfies Salon,
  };
}
