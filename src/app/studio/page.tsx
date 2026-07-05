import type { Metadata } from "next";
import { InternalStudioHome } from "@/components/studio/InternalStudioHome";

export const metadata: Metadata = {
  title: "Studio interno | Salon Landing Generator",
  description: "Área interna para operação do fluxo de criação de páginas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioPage() {
  return <InternalStudioHome />;
}
