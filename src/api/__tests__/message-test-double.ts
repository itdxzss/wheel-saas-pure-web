interface MessageCall {
  text: unknown;
  params?: unknown;
}

let calls: MessageCall[] = [];

export function resetMessageMock(): void {
  calls = [];
}

export function messageCalls(): MessageCall[] {
  return [...calls];
}

export function message(text: unknown, params?: unknown): { close: () => void } {
  calls.push({ text, params });
  return { close: () => undefined };
}

export function closeAllMessage(): void {
  calls = [];
}
