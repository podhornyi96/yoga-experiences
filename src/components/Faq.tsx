import type { Faq as FaqItem } from "@/data/experiences";

export function Faq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-sand-dark rounded-2xl border border-sand-dark bg-white">
      {items.map((item) => (
        <details key={item.question} className="group p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-forest">
            {item.question}
            <span className="text-clay-dark transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
