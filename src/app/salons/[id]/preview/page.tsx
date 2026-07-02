import type { Metadata } from "next";
import { mockSalon } from "@/data/mockSalon";
import { SalonPreviewClient } from "./SalonPreviewClient";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: "Prévia da landing | Salon Landing Generator",
    description: `Prévia interna da landing page para ${id}.`,
  };
}

export default async function SalonPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const fallbackSalon = {
    ...mockSalon,
    id,
    slug: id,
  };

  return <SalonPreviewClient fallbackSalon={fallbackSalon} slug={id} />;
}
