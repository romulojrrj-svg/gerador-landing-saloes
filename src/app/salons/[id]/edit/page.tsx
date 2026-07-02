import type { Metadata } from "next";
import { SalonEditClient } from "./SalonEditClient";

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Editar salão - ${id}`,
    description: "Edite os dados salvos localmente para atualizar a prévia.",
  };
}

export default async function SalonEditPage({ params }: EditPageProps) {
  const { id } = await params;

  return <SalonEditClient slug={id} />;
}
