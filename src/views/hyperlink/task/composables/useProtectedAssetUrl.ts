import {
  onBeforeUnmount,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter
} from "vue";
import { downloadHyperlinkResourceAsset } from "@/api/hyperlink-task";
import { apiErrorMessage } from "@/utils/api-error";
import { createProtectedAssetObjectUrlCache } from "../domain/protected-asset-object-url";

const hyperlinkAssetObjectUrlCache = createProtectedAssetObjectUrlCache(
  downloadHyperlinkResourceAsset
);

export function useProtectedAssetUrl(assetId: MaybeRefOrGetter<number | null>) {
  const url = ref("");
  const loading = ref(false);
  const error = ref("");
  let activeId: number | null = null;
  let requestVersion = 0;

  function releaseActive(): void {
    if (activeId != null) hyperlinkAssetObjectUrlCache.release(activeId);
    activeId = null;
  }

  async function load(nextId: number | null): Promise<void> {
    const version = ++requestVersion;
    releaseActive();
    url.value = "";
    error.value = "";
    if (nextId == null) {
      loading.value = false;
      return;
    }
    activeId = nextId;
    loading.value = true;
    try {
      const objectUrl = await hyperlinkAssetObjectUrlCache.acquire(nextId);
      if (version !== requestVersion || activeId !== nextId) return;
      url.value = objectUrl;
    } catch (loadError) {
      if (version !== requestVersion || activeId !== nextId) return;
      releaseActive();
      error.value = apiErrorMessage(loadError, "素材图片加载失败");
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  }

  watch(
    () => toValue(assetId),
    nextId => void load(nextId),
    {
      immediate: true
    }
  );
  onBeforeUnmount(() => {
    requestVersion += 1;
    releaseActive();
  });

  return { url, loading, error };
}
