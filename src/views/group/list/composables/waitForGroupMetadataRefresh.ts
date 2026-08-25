import type { GroupDetail } from "@/api/group";

interface WaitForGroupMetadataRefreshOptions {
  previousSyncedAt: number | null;
  isCurrent: () => boolean;
  load: () => Promise<GroupDetail>;
  onProgress?: (detail: GroupDetail) => void;
  maxAttempts?: number;
  intervalMs?: number;
}

export async function waitForGroupMetadataRefresh(
  options: WaitForGroupMetadataRefreshOptions
): Promise<GroupDetail | null> {
  const maxAttempts = options.maxAttempts ?? 2;
  const intervalMs = options.intervalMs ?? 3000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    if (!options.isCurrent()) return null;
    const loaded = await options.load();
    if (!options.isCurrent()) return null;
    options.onProgress?.(loaded);
    if (
      loaded.metadataSyncStatus === "FAILED" ||
      loaded.metadataSyncStatus === "DEFERRED"
    ) {
      throw new Error(
        loaded.metadataSyncError ||
          (loaded.metadataSyncStatus === "DEFERRED"
            ? "群信息同步已延期"
            : "群信息同步失败")
      );
    }
    if (
      loaded.metadataSyncStatus === "SUCCEEDED" &&
      loaded.metadataSyncedAt != null &&
      loaded.metadataSyncedAt !== options.previousSyncedAt
    ) {
      return loaded;
    }
  }
  return null;
}
