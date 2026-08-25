export interface LoginCredentials {
  username: string;
  password: string;
}

function isLoopbackBaseUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const hostname = new URL(raw).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

/**
 * 远程环境强制从环境变量取凭据；旧的本地 compose E2E 可显式提供 fixture 默认值。
 * 这样 staging 不会意外复用本地账号，同时无需修改后端启动脚本。
 */
export function resolveLoginCredentials(
  localDefaults?: LoginCredentials
): LoginCredentials {
  const allowLocalDefaults =
    Boolean(localDefaults) &&
    isLoopbackBaseUrl(process.env.ARMADA_E2E_BASE_URL);
  const username =
    process.env.ARMADA_E2E_USERNAME?.trim() ||
    (allowLocalDefaults ? localDefaults?.username : undefined);
  const password =
    process.env.ARMADA_E2E_PASSWORD?.trim() ||
    (allowLocalDefaults ? localDefaults?.password : undefined);

  const missing = [
    !username ? "ARMADA_E2E_USERNAME" : null,
    !password ? "ARMADA_E2E_PASSWORD" : null
  ].filter((name): name is string => Boolean(name));
  if (missing.length > 0) {
    throw new Error(`缺少必需环境变量 ${missing.join("、")}`);
  }
  return { username, password };
}
