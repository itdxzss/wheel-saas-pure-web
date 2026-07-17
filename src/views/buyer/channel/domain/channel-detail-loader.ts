export interface ChannelDetailLoadHandlers<T> {
  resolved: (detail: T) => void;
  rejected?: (error: unknown) => void;
  settled?: () => void;
}

export function createChannelDetailLoader<T>(
  request: (id: number) => Promise<T>
) {
  let sequence = 0;

  function invalidate(): void {
    sequence += 1;
  }

  async function load(
    id: number,
    handlers: ChannelDetailLoadHandlers<T>
  ): Promise<void> {
    const current = ++sequence;
    try {
      const detail = await request(id);
      if (current === sequence) handlers.resolved(detail);
    } catch (error) {
      if (current === sequence) handlers.rejected?.(error);
    } finally {
      if (current === sequence) handlers.settled?.();
    }
  }

  return { invalidate, load };
}
