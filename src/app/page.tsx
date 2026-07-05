import type { Metadata } from "next";
import { PublicHome } from "@/components/marketing/PublicHome";

export const metadata: Metadata = {
  title: "Páginas profissionais para salões e negócios locais",
  description:
    "Prévia personalizada sem compromisso para salões, barbearias, spas e negócios locais com foco em WhatsApp, localização e presença digital.",
};

export default function Home() {
  return <PublicHome />;
}
