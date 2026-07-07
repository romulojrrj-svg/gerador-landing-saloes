import "server-only";

import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import { logPerfEvent } from "@/lib/perf-logs";
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

  const startedAt = Date.now();
  const { data, error } = await client
    .from("salons")
    .select(
      "id,slug,name,status,commercial_status,language,country,city,address,description,headline,subheadline,booking_url,whatsapp,phone,website_url,instagram_url,google_maps_url,business_hours,notes,created_at,updated_at,services,real_images,real_reviews,copy_suggestions,copy_history,generated_copy,source_profile,social_links,cta,seo,metadata",
    )
    .eq("slug", slug)
    .maybeSingle();

  logPerfEvent({
    route: "/p/[slug]",
    step: "fetchPublicSalon",
    ms: Date.now() - startedAt,
    slug,
    source: "supabase-admin",
  });

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
