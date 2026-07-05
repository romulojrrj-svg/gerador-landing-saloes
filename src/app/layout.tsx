import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Páginas profissionais para salões e negócios locais",
  description:
    "Prévia personalizada de páginas profissionais para salões, barbearias, spas e negócios locais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
