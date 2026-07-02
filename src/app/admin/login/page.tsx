import type { Metadata } from "next";
import { isAdminPasswordConfigured } from "@/lib/admin-auth";
import { AdminLoginClient } from "./AdminLoginClient";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata: Metadata = {
  title: "Acesso interno | Salon Landing Generator",
  description: "Acesso protegido para o painel interno do gerador.",
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <AdminLoginClient
      nextPath={params.next}
      passwordConfigured={isAdminPasswordConfigured()}
    />
  );
}
