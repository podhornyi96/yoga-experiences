/** Guest-facing deposit / reschedule policy — keep UI, FAQ and Terms in sync. */

import { siteConfig } from "@/config/site";
import type { Faq } from "@/data/experiences";

export const RESCHEDULE_NOTICE_HOURS = 48;
export const PRIVATE_CANCEL_NOTICE_HOURS = 24;

/** One-line notice next to deposit amounts before checkout. */
export const DEPOSIT_POLICY_SHORT =
  "Deposit is non-refundable. Reschedule free with 48 hours’ notice.";

/** Private / Tandem full-pay cancellation line. */
export const PRIVATE_FULL_PAY_POLICY_SHORT =
  "Free cancellation or reschedule with 24 hours’ notice. Inside 24 hours: no refund.";

/** Slightly fuller line for the post-checkout success page. */
export const DEPOSIT_POLICY_SUCCESS =
  "Your deposit is non-refundable. Need to change the date? Message us at least 48 hours before the session and we’ll move you to another available time at no extra charge.";

export const PRIVATE_FULL_PAY_POLICY_SUCCESS =
  "Need to change or cancel? Message us at least 24 hours before the session for a full refund or reschedule. With less than 24 hours’ notice, refunds and reschedules aren’t available. If weather makes the outdoor spot unsafe, we’ll contact you to reschedule (or refund if you prefer).";

export const DEPOSIT_POLICY_FAQ: Faq = {
  question: "What if I need to cancel or change the date?",
  answer:
    "The online deposit is non-refundable. If you give at least 48 hours’ notice before the session, you can reschedule to another available date at no extra charge. With less than 48 hours’ notice, or if you don’t show up, the deposit is forfeited. Message us on WhatsApp to rearrange.",
};

export const PRIVATE_FULL_PAY_POLICY_FAQ: Faq = {
  question: "What if I need to cancel or change the date?",
  answer:
    "Cancel or reschedule free of charge with at least 24 hours’ notice (full refund or a new date via WhatsApp/email). With less than 24 hours’ notice, refunds and reschedules aren’t available. If weather makes the outdoor park unsafe, we’ll contact you to reschedule or refund.",
};

/** Appends the shared deposit/reschedule FAQ when online deposits are enabled. */
export function withDepositPolicyFaq(faq: Faq[]): Faq[] {
  if (!siteConfig.paymentsEnabled) return faq;
  if (faq.some((item) => item.question === DEPOSIT_POLICY_FAQ.question)) {
    return faq;
  }
  return [...faq, DEPOSIT_POLICY_FAQ];
}

export function withPrivateBookingPolicyFaq(faq: Faq[]): Faq[] {
  if (!siteConfig.paymentsEnabled) return faq;
  if (
    faq.some((item) => item.question === PRIVATE_FULL_PAY_POLICY_FAQ.question)
  ) {
    return faq;
  }
  return [...faq, PRIVATE_FULL_PAY_POLICY_FAQ];
}
