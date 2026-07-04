interface MessageCall {
  type: string;
  text: unknown;
}

let calls: MessageCall[] = [];

export function resetElementPlusMock(): void {
  calls = [];
}

export function elementPlusCalls(): MessageCall[] {
  return [...calls];
}

export const ElMessage = {
  error(text: unknown): void {
    calls.push({ type: "error", text });
  },
  success(text: unknown): void {
    calls.push({ type: "success", text });
  },
  warning(text: unknown): void {
    calls.push({ type: "warning", text });
  }
};

export const ElMessageBox = {
  confirm(): Promise<void> {
    return Promise.resolve();
  }
};
