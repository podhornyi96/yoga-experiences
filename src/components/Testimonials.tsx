import { testimonials } from "@/data/testimonials";

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {testimonials.map((t) => (
        <figure
          key={t.name}
          className="flex flex-col rounded-2xl border border-sand-dark bg-white p-7 shadow-sm"
        >
          <blockquote className="flex-1 text-base leading-relaxed text-ink">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-5 border-t border-sand pt-4">
            <span className="block font-semibold text-forest">{t.name}</span>
            <span className="text-sm text-muted">{t.role}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
