type SectionHeaderProps = {
  eyebrow?: string;
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
      {eyebrow ? (
        <p className="inline-flex items-center rounded-full border border-[#d8c6af] bg-[#fff9f2] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-normal text-[#9a6b3d]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3.5 font-serif text-[1.72rem] font-semibold leading-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      <p className="mt-2.5 text-[0.95rem] leading-7 text-zinc-600 sm:text-lg sm:leading-8">
        {description}
      </p>
    </div>
  );
}
