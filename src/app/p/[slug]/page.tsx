import type { Metadata } from "next";
import { PublicLandingClient } from "./PublicLandingClient";
import { getPublicSalonBySlugServer } from "@/lib/public-salon-server";

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

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      title,
      description,
    },
  };
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
