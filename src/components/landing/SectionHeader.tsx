type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={
        align === "center"
          ? "mx-auto max-w-3xl text-center"
          : "max-w-3xl text-left"
      }
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-semibold text-zinc-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-zinc-600 sm:text-lg">
        {description}
      </p>
    </div>
  );
}
