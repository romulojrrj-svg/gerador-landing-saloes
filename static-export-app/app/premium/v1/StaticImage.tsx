import type { StaticAsset } from "../../../lib/types";

export function StaticImage({
  image,
  alt,
  className,
  sizes,
  priority = false,
}: {
  image: StaticAsset;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}
