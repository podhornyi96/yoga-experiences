import { ReactNode } from "react";
import { Container } from "./Container";

export function Section({
  children,
  className = "",
  containerClassName = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-16 sm:py-24 ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  as: HeadingTag = "h2",
  id,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
  id?: string;
  /** Tighter heading for viewport-fit layouts (e.g. experiences on desktop). */
  compact?: boolean;
}) {
  const alignment =
    align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow ? (
        <p
          className={`font-semibold uppercase tracking-[0.18em] text-sage-dark ${
            compact
              ? "mb-2 text-xs lg:mb-1.5"
              : "mb-3 text-sm"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <HeadingTag
        id={id}
        className={`text-forest ${
          compact
            ? "text-2xl sm:text-3xl lg:text-[1.75rem] lg:leading-snug"
            : "text-3xl sm:text-4xl"
        }`}
      >
        {title}
      </HeadingTag>
      {description ? (
        <p
          className={`text-muted ${
            compact
              ? "mt-2 text-sm leading-relaxed lg:mt-1.5 lg:line-clamp-2 lg:text-[0.9375rem]"
              : "mt-4 text-lg leading-relaxed"
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
