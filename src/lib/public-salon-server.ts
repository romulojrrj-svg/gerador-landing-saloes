import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  mapSupabaseRowToSalon,
  type SupabaseSalonRow,
} from "@/lib/supabase/salon-mapper";
import type { Salon } from "@/types/salon";

export async function getPublicSalonBySlugServer(slug: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      checked: false,
      salon: null,
    };
  }

  const { data, error } = await client
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return {
      checked: true,
      salon: null,
    };
  }

  const salon = mapSupabaseRowToSalon(data as SupabaseSalonRow);

  if (salon.status !== "published") {
    return {
      checked: true,
      salon: null,
    };
  }

  return {
    checked: true,
    salon: salon satisfies Salon,
  };
}
