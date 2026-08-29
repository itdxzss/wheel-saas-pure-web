interface ObjectUrlApi {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
}

interface CacheEntry {
  refs: number;
  url: string;
  promise: Promise<string>;
}

export interface ProtectedAssetObjectUrlCache {
  acquire(assetId: number): Promise<string>;
  release(assetId: number): void;
  clear(): void;
}

/**
 * 受保护素材共享缓存：同一素材只走一次带 Bearer 的 Blob 请求，最后一个使用者释放时回收 URL。
 */
export function createProtectedAssetObjectUrlCache(
  loader: (assetId: number) => Promise<Blob>,
  objectUrlApi: ObjectUrlApi = URL
): ProtectedAssetObjectUrlCache {
  const entries = new Map<number, CacheEntry>();

  function cleanup(assetId: number, entry: CacheEntry): void {
    if (entries.get(assetId) !== entry || entry.refs > 0) return;
    // 请求尚未完成时保留零引用条目；Blob 到达后立即创建并回收 ObjectURL。
    if (!entry.url) return;
    objectUrlApi.revokeObjectURL(entry.url);
    entries.delete(assetId);
  }

  return {
    acquire(assetId: number): Promise<string> {
      const existing = entries.get(assetId);
      if (existing) {
        existing.refs += 1;
        return existing.promise;
      }
      const entry: CacheEntry = {
        refs: 1,
        url: "",
        promise: Promise.resolve("")
      };
      entry.promise = loader(assetId)
        .then(blob => {
          if (entries.get(assetId) !== entry) return "";
          entry.url = objectUrlApi.createObjectURL(blob);
          cleanup(assetId, entry);
          return entry.url;
        })
        .catch(error => {
          if (entries.get(assetId) === entry) entries.delete(assetId);
          throw error;
        });
      entries.set(assetId, entry);
      return entry.promise;
    },
    release(assetId: number): void {
      const entry = entries.get(assetId);
      if (!entry) return;
      entry.refs = Math.max(0, entry.refs - 1);
      cleanup(assetId, entry);
    },
    clear(): void {
      for (const [assetId, entry] of entries) {
        entry.refs = 0;
        cleanup(assetId, entry);
      }
    }
  };
}
