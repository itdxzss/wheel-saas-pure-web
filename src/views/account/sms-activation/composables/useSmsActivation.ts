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
  cancelSmsActivation,
  completeSmsActivation,
  createSmsActivation,
  getSmsActivation,
  getSmsActivationOptions,
  getSmsActivationPriceTiers,
  listSmsActivations,
  type SmsActivation,
  type SmsActivationOptions
} from "@/api/sms-activation";
import type { AccountRegistrationPriceTier } from "@/api/account-registration";
import { apiErrorMessage } from "@/utils/api-error";

/** 等码记录向后端刷新的间隔。 */
export const SMS_POLL_INTERVAL_MS = 4000;
/** 倒计时刷新间隔。 */
const CLOCK_INTERVAL_MS = 1000;
/** 进行中卡片展示的状态。 */
const ACTIVE_STATES = new Set(["WAITING_CODE", "RECEIVED"]);

export interface SmsActivationDraft {
  countryId: string;
  maxPrice: string;
  providerId: string | null;
}

function defaultCountryId(
  countries: SmsActivationOptions["countries"]
): string {
  // Grizzly 的美国渠道是 187；目录首项可能是 12（美国虚拟）。
  return (
    countries.find(country => country.id === "187")?.id ??
    countries[0]?.id ??
    ""
  );
}

/** 管理取号表单、记录分页，以及页面可见时对等码记录的轮询。 */
export function useSmsActivation(visible: Ref<boolean>) {
  const form = reactive<SmsActivationDraft>({
    countryId: "",
    maxPrice: "",
    providerId: null
  });
  const options = shallowRef<SmsActivationOptions | null>(null);
  const tiers = shallowRef<AccountRegistrationPriceTier[]>([]);
  const records = ref<SmsActivation[]>([]);
  const page = ref(1);
  const pageSize = ref(10);
  const total = ref(0);
  const now = ref(Date.now());
  const optionsLoading = ref(false);
  const pricesLoading = ref(false);
  const recordsLoading = ref(false);
  const purchasing = ref(false);
  const acting = ref<number | null>(null);
  const loadError = ref("");
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let clockTimer: ReturnType<typeof setInterval> | undefined;
  let polling = false;

  const active = computed(() =>
    records.value.filter(row => ACTIVE_STATES.has(row.state))
  );
  const providerOptions = computed(
    () =>
      tiers.value.find(tier => String(tier.cost) === form.maxPrice)
        ?.providerIds ?? []
  );
  const canPurchase = computed(
    () =>
      Boolean(
        options.value?.purchaseEnabled && form.countryId && form.maxPrice
      ) && !purchasing.value
  );

  async function loadOptions(): Promise<void> {
    optionsLoading.value = true;
    loadError.value = "";
    try {
      options.value = await getSmsActivationOptions();
      const countries = options.value.countries ?? [];
      if (!countries.some(country => country.id === form.countryId))
        form.countryId = defaultCountryId(countries);
      if (form.countryId) await loadPrices();
    } catch (error) {
      loadError.value = apiErrorMessage(error, "接码目录加载失败");
    } finally {
      optionsLoading.value = false;
    }
  }

  async function loadPrices(): Promise<void> {
    if (!form.countryId) return;
    pricesLoading.value = true;
    try {
      tiers.value = await getSmsActivationPriceTiers(form.countryId);
      if (!tiers.value.some(tier => String(tier.cost) === form.maxPrice)) {
        form.maxPrice = "";
        form.providerId = null;
      }
    } catch (error) {
      tiers.value = [];
      loadError.value = apiErrorMessage(error, "价格档位加载失败");
    } finally {
      pricesLoading.value = false;
    }
  }

  function changeCountry(): void {
    form.maxPrice = "";
    form.providerId = null;
    void loadPrices();
  }

  async function refreshRecords(): Promise<void> {
    recordsLoading.value = true;
    try {
      const response = await listSmsActivations(page.value, pageSize.value);
      records.value = response.list ?? [];
      total.value = response.total ?? 0;
    } catch (error) {
      loadError.value = apiErrorMessage(error, "接码记录加载失败");
    } finally {
      recordsLoading.value = false;
    }
  }

  function replace(row: SmsActivation): void {
    records.value = records.value.map(item =>
      item.id === row.id ? row : item
    );
  }

  /** 取号失败直接把后端提示抛给页面；不自动重试，避免结果不明时重复扣费。 */
  async function purchase(): Promise<SmsActivation> {
    purchasing.value = true;
    try {
      const created = await createSmsActivation({
        countryId: form.countryId,
        maxPrice: form.maxPrice,
        providerId: form.providerId
      });
      page.value = 1;
      await refreshRecords();
      return created;
    } finally {
      purchasing.value = false;
    }
  }

  async function act(
    id: number,
    action: (id: number) => Promise<SmsActivation>
  ): Promise<void> {
    acting.value = id;
    try {
      replace(await action(id));
    } finally {
      acting.value = null;
    }
  }

  const complete = (id: number) => act(id, completeSmsActivation);
  const cancel = (id: number) => act(id, cancelSmsActivation);

  /** 只刷新等码记录；单条失败保留原状态，等下一轮。 */
  async function pollWaiting(): Promise<void> {
    if (polling) return;
    polling = true;
    try {
      const waiting = records.value.filter(row => row.state === "WAITING_CODE");
      for (const row of waiting) {
        try {
          replace(await getSmsActivation(row.id));
        } catch {
          // 平台或网络暂时失败时不打断其他记录，下一轮继续查询。
        }
      }
    } finally {
      polling = false;
    }
  }

  function start(): void {
    stop();
    pollTimer = setInterval(() => void pollWaiting(), SMS_POLL_INTERVAL_MS);
    clockTimer = setInterval(() => (now.value = Date.now()), CLOCK_INTERVAL_MS);
  }

  function stop(): void {
    if (pollTimer) clearInterval(pollTimer);
    if (clockTimer) clearInterval(clockTimer);
    pollTimer = undefined;
    clockTimer = undefined;
  }

  watch(
    visible,
    shown => {
      if (!shown) return stop();
      start();
      void loadOptions();
      void refreshRecords();
    },
    { immediate: true }
  );
  onScopeDispose(stop);

  return {
    form,
    options,
    tiers,
    records,
    active,
    page,
    pageSize,
    total,
    now,
    optionsLoading,
    pricesLoading,
    recordsLoading,
    purchasing,
    acting,
    loadError,
    providerOptions,
    canPurchase,
    loadOptions,
    loadPrices,
    changeCountry,
    refreshRecords,
    purchase,
    complete,
    cancel,
    pollWaiting
  };
}
