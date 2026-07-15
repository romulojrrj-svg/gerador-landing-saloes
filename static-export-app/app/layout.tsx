import type { Metadata } from "next";
import "./globals.css";
import { salon } from "../lib/salon";

const canonical = `https://${salon.customDomain}/`;
const description = salon.premiumEditorial.heroDescription || `${salon.name} — atendimento especializado.`;

export const metadata: Metadata = {
  metadataBase: new URL(canonical),
  title: salon.name,
  description,
  alternates: { canonical },
  openGraph: {
    title: salon.name,
    description,
    url: canonical,
    images: [{ url: "/assets/images/og-image.webp", alt: salon.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: salon.name,
    description,
    images: ["/assets/images/og-image.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang={salon.language || "pt-BR"}><body>{children}</body></html>;
}
