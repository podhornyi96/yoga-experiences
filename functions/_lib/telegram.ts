/**
 * Best-effort Telegram alerts for the teacher.
 * Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in Pages env.
 * If unset, send is a no-op.
 */

export type TelegramEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};

export async function sendTelegramMessage(
  env: TelegramEnv,
  text: string,
): Promise<{ sent: boolean; reason?: string }> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) {
    return { sent: false, reason: "telegram_not_configured" };
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      const reason = `telegram_${res.status}:${body.slice(0, 200)}`;
      console.warn("[telegram] send failed", { reason });
      return { sent: false, reason };
    }
    console.log("[telegram] sent", { chatId });
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send_failed";
    console.warn("[telegram] exception", { message });
    return { sent: false, reason: message };
  }
}
