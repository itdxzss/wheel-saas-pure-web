export interface AuthSessionSnapshot {
  accessToken?: string;
  expires?: number;
}

/** 登录标识、用户身份和未过期 Token 必须同时存在，才允许进入业务路由。 */
export function hasValidAuthSession(
  session: AuthSessionSnapshot | null | undefined,
  hasLoginMarker: boolean,
  hasUserIdentity: boolean,
  now = Date.now()
): boolean {
  return Boolean(
    hasLoginMarker &&
      hasUserIdentity &&
      session?.accessToken &&
      Number(session.expires) > now
  );
}

/** 只有认证失效才重新登录；403 是已认证用户的授权拒绝。 */
export function isUnauthorizedHttpStatus(status?: number): boolean {
  return status === 401;
}

/** 当前登录身份失效的业务码；授权拒绝必须留在当前页面展示。 */
export function isUnauthorizedBusinessCode(code?: number): boolean {
  return code === 40101 || code === 40104;
}
