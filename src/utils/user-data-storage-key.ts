export interface UserDataStorageIdentity {
  tenantId?: number;
  userId?: number;
}

/** 私有业务缓存必须同时绑定可信租户和用户；身份不完整时禁止持久化。 */
export function buildUserDataStorageKey(
  baseKey: string,
  identity: UserDataStorageIdentity | null | undefined
): string | null {
  const tenantId = identity?.tenantId;
  const userId = identity?.userId;
  if (
    !baseKey ||
    !Number.isSafeInteger(tenantId) ||
    Number(tenantId) <= 0 ||
    !Number.isSafeInteger(userId) ||
    Number(userId) <= 0
  ) {
    return null;
  }
  return `${baseKey}:tenant-${tenantId}:user-${userId}`;
}
