import type { IconifyIcon } from "@iconify/vue/offline";
import flagpack from "@iconify/json/json/flagpack.json";

interface FlagIconCollection {
  width?: number;
  height?: number;
  icons: Record<string, IconifyIcon>;
}

const flagIconCollection = flagpack as unknown as FlagIconCollection;
const flagIconCache = new Map<string, IconifyIcon>();

export function countryFlagIcon(code?: string): IconifyIcon | undefined {
  const normalizedCode = code?.trim().toLowerCase() ?? "";
  if (!normalizedCode) return undefined;
  const cached = flagIconCache.get(normalizedCode);
  if (cached) return cached;
  const source = flagIconCollection.icons[normalizedCode];
  if (!source) return undefined;
  const icon: IconifyIcon = {
    ...source,
    width: source.width ?? flagIconCollection.width ?? 32,
    height: source.height ?? flagIconCollection.height ?? 24
  };
  flagIconCache.set(normalizedCode, icon);
  return icon;
}
