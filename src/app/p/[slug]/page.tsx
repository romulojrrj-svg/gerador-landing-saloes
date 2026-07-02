import type { Metadata } from "next";
import { PublicLandingClient } from "./PublicLandingClient";

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

  return <PublicLandingClient slug={slug} />;
}
