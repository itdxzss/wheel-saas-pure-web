import {
  computed,
  onScopeDispose,
  ref,
  watch,
  type ComputedRef,
  type Ref
} from "vue";
import { listAccountGroups } from "@/api/account-group";
import { listTenantAccounts } from "@/api/account";
import {
  createTierCheck,
  previewTierCheck,
  type TierCheckMode,
  type TierCheckPreview,
  type TierCheckRequest
} from "@/api/account-tier-check";
import { formatAccountGroupLabel } from "@/utils/account-group-label";
import { apiErrorMessage } from "@/utils/api-error";

export interface TierCheckCreateState {
  form: Ref<{
    name: string;
    accountGroupIds: number[];
    includePersonal: boolean;
    mode: TierCheckMode;
    probeAccountIds: number[];
  }>;
  groupOptions: Ref<{ id: number; label: string }[]>;
  probeOptions: Ref<{ id: number; phone: string }[]>;
  probeLoading: Ref<boolean>;
  busy: Ref<boolean>;
  error: Ref<string>;
  preview: Ref<TierCheckPreview | null>;
  valid: ComputedRef<boolean>;
  canStart: ComputedRef<boolean>;
  selectedIds: ComputedRef<number[]>;
  check: () => Promise<void>;
  start: () => Promise<boolean>;
  searchProbes: (keyword: string) => Promise<void>;
}

/** 新建抽屉保留原表单：范围变更使预览失效，关闭后不接收旧请求结果。 */
export function useTierCheckCreate(
  open: Ref<boolean>,
  accountIds: Readonly<Ref<readonly number[]>>
): TierCheckCreateState {
  const groupOptions = ref<{ id: number; label: string }[]>([]);
  const probeOptions = ref<{ id: number; phone: string }[]>([]);
  const probeLoading = ref(false);
  const busy = ref(false);
  const error = ref("");
  const preview = ref<TierCheckPreview | null>(null);
  const requestId = ref("");
  const form = ref({
    name: "",
    accountGroupIds: [] as number[],
    includePersonal: false,
    mode: 1 as TierCheckMode,
    probeAccountIds: [] as number[]
  });
  let generation = 0;
  let probeGeneration = 0;
  let revision = 0;
  const selectedIds = computed(() => [...new Set(accountIds.value)]);
  const valid = computed(
    () =>
      (selectedIds.value.length > 0 || form.value.accountGroupIds.length > 0) &&
      (form.value.mode === 1 || form.value.probeAccountIds.length > 0)
  );
  const canStart = computed(
    () => valid.value && !!preview.value?.eligible && !busy.value
  );

  function payload(): TierCheckRequest {
    return {
      ...form.value,
      accountGroupIds: selectedIds.value.length
        ? []
        : [...form.value.accountGroupIds],
      accountIds: selectedIds.value.length ? [...selectedIds.value] : undefined,
      probeAccountIds:
        form.value.mode === 1 ? [] : [...form.value.probeAccountIds],
      name: form.value.name.trim() || undefined,
      requestId: requestId.value,
      previewToken: preview.value?.previewToken
    };
  }
  async function loadGroups(current: number): Promise<void> {
    const groups: { id: number; label: string }[] = [];
    for (let page = 1; ; page++) {
      const result = await listAccountGroups({ page, pageSize: 200 });
      if (current !== generation) return;
      groups.push(
        ...(result.list ?? []).map(group => ({
          id: group.id,
          label: formatAccountGroupLabel(group)
        }))
      );
      if (
        !result.list?.length ||
        groups.length >= (result.total ?? groups.length)
      )
        break;
    }
    groupOptions.value = groups;
  }
  async function searchProbes(keyword: string): Promise<void> {
    const current = generation;
    const search = ++probeGeneration;
    probeLoading.value = true;
    try {
      const result = await listTenantAccounts({
        page: 1,
        pageSize: 20,
        keyword: keyword.trim() || undefined,
        loginState: 1,
        protocolId: "WEB"
      });
      if (current !== generation || search !== probeGeneration) return;
      probeOptions.value = (result.list ?? [])
        .filter(row => row.id && row.ws_phone && row.login_state === 1)
        .map(row => ({ id: row.id as number, phone: row.ws_phone as string }));
    } catch (e) {
      if (current === generation && search === probeGeneration)
        error.value = apiErrorMessage(e, "加载探针账号失败");
    } finally {
      if (current === generation && search === probeGeneration)
        probeLoading.value = false;
    }
  }
  watch(
    open,
    async visible => {
      const current = ++generation;
      busy.value = false;
      probeLoading.value = false;
      if (!visible) return;
      form.value = {
        name: "",
        accountGroupIds: [],
        includePersonal: false,
        mode: 1,
        probeAccountIds: []
      };
      preview.value = null;
      error.value = "";
      requestId.value = crypto.randomUUID();
      try {
        await Promise.all([loadGroups(current), searchProbes("")]);
      } catch (e) {
        if (current === generation)
          error.value = apiErrorMessage(e, "加载账号分组失败");
      }
    },
    { flush: "sync" }
  );
  watch(
    [form, selectedIds],
    () => {
      revision++;
      preview.value = null;
      requestId.value = crypto.randomUUID();
    },
    { deep: true, flush: "sync" }
  );

  async function check(): Promise<void> {
    if (!open.value || !valid.value || busy.value) return;
    const current = generation;
    const draft = revision;
    busy.value = true;
    error.value = "";
    try {
      const result = await previewTierCheck(payload());
      if (current === generation && draft === revision) preview.value = result;
    } catch (e) {
      if (current === generation) error.value = apiErrorMessage(e, "预览失败");
    } finally {
      if (current === generation) busy.value = false;
    }
  }
  async function start(): Promise<boolean> {
    if (!open.value || !canStart.value) return false;
    const current = generation;
    busy.value = true;
    error.value = "";
    try {
      await createTierCheck(payload());
      return current === generation;
    } catch (e) {
      if (current === generation)
        error.value = apiErrorMessage(e, "创建检测失败");
      return false;
    } finally {
      if (current === generation) busy.value = false;
    }
  }
  onScopeDispose(() => {
    generation++;
    probeGeneration++;
  });
  return {
    form,
    groupOptions,
    probeOptions,
    probeLoading,
    busy,
    error,
    preview,
    valid,
    canStart,
    selectedIds,
    check,
    start,
    searchProbes
  };
}
