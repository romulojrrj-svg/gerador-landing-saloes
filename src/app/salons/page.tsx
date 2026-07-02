import type { Metadata } from "next";
import { SalonsDashboardClient } from "./SalonsDashboardClient";

export const metadata: Metadata = {
  title: "Salões salvos | Salon Landing Generator",
  description: "Painel local de salões cadastrados no gerador.",
};

export default function SalonsPage() {
  return <SalonsDashboardClient />;
}
