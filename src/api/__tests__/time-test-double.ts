const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

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
  const date = new Date(value + BEIJING_OFFSET_MS);
  return [
    date.getUTCFullYear(),
    "-",
    pad(date.getUTCMonth() + 1),
    "-",
    pad(date.getUTCDate()),
    " ",
    pad(date.getUTCHours()),
    ":",
    pad(date.getUTCMinutes()),
    ":",
    pad(date.getUTCSeconds())
  ].join("");
}
