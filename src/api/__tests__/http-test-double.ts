interface HttpCall {
  method: string;
  url: string;
  opts?: unknown;
}

let response: unknown;
let calls: HttpCall[] = [];

export function resetHttpMock(nextResponse: unknown): void {
  response = nextResponse;
  calls = [];
}

export function httpCalls(): HttpCall[] {
  return [...calls];
}

export const http = {
  async request<T>(method: string, url: string, opts?: unknown): Promise<T> {
    calls.push({ method, url, opts });
    return response as T;
  }
};
