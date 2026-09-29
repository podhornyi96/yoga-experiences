/** Guest-facing deposit / reschedule policy — keep UI, FAQ and Terms in sync. */

import { siteConfig } from "@/config/site";
import type { Faq } from "@/data/experiences";

export const RESCHEDULE_NOTICE_HOURS = 48;

/** One-line notice next to deposit amounts before checkout. */
export const DEPOSIT_POLICY_SHORT =
  "Deposit is non-refundable. Reschedule free with 48 hours’ notice.";

/** One-line notice for full prepay (e.g. Sunrise). */
export const FULL_PAY_POLICY_SHORT =
  "Payment is non-refundable. Reschedule free with 48 hours’ notice.";

/** Slightly fuller line for the post-checkout success page. */
export const DEPOSIT_POLICY_SUCCESS =
  "Your payment is non-refundable. Need to change the date? Message us at least 48 hours before the session and we’ll move you to another available time at no extra charge.";

export const DEPOSIT_POLICY_FAQ: Faq = {
  question: "What if I need to cancel or change the date?",
  answer:
    "Online payments (deposit or full prepayment) are non-refundable. If you give at least 48 hours’ notice before the session, you can reschedule to another available date at no extra charge. With less than 48 hours’ notice, or if you don’t show up, the payment is forfeited. Message us on WhatsApp to rearrange.",
};

/** Appends the shared deposit/reschedule FAQ when online deposits are enabled. */
export function withDepositPolicyFaq(faq: Faq[]): Faq[] {
  if (!siteConfig.paymentsEnabled) return faq;
  if (faq.some((item) => item.question === DEPOSIT_POLICY_FAQ.question)) {
    return faq;
  }
  return [...faq, DEPOSIT_POLICY_FAQ];
}
