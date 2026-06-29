interface ArmadaCall {
  method: string;
  url: string;
  opts?: unknown;
}

let response: unknown;
let calls: ArmadaCall[] = [];

export function resetArmadaMock(nextResponse: unknown): void {
  response = nextResponse;
  calls = [];
}

export function armadaCalls(): ArmadaCall[] {
  return [...calls];
}

export async function armadaRequest<T>(
  method: string,
  url: string,
  opts?: unknown
): Promise<T> {
  calls.push({ method, url, opts });
  return response as T;
}
