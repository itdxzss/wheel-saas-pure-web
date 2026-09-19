import { computed, onScopeDispose, reactive, ref, watch, type Ref } from "vue";
import {
  getAccountRegistrationCatalog,
  getAccountRegistrationPriceTiers,
  type AccountRegistrationCatalog,
  type AccountRegistrationPriceTier
} from "@/api/account-registration";
import {
  getDeviceRegistration,
  prepareDeviceRegistration,
  startDeviceRegistration,
  type DeviceRegistrationSetup,
  type DeviceRegistrationStatus
} from "@/api/device-registration";
import { apiErrorMessage } from "@/utils/api-error";
import { registrationRequestId } from "./useAccountRegistration";

/** 保存许可和付费开始分开，页面轮询只读取本地任务状态。 */
export function useDeviceRegistration(active: Ref<boolean>) {
  const form = reactive({
    deviceId: "",
    countryId: "187",
    unitPrice: "",
    providerId: null as string | null
  });
  const countries = ref<AccountRegistrationCatalog["countries"]>([]);
  const tiers = ref<AccountRegistrationPriceTier[]>([]);
  const current = ref<DeviceRegistrationStatus | null>(null);
  const busy = ref(false);
  const pricesLoading = ref(false);
  const error = ref("");
  const pending = ref<Readonly<DeviceRegistrationSetup> | null>(null);
  const merchants = computed(
    () =>
      tiers.value.find(tier => String(tier.cost) === form.unitPrice)
        ?.providerIds ?? []
  );
  let generation = 0;
  let priceSequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;
  const visible = (token: number) =>
    !disposed && active.value && token === generation;
  const validDevice = () =>
    /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(form.deviceId);

  async function loadPrices(): Promise<void> {
    const token = generation,
      sequence = ++priceSequence,
      country = form.countryId;
    if (!active.value || !country) return;
    pricesLoading.value = true;
    try {
      const result = await getAccountRegistrationPriceTiers(country);
      if (
        !visible(token) ||
        sequence !== priceSequence ||
        country !== form.countryId
      )
        return;
      tiers.value = result;
      if (
        !pending.value &&
        !result.some(
          tier => String(tier.cost) === form.unitPrice && tier.count > 0
        )
      ) {
        form.unitPrice = "";
        form.providerId = null;
      }
      if (
        !pending.value &&
        form.providerId &&
        !merchants.value.includes(form.providerId)
      )
        form.providerId = null;
    } catch (cause) {
      if (visible(token) && sequence === priceSequence) {
        tiers.value = [];
        error.value = apiErrorMessage(cause, "实时报价加载失败");
      }
    } finally {
      if (visible(token) && sequence === priceSequence)
        pricesLoading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    if (!active.value || !validDevice()) return;
    const token = generation,
      device = form.deviceId;
    try {
      const result = await getDeviceRegistration(device);
      if (!visible(token) || device !== form.deviceId) return;
      current.value = result;
      if (pending.value?.requestId === result.requestId) pending.value = null;
      error.value = "";
    } catch (cause) {
      if (visible(token) && device === form.deviceId)
        error.value = apiErrorMessage(cause, "当前许可查询失败");
    }
  }

  async function prepare(): Promise<void> {
    if (busy.value || !active.value) return;
    if (!pending.value) {
      if (
        !validDevice() ||
        !countries.value.some(country => country.id === form.countryId) ||
        pricesLoading.value ||
        !tiers.value.some(
          tier =>
            String(tier.cost) === form.unitPrice &&
            tier.count > 0 &&
            (!form.providerId || tier.providerIds.includes(form.providerId))
        )
      ) {
        error.value = "请填写手机设备标识，并选择当前有效的国家、价格和商家";
        return;
      }
      pending.value = Object.freeze({
        ...form,
        requestId: registrationRequestId(),
        expiresAt: Date.now() + 60 * 60 * 1000
      });
    }
    const token = generation;
    busy.value = true;
    error.value = "";
    try {
      const result = await prepareDeviceRegistration(pending.value);
      if (visible(token)) {
        current.value = result;
        pending.value = null;
      }
    } catch (cause) {
      if (visible(token)) {
        error.value = apiErrorMessage(
          cause,
          "保存结果尚未确认，请查询当前许可或重试原请求"
        );
        const code = (cause as { businessCode?: number })?.businessCode;
        if (code === 40001 || code === 40401 || code === 40901)
          pending.value = null;
      }
    } finally {
      if (visible(token)) busy.value = false;
    }
  }

  async function start(snapshot: DeviceRegistrationStatus): Promise<void> {
    if (
      busy.value ||
      !active.value ||
      current.value?.requestId !== snapshot.requestId ||
      current.value.state !== "NOT_STARTED" ||
      snapshot.state !== "NOT_STARTED"
    )
      return;
    const token = generation,
      device = form.deviceId;
    busy.value = true;
    error.value = "";
    try {
      const result = await startDeviceRegistration(device, {
        requestId: snapshot.requestId,
        providerId: snapshot.providerId || ""
      });
      if (visible(token) && device === form.deviceId) current.value = result;
    } catch (cause) {
      if (visible(token))
        error.value = apiErrorMessage(
          cause,
          "开始结果尚未确认，请先刷新原任务；不要新建许可"
        );
    } finally {
      if (visible(token)) busy.value = false;
    }
  }

  watch(
    () => form.deviceId,
    () => {
      if (!pending.value) current.value = null;
    }
  );
  watch(
    () => form.countryId,
    () => {
      if (!pending.value) {
        form.unitPrice = "";
        form.providerId = null;
        tiers.value = [];
        void loadPrices();
      }
    }
  );
  watch(
    () => form.unitPrice,
    () => {
      if (!pending.value) form.providerId = null;
    }
  );
  watch(
    active,
    async value => {
      const token = ++generation;
      clearTimeout(timer);
      busy.value = false;
      pricesLoading.value = false;
      if (!value) return;
      try {
        const catalog = await getAccountRegistrationCatalog();
        if (!visible(token)) return;
        countries.value = catalog.countries;
        await loadPrices();
        await refresh();
      } catch (cause) {
        if (visible(token))
          error.value = apiErrorMessage(cause, "服务目录加载失败");
      }
      const poll = async () => {
        if (!visible(token)) return;
        if (current.value && !busy.value) await refresh();
        if (visible(token)) timer = setTimeout(poll, 5000);
      };
      if (visible(token)) timer = setTimeout(poll, 5000);
    },
    { immediate: true }
  );
  onScopeDispose(() => {
    disposed = true;
    generation++;
    clearTimeout(timer);
  });
  return {
    form,
    countries,
    tiers,
    merchants,
    current,
    busy,
    pricesLoading,
    pending,
    error,
    loadPrices,
    refresh,
    prepare,
    start
  };
}
