"use client";

import Link from "next/link";

export function AdminNav({
  active,
  onLogout,
}: {
  active: "schedule" | "bookings";
  onLogout: () => void;
}) {
  const link = (href: string, key: typeof active, label: string) => (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        active === key
          ? "bg-forest text-cream"
          : "border border-sand-dark text-ink hover:bg-sand"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {link("/admin/", "schedule", "Schedule")}
      {link("/admin/bookings/", "bookings", "Bookings")}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-full border border-sand-dark px-4 py-2 text-sm font-medium text-ink hover:bg-sand"
      >
        Sign out
      </button>
    </div>
  );
}
