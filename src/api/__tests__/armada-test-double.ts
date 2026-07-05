interface ArmadaCall {
  method: string;
  url: string;
  opts?: unknown;
  config?: unknown;
}

let response: unknown;
let queuedResponses: unknown[] = [];
let calls: ArmadaCall[] = [];

export function resetArmadaMock(nextResponse: unknown): void {
  response = nextResponse;
  queuedResponses = [];
  calls = [];
}

export function resetArmadaMockQueue(nextResponses: unknown[]): void {
  response = undefined;
  queuedResponses = [...nextResponses];
  calls = [];
}

export function armadaCalls(): ArmadaCall[] {
  return [...calls];
}

export async function armadaRequest<T>(
  method: string,
  url: string,
  opts?: unknown,
  config?: unknown
): Promise<T> {
  const call: ArmadaCall = { method, url, opts };
  if (config !== undefined) {
    call.config = config;
  }
  calls.push(call);
  if (queuedResponses.length > 0) {
    return queuedResponses.shift() as T;
  }
  return response as T;
}
