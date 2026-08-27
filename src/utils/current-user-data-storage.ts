import { storageLocal } from "@pureadmin/utils";
import { buildUserDataStorageKey } from "./user-data-storage-key";

export const USER_INFO_STORAGE_KEY = "user-info";

interface StoredUserIdentity {
  tenantId?: number;
  userId?: number;
}

/** 返回当前可信登录身份专属的浏览器缓存键；身份缺失时失败关闭。 */
export function currentUserDataStorageKey(baseKey: string): string | null {
  const identity = storageLocal().getItem<StoredUserIdentity>(
    USER_INFO_STORAGE_KEY
  );
  return buildUserDataStorageKey(baseKey, identity);
}
