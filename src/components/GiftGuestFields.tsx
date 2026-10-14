"use client";

export function GiftGuestFields({
  name,
  email,
  onName,
  onEmail,
}: {
  name: string;
  email: string;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
}) {
  return (
    <div className="mb-3 space-y-3">
      <div>
        <label htmlFor="gift-guest-name" className="text-sm font-medium text-ink">
          Your name
        </label>
        <input
          id="gift-guest-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => onName(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border border-sand-dark bg-cream px-3 py-3 text-base text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="gift-guest-email" className="text-sm font-medium text-ink">
          Email for confirmation
        </label>
        <input
          id="gift-guest-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmail(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border border-sand-dark bg-cream px-3 py-3 text-base text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25 sm:text-sm"
        />
      </div>
    </div>
  );
}
