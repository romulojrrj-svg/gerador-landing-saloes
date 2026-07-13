import type { Metadata } from "next";
import { PublicLandingClient } from "./PublicLandingClient";
import { getPublicSalonBySlugServer } from "@/lib/public-salon-server";
import { headers } from "next/headers";
import { isCustomDomainForSalon, normalizeCustomDomain } from "@/lib/custom-domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicSalonBySlugServer(slug);
  const salon = result.salon;

  if (!salon) {
    return {
      title: "Landing do salao",
      description: `Landing publica preparada para ${slug}.`,
    };
  }

  const title = salon.name;
  const description =
    salon.description?.trim() ||
    `Landing publica preparada para ${salon.name}.`;

  const requestHeaders = await headers();
  const canonicalUrl = getCanonicalUrl(requestHeaders, salon, slug);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      title,
      description,
    },
  };
}

function getCanonicalUrl(
  requestHeaders: Headers,
  salon: NonNullable<Awaited<ReturnType<typeof getPublicSalonBySlugServer>>["salon"]>,
  slug: string,
) {
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0].trim();

  if (isCustomDomainForSalon(requestHost, salon.customDomain)) {
    return `https://${normalizeCustomDomain(salon.customDomain)}/`;
  }

  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const host = requestHost || "localhost:3000";
  const protocol = forwardedProtocol || (process.env.NODE_ENV === "production" ? "https" : "http");
  const origin = configuredOrigin || `${protocol}://${host}`;

  return `${origin}/p/${slug}`;
}

export default async function PublicSalonPage({ params }: PublicPageProps) {
  const { slug } = await params;
  const initialResult = await getPublicSalonBySlugServer(slug);

  return (
    <PublicLandingClient
      slug={slug}
      initialSalon={initialResult.salon}
      skipClientLoad={initialResult.checked}
    />
  );
}
