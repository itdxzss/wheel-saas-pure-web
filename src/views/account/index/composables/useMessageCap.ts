import { ref } from "vue";
import {
  MESSAGE_CAP_MAX_ACCOUNTS,
  queryAccountMessageCap,
  type MessageCapItem
} from "@/api/account-message-cap";
import { apiErrorMessage } from "@/utils/api-error";

/** 把选中账号按后端上限切批，保持顺序。 */
export function chunkIds(ids: number[], size = MESSAGE_CAP_MAX_ACCOUNTS) {
  const chunks: number[][] = [];
  for (let start = 0; start < ids.length; start += size) {
    chunks.push(ids.slice(start, start + size));
  }
  return chunks;
}

/**
 * 新聊天额度批量查询的页面状态。只做展示和分批；真实查询、租户隔离与并发上限都在后端。
 * 结果只保存在组件内，不进 Pinia，避免额度数据跨租户或长期缓存。
 */
export function useMessageCap() {
  const rows = ref<MessageCapItem[]>([]);
  const loading = ref(false);
  const error = ref("");
  const queriedAt = ref<number>();
  let generation = 0;

  async function query(accountIds: number[]): Promise<void> {
    const current = ++generation;
    rows.value = [];
    error.value = "";
    queriedAt.value = undefined;
    loading.value = true;
    try {
      for (const chunk of chunkIds([...new Set(accountIds)])) {
        const batch = await queryAccountMessageCap(chunk, true);
        // 抽屉被重新打开后，旧请求的结果不能再写入新的选择。
        if (current !== generation) return;
        rows.value = [...rows.value, ...batch.items];
      }
      queriedAt.value = Date.now();
    } catch (failure) {
      if (current === generation) {
        error.value = apiErrorMessage(failure, "新聊天额度查询失败");
      }
    } finally {
      if (current === generation) loading.value = false;
    }
  }

  /** 关闭抽屉时丢弃在途请求的结果。 */
  function reset(): void {
    generation++;
    rows.value = [];
    error.value = "";
    queriedAt.value = undefined;
    loading.value = false;
  }

  return { rows, loading, error, queriedAt, query, reset };
}
