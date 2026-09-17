/**
 * POST /api/admin/slots/repeat
 * After creating one slot, duplicate it on selected weekdays for N weeks.
 *
 * Body: {
 *   experienceSlug, time: HH:mm, fromDate: YYYY-MM-DD,
 *   weekdays: number[] (ISO Mon=1 … Sun=7), weeks: number
 * }
 *
 * Skips the seed day (already created) and any conflicts; returns a report.
 */

import { isAdminAuthenticated } from "../../../_lib/auth";
import { error, json, readJson } from "../../../_lib/http";
import {
  adminSlot,
  createOpenSlot,
  repeatDatesAfter,
} from "../../../_lib/slots";
import { isScheduledSlug, type Env } from "../../../_lib/types";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!(await isAdminAuthenticated(request, env))) {
    return error("Unauthorized.", 401);
  }
  if (!env.DB) return error("Schedule database is not configured.", 503);

  const body = await readJson<{
    experienceSlug?: string;
    time?: string;
    fromDate?: string;
    weekdays?: number[];
    weeks?: number;
  }>(request);

  const experienceSlug = body?.experienceSlug?.trim() ?? "";
  if (!isScheduledSlug(experienceSlug)) {
    return error("Unsupported experience slug.", 400);
  }

  const time = body?.time?.trim() ?? "";
  const fromDate = body?.fromDate?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{2}:\d{2}$/.test(time)) {
    return error("Provide fromDate as YYYY-MM-DD and time as HH:mm.");
  }

  const weeks = Number(body?.weeks);
  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 26) {
    return error("weeks must be an integer from 1 to 26.");
  }

  const weekdays = (body?.weekdays ?? [])
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
  const uniqueWeekdays = [...new Set(weekdays)];
  if (uniqueWeekdays.length === 0) {
    return error("Select at least one weekday (Mon=1 … Sun=7).");
  }

  const dates = repeatDatesAfter(fromDate, weeks, uniqueWeekdays);
  const created: ReturnType<typeof adminSlot>[] = [];
  const skipped: { day: string; reason: string }[] = [];

  for (const day of dates) {
    const result = await createOpenSlot(env.DB, experienceSlug, day, time);
    if (result.ok) {
      created.push(adminSlot(result.slot));
    } else {
      skipped.push({ day: result.day, reason: result.reason });
    }
  }

  return json({
    created,
    skipped,
    summary: {
      created: created.length,
      skipped: skipped.length,
      weeks,
      weekdays: uniqueWeekdays,
    },
  });
};
