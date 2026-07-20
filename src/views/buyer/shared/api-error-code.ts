function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

export function hasBuyerApiErrorCode(
  error: unknown,
  expected: string
): boolean {
  const pending: unknown[] = [error];
  const visited = new Set<object>();
  while (pending.length > 0) {
    const record = asRecord(pending.shift());
    if (!record || visited.has(record)) continue;
    visited.add(record);
    if (
      [record.errorCode, record.code, record.message].some(
        value => value === expected
      )
    ) {
      return true;
    }
    pending.push(record.response, record.data, record.error);
  }
  return false;
}
