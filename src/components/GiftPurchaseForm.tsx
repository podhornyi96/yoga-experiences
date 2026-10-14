"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  formatGiftCode,
  giftPrice,
  giftProductTitle,
  GIFT_PRODUCTS,
  lookupGift,
  normalizeGiftCode,
  startGiftCheckout,
  type GiftProductSlug,
} from "@/lib/gifts";

const fieldClass =
  "mt-1 min-h-12 w-full rounded-lg border border-sand-dark bg-cream px-3 py-3 text-base text-ink outline-none focus:border-clay focus:ring-2 focus:ring-clay/25 sm:text-sm";

function money(amount: number): string {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`;
}

export function GiftPurchaseForm() {
  const [slug, setSlug] = useState<GiftProductSlug>("sunrise-yoga-lisbon");
  const [people, setPeople] = useState<1 | 2>(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [deliverOn, setDeliverOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemBusy, setRedeemBusy] = useState(false);

  const price = giftPrice(slug, people);
  const title = giftProductTitle(slug, people);
  const minDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  async function onBuy(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result = await startGiftCheckout({
      slug,
      people,
      buyerName,
      buyerEmail,
      recipientName,
      recipientEmail,
      message,
      deliverOn,
    });
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    window.location.assign(result.url);
  }

  async function onRedeem(event: FormEvent) {
    event.preventDefault();
    setRedeemError(null);
    const code = normalizeGiftCode(redeemCode);
    if (code.length !== 8) {
      setRedeemError("Enter the 8-character code from the email.");
      return;
    }
    setRedeemBusy(true);
    const result = await lookupGift(code);
    if (!result) {
      setRedeemError("Couldn't check that code. Try again.");
      setRedeemBusy(false);
      return;
    }
    if (result.status === "not_found") {
      setRedeemError("Code not found.");
      setRedeemBusy(false);
      return;
    }
    if (result.status === "redeemed") {
      setRedeemError("This gift has already been used.");
      setRedeemBusy(false);
      return;
    }
    if (result.status === "expired") {
      setRedeemError("This gift has expired.");
      setRedeemBusy(false);
      return;
    }
    const params = new URLSearchParams({ gift: result.code });
    window.location.assign(`${result.pagePath}?${params}`);
  }

  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <form
        onSubmit={(event) => void onBuy(event)}
        className="rounded-2xl border border-sand-dark bg-white p-5 shadow-sm sm:p-6"
      >
        <fieldset>
          <legend className="text-sm font-medium text-ink">People</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {([1, 2] as const).map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={people === count}
                onClick={() => setPeople(count)}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium ${
                  people === count
                    ? "border-clay bg-clay text-cream"
                    : "border-sand-dark bg-cream text-ink hover:border-clay/40"
                }`}
              >
                {count === 1 ? "1 person" : "2 people"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-ink">Experience</legend>
          <div className="mt-2 space-y-2">
            {GIFT_PRODUCTS.map((product) => {
              const selected = slug === product.slug;
              const productTitle = giftProductTitle(product.slug, people);
              return (
                <button
                  key={product.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSlug(product.slug)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left ${
                    selected
                      ? "border-clay bg-white ring-2 ring-clay/30"
                      : "border-sand-dark bg-cream/40 hover:border-clay/40"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-forest">
                      {product.slug === "private-yoga-session"
                        ? productTitle
                        : product.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      {product.summary}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-ink">
                    {money(giftPrice(product.slug, people))}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="buyer-name" className="text-sm font-medium text-ink">
              Your name
            </label>
            <input
              id="buyer-name"
              required
              autoComplete="name"
              value={buyerName}
              onChange={(event) => setBuyerName(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="buyer-email" className="text-sm font-medium text-ink">
              Your email
            </label>
            <input
              id="buyer-email"
              type="email"
              required
              autoComplete="email"
              value={buyerEmail}
              onChange={(event) => setBuyerEmail(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="recipient-name" className="text-sm font-medium text-ink">
              Recipient&apos;s name
            </label>
            <input
              id="recipient-name"
              required
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="recipient-email" className="text-sm font-medium text-ink">
              Recipient&apos;s email
              <span className="font-normal text-muted"> · optional</span>
            </label>
            <input
              id="recipient-email"
              type="email"
              autoComplete="off"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="gift-message" className="text-sm font-medium text-ink">
              Note
              <span className="font-normal text-muted"> · optional</span>
            </label>
            <textarea
              id="gift-message"
              rows={3}
              maxLength={400}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="deliver-on" className="text-sm font-medium text-ink">
              Email the recipient on
              <span className="font-normal text-muted"> · optional</span>
            </label>
            <input
              id="deliver-on"
              type="date"
              min={minDate}
              value={deliverOn}
              onChange={(event) => setDeliverOn(event.target.value)}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-muted">
              A later date sends on that morning, Lisbon time. Today, or an empty
              date, sends right away. You always get the certificate immediately.
            </p>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-clay px-6 py-3.5 text-sm font-semibold text-cream shadow-sm hover:bg-clay-dark disabled:opacity-60"
        >
          {busy ? "Starting checkout…" : `Buy gift · ${money(price)}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          {title} · {people === 1 ? "1 person" : "2 people"}. Valid 3 months,
          non-refundable.{" "}
          <a href="/terms/" className="font-medium text-forest underline-offset-2 hover:underline">
            Terms
          </a>
        </p>
      </form>

      <form
        onSubmit={(event) => void onRedeem(event)}
        className="h-fit rounded-2xl border border-sand-dark bg-white p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-xl text-forest">Have a code?</h2>
        <p className="mt-2 text-sm text-muted">
          Enter it here and you&apos;ll land on the right session to choose a date.
        </p>
        <label htmlFor="redeem-code" className="mt-4 block text-sm font-medium text-ink">
          Gift code
        </label>
        <input
          id="redeem-code"
          value={redeemCode}
          onChange={(event) => setRedeemCode(formatGiftCode(event.target.value))}
          autoComplete="off"
          spellCheck={false}
          placeholder="ABCD-EFGH"
          className={`${fieldClass} font-mono tracking-widest`}
        />
        {redeemError ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {redeemError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={redeemBusy}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-cream hover:bg-forest-deep disabled:opacity-60"
        >
          {redeemBusy ? "Checking…" : "Redeem"}
        </button>
      </form>
    </div>
  );
}
