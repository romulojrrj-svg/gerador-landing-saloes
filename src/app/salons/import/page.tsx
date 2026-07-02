import type { Metadata } from "next";
import { SalonsImportClient } from "./SalonsImportClient";

export const metadata: Metadata = {
  title: "Importar planilha | Salon Landing Generator",
  description: "Importe CSV, XLSX ou XLS do Outscraper para criar saloes em rascunho.",
};

export default function SalonsImportPage() {
  return <SalonsImportClient />;
}
