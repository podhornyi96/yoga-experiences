"use client";

import type { SlotTimeScope } from "@/lib/admin-client";

type Props = {
  value: SlotTimeScope;
  onChange: (value: SlotTimeScope) => void;
  upcomingCount: number;
  pastCount: number;
};

export function AdminSlotTimeScope({
  value,
  onChange,
  upcomingCount,
  pastCount,
}: Props) {
  const btn = (scope: SlotTimeScope, label: string, count: number) => {
    const active = value === scope;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => onChange(scope)}
        className={
          active
            ? "rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream"
            : "rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
        }
      >
        {label}
        <span className={active ? "ml-1.5 opacity-80" : "ml-1.5 text-muted"}>
          {count}
        </span>
      </button>
    );
  };

  return (
    <div
      role="tablist"
      aria-label="Slot time scope"
      className="inline-flex rounded-full border border-sand-dark bg-white p-1"
    >
      {btn("upcoming", "Upcoming", upcomingCount)}
      {btn("past", "Past", pastCount)}
    </div>
  );
}
