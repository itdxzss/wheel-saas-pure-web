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
  const maxAttempts = options.maxAttempts ?? 15;
  const intervalMs = options.intervalMs ?? 2000;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    if (!options.isCurrent()) return null;
    const loaded = await options.load();
    if (!options.isCurrent()) return null;
    options.onProgress?.(loaded);
    if (loaded.metadataSyncStatus === "FAILED") {
      throw new Error(loaded.metadataSyncError || "群信息同步失败");
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
