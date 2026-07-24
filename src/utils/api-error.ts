interface ApiErrorData {
  message?: unknown;
}

interface ApiErrorLike {
  code?: unknown;
  message?: unknown;
  response?: {
    data?: ApiErrorData;
  };
}

/**
 * 判断请求是否在客户端超时。
 *
 * 超时只能说明前端没有等到响应，不能据此判定后端执行失败。
 */
export function isRequestTimeout(error: unknown): boolean {
  const candidate = error as ApiErrorLike | undefined;
  if (candidate?.code === "ECONNABORTED" || candidate?.code === "ETIMEDOUT") {
    return true;
  }
  return (
    typeof candidate?.message === "string" &&
    /(?:timeout|timed out)/i.test(candidate.message)
  );
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as ApiErrorLike | undefined)?.response?.data;
  const message = data?.message ?? (error as ApiErrorLike)?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}
