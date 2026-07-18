interface ApiErrorData {
  message?: unknown;
}

interface ApiErrorLike {
  message?: unknown;
  response?: {
    data?: ApiErrorData;
  };
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as ApiErrorLike | undefined)?.response?.data;
  const message = data?.message ?? (error as ApiErrorLike)?.message;
  return typeof message === "string" && message.trim()
    ? message.trim()
    : fallback;
}
