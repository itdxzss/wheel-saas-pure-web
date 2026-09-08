import { onBeforeUnmount, ref, watch, type Ref } from "vue";
import {
  getContactAccountOptions,
  type ContactAccountOptions
} from "@/api/contact-task";
import { apiErrorMessage } from "@/utils/api-error";

/** 每次打开筛选框读取当前租户选项；关闭后丢弃过期请求。 */
export function useContactAccountOptions(visible: Ref<boolean>) {
  const options = ref<ContactAccountOptions>({ groups: [], channels: [] });
  const loading = ref(false);
  const error = ref("");
  let controller: AbortController | undefined;

  async function reload(): Promise<void> {
    controller?.abort();
    const request = new AbortController();
    controller = request;
    loading.value = true;
    error.value = "";
    options.value = { groups: [], channels: [] };
    try {
      const result = await getContactAccountOptions(request.signal);
      if (!request.signal.aborted) options.value = result;
    } catch (cause) {
      if (!request.signal.aborted) {
        error.value = `分组和渠道加载失败：${apiErrorMessage(cause, "请稍后重试")}`;
      }
    } finally {
      if (controller === request) loading.value = false;
    }
  }

  watch(
    visible,
    open => {
      if (open) void reload();
      else controller?.abort();
    },
    { immediate: true }
  );
  onBeforeUnmount(() => controller?.abort());

  return { options, loading, error, reload };
}
