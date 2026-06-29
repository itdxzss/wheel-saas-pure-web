import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const BEIJING_UTC_OFFSET_MINUTES = 8 * 60;

export function formatEpochMillis(value?: number | null): string;
export function formatEpochMillis(
  value: number | null | undefined,
  fallback: null
): string | null;
export function formatEpochMillis(
  value: number | null | undefined,
  fallback: string
): string;
export function formatEpochMillis(
  value?: number | null,
  fallback: string | null = "-"
): string | null {
  if (value == null || !Number.isFinite(value)) return fallback;
  return dayjs(value)
    .utcOffset(BEIJING_UTC_OFFSET_MINUTES)
    .format("YYYY-MM-DD HH:mm:ss");
}
