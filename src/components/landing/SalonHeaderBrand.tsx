"use client";

import { useState } from "react";
import Image from "next/image";

type SalonHeaderBrandProps = {
  salonName: string;
  horizontalLogoUrl?: string | null;
  logoAlt?: string;
  className?: string;
  priority?: boolean;
};

export function SalonHeaderBrand({
  salonName,
  horizontalLogoUrl,
  logoAlt,
  className = "",
  priority = false,
}: SalonHeaderBrandProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const logoUrl = cleanHeaderLogoUrl(horizontalLogoUrl);
  const showLogo = Boolean(logoUrl && failedUrl !== logoUrl);

  return (
    <a
      href="#top"
      className={`flex min-w-0 items-center ${className}`.trim()}
      aria-label={salonName}
    >
      {showLogo ? (
        <span
          className="relative block"
          style={{
            width: "clamp(210px, 66vw, 390px)",
            maxWidth: "calc(100% - 64px)",
            height: "clamp(40px, 8vw, 68px)",
          }}
        >
          {logoUrl.endsWith(".svg") ? (
            <img
              src={logoUrl}
              alt={logoAlt || `${salonName} - logo`}
              className="h-full w-full object-contain object-left"
              loading={priority ? "eager" : "lazy"}
              onError={() => setFailedUrl(logoUrl)}
            />
          ) : (
            <Image
              src={logoUrl}
              alt={logoAlt || `${salonName} - logo`}
              fill
              priority={priority}
              sizes="(max-width: 430px) 235px, (max-width: 768px) 285px, (max-width: 1024px) 340px, 390px"
              className="object-contain object-left"
              onError={() => setFailedUrl(logoUrl)}
            />
          )}
        </span>
      ) : (
        <span className="truncate font-serif text-lg font-semibold tracking-tight sm:text-xl">
          {salonName}
        </span>
      )}
    </a>
  );
}

function cleanHeaderLogoUrl(value?: string | null) {
  const nextValue = value?.trim();

  if (
    !nextValue ||
    nextValue.startsWith("blob:") ||
    nextValue.startsWith("data:") ||
    nextValue.startsWith("file:") ||
    nextValue.startsWith("http://localhost") ||
    nextValue.startsWith("http://127.0.0.1")
  ) {
    return "";
  }

  return nextValue;
}
