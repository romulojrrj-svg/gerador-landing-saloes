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

  return {
    title: "Landing do salão",
    description: `Landing pública preparada para ${slug}.`,
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
