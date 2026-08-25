interface ApiFailureCandidate {
  url: string;
  status: number | null;
  businessCode?: number;
}

function pathname(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.pathname : null;
  } catch {
    return null;
  }
}

/** Smoke 只允许读取；唯一写例外是精确的登录 POST。 */
export function isAllowedSmokeRequest(method: string, rawUrl: string): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  return method === "POST" && pathname(rawUrl) === "/api/public/auth/login";
}

export function apiFailures<T extends ApiFailureCandidate>(
  records: readonly T[]
): T[] {
  return records.filter(record => {
    return (
      record.url.startsWith("/api/") &&
      (record.status === null ||
        record.status >= 400 ||
        (typeof record.businessCode === "number" && record.businessCode !== 0))
    );
  });
}
