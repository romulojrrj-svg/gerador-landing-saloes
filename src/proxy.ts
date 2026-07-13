import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import { normalizeCustomDomain } from "@/lib/custom-domain";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { listDevSharedSalons } from "@/lib/dev-shared-salon-storage";

const resolveSupabaseCustomDomain = unstable_cache(
  async (domain: string) => {
    const client = getSupabaseAdminClient();

    if (!client) {
      return null;
    }

    const { data, error } = await client
      .from("salons")
      .select("slug,status")
      .eq("status", "published")
      .filter("metadata->>customDomain", "eq", domain)
      .limit(1)
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[custom-domain] resolution failed", {
          domain,
          error: error.message,
        });
      }

      return null;
    }

    return data?.slug ?? null;
  },
  ["published-salon-custom-domain"],
  { revalidate: 60 },
);

export async function proxy(request: NextRequest) {
  const host = getRequestHost(request);

  if (isDefaultHost(host) || request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const domain = normalizeCustomDomain(host);

  if (!domain) {
    return NextResponse.next();
  }

  const slug = await resolveSalonSlug(domain);

  if (!slug) {
    return NextResponse.next();
  }

  const rewrittenUrl = request.nextUrl.clone();
  rewrittenUrl.pathname = `/p/${slug}`;

  return NextResponse.rewrite(rewrittenUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};

async function resolveSalonSlug(domain: string) {
  if (isServerLocalStorageEnabled()) {
    const salons = await listDevSharedSalons();
    const salon = salons.find(
      (candidate) =>
        candidate.status === "published" &&
        normalizeCustomDomain(candidate.customDomain) === domain,
    );

    return salon?.slug ?? null;
  }

  return resolveSupabaseCustomDomain(domain);
}

function isDefaultHost(host: string) {
  const normalizedHost = host.toLowerCase().replace(/^www\./, "");
  const configuredSiteHost = normalizeCustomDomain(process.env.NEXT_PUBLIC_SITE_URL);
  const configuredVercelHost = normalizeCustomDomain(process.env.VERCEL_URL);
  const isConfiguredVercelHost = (value: string | null) =>
    Boolean(value?.endsWith(".vercel.app"));

  return (
    normalizedHost === "localhost" ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost === "::1" ||
    normalizedHost.endsWith(".vercel.app") ||
    (isConfiguredVercelHost(configuredSiteHost) && normalizedHost === configuredSiteHost) ||
    (isConfiguredVercelHost(configuredVercelHost) && normalizedHost === configuredVercelHost)
  );
}

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = forwardedHost ?? request.headers.get("host");
  const rawHost = hostHeader?.split(",", 1)[0]?.trim() ?? request.nextUrl.hostname;

  return rawHost.replace(/^\[/, "").replace(/\]$/, "").replace(/:\d+$/, "");
}
