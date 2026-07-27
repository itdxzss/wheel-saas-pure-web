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

/** 认证失败或权限不足都按产品要求重新登录。 */
export function isUnauthorizedHttpStatus(status?: number): boolean {
  return status === 401 || status === 403;
}

/** 当前登录身份相关的业务拒绝码；不包含登录表单失败及业务账号自身权限码。 */
export function isUnauthorizedBusinessCode(code?: number): boolean {
  return code === 40101 || code === 40104 || code === 40302;
}
