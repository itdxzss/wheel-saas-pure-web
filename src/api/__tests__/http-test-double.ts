interface HttpCall {
  method: string;
  url: string;
  opts?: unknown;
  configKeys?: string[];
}

let response: unknown;
let responseHeaders: Record<string, string> = {};
let calls: HttpCall[] = [];

interface HttpResponseLike {
  headers: Record<string, string>;
  config: Record<string, unknown>;
  data: unknown;
}

interface HttpConfigLike {
  beforeResponseCallback?: (response: HttpResponseLike) => void;
}

export function resetHttpMock(
  nextResponse: unknown,
  nextHeaders: Record<string, string> = {}
): void {
  response = nextResponse;
  responseHeaders = nextHeaders;
  calls = [];
}

export function httpCalls(): HttpCall[] {
  return [...calls];
}

export const http = {
  async request<T>(
    method: string,
    url: string,
    opts?: unknown,
    config?: HttpConfigLike
  ): Promise<T> {
    const call: HttpCall = { method, url, opts };
    if (config) {
      call.configKeys = Object.keys(config);
    }
    calls.push(call);
    config?.beforeResponseCallback?.({
      headers: responseHeaders,
      config: {},
      data: response
    });
    return response as T;
  }
};
