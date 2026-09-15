import {
  computed,
  onScopeDispose,
  reactive,
  ref,
  shallowRef,
  watch,
  type Ref
} from "vue";
import {
  cancelAccountRegistration,
  createAccountRegistration,
  getAccountRegistration,
  getAccountRegistrationCatalog,
  getAccountRegistrationPriceTiers,
  listAccountRegistrations,
  type AccountRegistrationCatalog,
  type AccountRegistrationDetail,
  type AccountRegistrationPriceTier,
  type AccountRegistrationRequest,
  type AccountRegistrationTask
} from "@/api/account-registration";
import { apiErrorMessage } from "@/utils/api-error";
import { DEFAULT_ACCOUNT_IMPORT_IP_ALLOCATION_MODE } from "../../import/constants";

export type RegistrationDraft = Omit<
  AccountRegistrationRequest,
  "requestId" | "accountGroupId" | "accountType"
> & {
  accountGroupId: number | "";
  accountType: 1 | 2 | "";
};

interface AccountRegistrationState {
  form: RegistrationDraft;
  catalog: Ref<AccountRegistrationCatalog | null>;
  tiers: Ref<AccountRegistrationPriceTier[]>;
  tasks: Ref<AccountRegistrationTask[]>;
  detail: Ref<AccountRegistrationDetail | null>;
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  activeTab: Ref<string>;
  catalogLoading: Ref<boolean>;
  pricesLoading: Ref<boolean>;
  tasksLoading: Ref<boolean>;
  detailLoading: Ref<boolean>;
  cancelling: Ref<boolean>;
  catalogError: Ref<string>;
  priceError: Ref<string>;
  tasksError: Ref<string>;
  detailError: Ref<string>;
  submitError: Ref<string>;
  submitState: Ref<SubmitState>;
  frozen: Readonly<Ref<boolean>>;
  submitting: Readonly<Ref<boolean>>;
  submittedRequest: Readonly<Ref<Readonly<AccountRegistrationRequest> | null>>;
  loadCatalog: () => Promise<void>;
  loadPrices: () => Promise<void>;
  changeCountry: () => void;
  refreshTasks: () => Promise<void>;
  loadDetail: (id?: number) => Promise<void>;
  submit: () => Promise<void>;
  resetDraft: () => boolean;
  cancel: (id: number) => Promise<void>;
}

const POLL_INTERVAL_MS = 5000;
type SubmitState =
  | "editing"
  | "submitting"
  | "unknown"
  | "confirmed"
  | "rejected";

/** 仅这两类业务码经后端确认发生于创建事务之前。 */
const REJECTED_BEFORE_CREATE_CODES = [40001, 40401];

function rejectedBeforeCreate(error: unknown): boolean {
  const code = (error as { businessCode?: unknown } | null)?.businessCode;
  return (
    typeof code === "number" && REJECTED_BEFORE_CREATE_CODES.includes(code)
  );
}

function emptyDraft(): RegistrationDraft {
  return {
    countryId: "",
    unitPrice: "",
    quantity: 1,
    accountGroupId: "",
    accountType: "",
    ipAllocationMode: DEFAULT_ACCOUNT_IMPORT_IP_ALLOCATION_MODE
  };
}

function defaultCountryId(
  countries: AccountRegistrationCatalog["countries"]
): string {
  // Grizzly 的美国渠道是 187；目录首项可能是 12（美国虚拟）。
  return (
    countries.find(country => country.id === "187")?.id ??
    countries[0]?.id ??
    ""
  );
}

function requestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return globalThis.crypto.randomUUID();
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value =>
    value.toString(16).padStart(2, "0")
  ).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** 管理接码注册草稿、未知请求恢复和只在抽屉打开时运行的只读轮询。 */
export function useAccountRegistration(
  visible: Ref<boolean>
): AccountRegistrationState {
  const form = reactive<RegistrationDraft>(emptyDraft());
  const catalog = shallowRef<AccountRegistrationCatalog | null>(null);
  const tiers = shallowRef<AccountRegistrationPriceTier[]>([]);
  const tasks = shallowRef<AccountRegistrationTask[]>([]);
  const detail = shallowRef<AccountRegistrationDetail | null>(null);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const selectedId = ref<number | null>(null);
  const activeTab = ref("create");
  const catalogLoading = ref(false);
  const pricesLoading = ref(false);
  const tasksLoading = ref(false);
  const detailLoading = ref(false);
  const cancelling = ref(false);
  const catalogError = ref("");
  const priceError = ref("");
  const tasksError = ref("");
  const detailError = ref("");
  const submitError = ref("");
  const submitState = ref<SubmitState>("editing");
  const submitted = shallowRef<Readonly<AccountRegistrationRequest> | null>(
    null
  );
  const frozen = computed(() => submitted.value !== null);
  const submitting = computed(() => submitState.value === "submitting");
  let generation = 0;
  let priceSequence = 0;
  let listSequence = 0;
  let detailSequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function current(token: number): boolean {
    return visible.value && token === generation;
  }

  async function loadCatalog(): Promise<void> {
    if (!visible.value) return;
    const token = generation;
    catalogLoading.value = true;
    catalogError.value = "";
    try {
      const response = await getAccountRegistrationCatalog();
      if (!current(token)) return;
      catalog.value = response;
      if (
        !frozen.value &&
        !response.countries.some(country => country.id === form.countryId)
      ) {
        form.countryId = defaultCountryId(response.countries);
        form.unitPrice = "";
      }
      if (form.countryId) await loadPrices();
    } catch (error) {
      if (current(token))
        catalogError.value = apiErrorMessage(error, "注册目录加载失败");
    } finally {
      if (current(token)) catalogLoading.value = false;
    }
  }

  async function loadPrices(): Promise<void> {
    if (!visible.value || !form.countryId) return;
    const token = generation;
    const sequence = ++priceSequence;
    const country = form.countryId;
    pricesLoading.value = true;
    priceError.value = "";
    try {
      const response = await getAccountRegistrationPriceTiers(country);
      if (
        !current(token) ||
        sequence !== priceSequence ||
        country !== form.countryId
      )
        return;
      tiers.value = response;
      if (
        !frozen.value &&
        !response.some(
          tier => String(tier.cost) === form.unitPrice && tier.count > 0
        )
      )
        form.unitPrice = "";
    } catch (error) {
      if (current(token) && sequence === priceSequence) {
        priceError.value = apiErrorMessage(error, "价格档位加载失败");
        tiers.value = [];
      }
    } finally {
      if (current(token) && sequence === priceSequence)
        pricesLoading.value = false;
    }
  }

  function changeCountry(): void {
    if (frozen.value) return;
    form.unitPrice = "";
    tiers.value = [];
    void loadPrices();
  }

  async function refreshTasks(): Promise<void> {
    if (!visible.value) return;
    const token = generation;
    const sequence = ++listSequence;
    tasksLoading.value = true;
    tasksError.value = "";
    try {
      const response = await listAccountRegistrations(
        page.value,
        pageSize.value
      );
      if (!current(token) || sequence !== listSequence) return;
      tasks.value = response.list ?? [];
      total.value = response.total ?? 0;
      const recovered = tasks.value.find(
        task => task.requestId === submitted.value?.requestId
      );
      if (recovered && submitState.value === "unknown") {
        submitState.value = "confirmed";
        submitError.value = "";
        selectedId.value = recovered.id;
      }
    } catch (error) {
      if (current(token) && sequence === listSequence)
        tasksError.value = apiErrorMessage(error, "注册任务加载失败");
    } finally {
      if (current(token) && sequence === listSequence)
        tasksLoading.value = false;
    }
  }

  async function loadDetail(id = selectedId.value): Promise<void> {
    if (!visible.value || id == null) return;
    const token = generation;
    const sequence = ++detailSequence;
    if (id !== selectedId.value) detail.value = null;
    selectedId.value = id;
    detailLoading.value = true;
    detailError.value = "";
    try {
      const response = await getAccountRegistration(id);
      if (current(token) && sequence === detailSequence)
        detail.value = response;
    } catch (error) {
      if (current(token) && sequence === detailSequence)
        detailError.value = apiErrorMessage(error, "注册明细加载失败");
    } finally {
      if (current(token) && sequence === detailSequence)
        detailLoading.value = false;
    }
  }

  function validationError(): string {
    if (catalogLoading.value || catalogError.value)
      return "请先成功加载注册服务目录";
    if (!catalog.value?.orderingEnabled)
      return catalog.value?.disabledReason || "接码采购尚未启用";
    if (!catalog.value.countries.some(country => country.id === form.countryId))
      return "请选择美国渠道";
    if (
      pricesLoading.value ||
      priceError.value ||
      !tiers.value.some(
        tier => String(tier.cost) === form.unitPrice && tier.count > 0
      )
    )
      return "请选择当前有库存的价格档位";
    if (
      !Number.isInteger(form.quantity) ||
      form.quantity < 1 ||
      form.quantity > 100
    )
      return "采购数量必须为 1 至 100";
    if (!form.accountGroupId) return "请选择账号分组";
    if (form.accountType !== 1 && form.accountType !== 2)
      return "请选择账号类型";
    return "";
  }

  async function submit(): Promise<void> {
    if (!visible.value || submitting.value || submitState.value === "confirmed")
      return;
    if (!submitted.value) {
      submitError.value = validationError();
      if (submitError.value) return;
      submitted.value = Object.freeze({
        ...form,
        accountGroupId: Number(form.accountGroupId),
        accountType: form.accountType as 1 | 2,
        requestId: requestId()
      });
    }
    const token = generation;
    submitState.value = "submitting";
    submitError.value = "";
    try {
      const response = await createAccountRegistration(submitted.value);
      if (!current(token)) return;
      submitState.value = "confirmed";
      detail.value = response;
      selectedId.value = response.task.id;
      activeTab.value = "tasks";
      await refreshTasks();
    } catch (error) {
      if (current(token)) {
        submitState.value = rejectedBeforeCreate(error)
          ? "rejected"
          : "unknown";
        submitError.value = apiErrorMessage(
          error,
          "未确认任务是否创建，请使用原请求重试"
        );
      }
    }
  }

  function resetDraft(): boolean {
    if (submitState.value === "unknown" || submitting.value) return false;
    submitted.value = null;
    submitState.value = "editing";
    submitError.value = "";
    Object.assign(form, emptyDraft());
    form.countryId = defaultCountryId(catalog.value?.countries ?? []);
    activeTab.value = "create";
    tiers.value = [];
    if (form.countryId) void loadPrices();
    return true;
  }

  async function cancel(id: number): Promise<void> {
    if (!visible.value || cancelling.value) return;
    const token = generation;
    cancelling.value = true;
    detailError.value = "";
    try {
      const response = await cancelAccountRegistration(id);
      if (!current(token)) return;
      detailSequence++;
      if (selectedId.value === id) detail.value = response;
      await refreshTasks();
    } catch (error) {
      if (current(token))
        detailError.value = apiErrorMessage(
          error,
          "停止请求未确认，请刷新任务核对"
        );
    } finally {
      if (current(token)) cancelling.value = false;
    }
  }

  function clearPoll(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }

  function schedulePoll(): void {
    clearPoll();
    if (!visible.value) return;
    const token = generation;
    timer = setTimeout(async () => {
      await refreshTasks();
      if (!current(token)) return;
      await loadDetail();
      if (current(token)) schedulePoll();
    }, POLL_INTERVAL_MS);
  }

  function close(): void {
    generation++;
    clearPoll();
    catalogLoading.value =
      pricesLoading.value =
      tasksLoading.value =
      detailLoading.value =
      cancelling.value =
        false;
    if (submitting.value) submitState.value = "unknown";
  }

  watch(
    visible,
    open => {
      close();
      if (!open) return;
      void loadCatalog();
      void refreshTasks();
      void loadDetail();
      schedulePoll();
    },
    { immediate: true, flush: "sync" }
  );
  onScopeDispose(close);

  return {
    form,
    catalog,
    tiers,
    tasks,
    detail,
    page,
    pageSize,
    total,
    activeTab,
    catalogLoading,
    pricesLoading,
    tasksLoading,
    detailLoading,
    cancelling,
    catalogError,
    priceError,
    tasksError,
    detailError,
    submitError,
    submitState,
    frozen,
    submitting,
    submittedRequest: computed(() => submitted.value),
    loadCatalog,
    loadPrices,
    changeCountry,
    refreshTasks,
    loadDetail,
    submit,
    resetDraft,
    cancel
  };
}
