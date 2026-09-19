import { computed, onScopeDispose, reactive, ref, watch, type Ref } from "vue";
import {
  getAccountRegistrationPriceTiers,
  type AccountRegistrationPriceTier
} from "@/api/account-registration";
import {
  getCloudRegistrationDevices,
  type CloudRegistrationDevice
} from "@/api/cloud-registration";
import {
  getDeviceRegistration,
  prepareDeviceRegistration,
  type DeviceRegistrationSetup,
  type DeviceRegistrationStatus
} from "@/api/device-registration";
import { apiErrorMessage } from "@/utils/api-error";
import { registrationRequestId } from "./useAccountRegistration";

export interface CloudRegistrationRow extends CloudRegistrationDevice {
  checked: boolean;
  current: DeviceRegistrationStatus | null;
  pending: Readonly<DeviceRegistrationSetup> | null;
  error: string;
}

/** 多选只保存逐机许可；执行器确认各自手机就绪后才请求采购。 */
export function useCloudRegistration(active: Ref<boolean>) {
  const rows = ref<CloudRegistrationRow[]>([]);
  const selected = ref<string[]>([]);
  const form = reactive({ unitPrice: "", providerId: null as string | null });
  const tiers = ref<AccountRegistrationPriceTier[]>([]);
  const busy = ref(false),
    loading = ref(false),
    pricesLoading = ref(false),
    error = ref("");
  const pending = computed(() => rows.value.some(row => row.pending));
  const merchants = computed(
    () =>
      tiers.value.find(t => String(t.cost) === form.unitPrice)?.providerIds ??
      []
  );
  const eligible = (row: CloudRegistrationRow) =>
    row.checked && !row.current && !row.pending;
  const chosen = computed(() =>
    rows.value.filter(row => selected.value.includes(row.deviceId))
  );
  const validSelection = computed(
    () =>
      chosen.value.length > 0 &&
      chosen.value.length === selected.value.length &&
      chosen.value.every(eligible)
  );
  const validPrice = computed(
    () =>
      !pricesLoading.value &&
      tiers.value.some(
        t =>
          String(t.cost) === form.unitPrice &&
          t.count > 0 &&
          (!form.providerId || t.providerIds.includes(form.providerId))
      )
  );
  const canQueue = computed(
    () =>
      active.value &&
      !busy.value &&
      !loading.value &&
      (pending.value || (validSelection.value && validPrice.value))
  );
  const total = computed(() => {
    const costs = pending.value
      ? rows.value.filter(r => r.pending).map(r => r.pending!.unitPrice)
      : chosen.value.map(() => form.unitPrice);
    // 与后端最多 12 位小数一致，避免批量金额被浮点四舍五入低估。
    let sum = 0n;
    const scale = 10n ** 12n;
    for (const cost of costs) {
      const parts = /^(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(cost || "0");
      if (!parts) return "报价格式待核对";
      const fraction = parts[2] || "";
      const shift = 12 + Number(parts[3] || 0) - fraction.length;
      if (shift < 0 || shift > 30) return "报价精度待核对";
      sum += BigInt(parts[1] + fraction) * 10n ** BigInt(shift);
    }
    const fraction = (sum % scale)
      .toString()
      .padStart(12, "0")
      .replace(/0+$/, "");
    return `${sum / scale}${fraction ? "." + fraction : ""}`;
  });
  let disposed = false,
    generation = 0,
    priceSequence = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const visible = (token: number) =>
    !disposed && active.value && token === generation;

  async function loadPrices(): Promise<void> {
    const token = generation,
      sequence = ++priceSequence;
    pricesLoading.value = true;
    try {
      const result = await getAccountRegistrationPriceTiers("187");
      if (!visible(token) || sequence !== priceSequence) return;
      tiers.value = result;
      if (
        !pending.value &&
        !result.some(t => String(t.cost) === form.unitPrice && t.count > 0)
      )
        form.unitPrice = "";
      if (
        !pending.value &&
        form.providerId &&
        !merchants.value.includes(form.providerId)
      )
        form.providerId = null;
    } catch (cause) {
      if (visible(token)) {
        tiers.value = [];
        error.value = apiErrorMessage(cause, "报价加载失败");
      }
    } finally {
      if (visible(token) && sequence === priceSequence)
        pricesLoading.value = false;
    }
  }

  async function refresh(): Promise<void> {
    if (!active.value || busy.value) return;
    const token = generation;
    await Promise.all(
      rows.value.map(async row => {
        try {
          const result = await getDeviceRegistration(row.deviceId);
          if (!visible(token)) return;
          if (!result?.requestId) throw new Error("invalid status");
          row.current = result;
          row.checked = true;
          row.error = "";
          if (row.pending?.requestId === result.requestId) row.pending = null;
        } catch (cause) {
          if (!visible(token)) return;
          if (
            (cause as { businessCode?: number })?.businessCode === 40401 &&
            !row.current
          ) {
            row.checked = true;
            if (!row.pending) row.error = "";
          } else {
            row.checked = false;
            row.error = apiErrorMessage(
              cause,
              "当前任务未确认，不能创建新任务"
            );
          }
        }
      })
    );
  }

  async function loadDevices(): Promise<void> {
    if (!active.value || busy.value) return;
    const token = generation;
    loading.value = true;
    error.value = "";
    try {
      const result = await getCloudRegistrationDevices();
      if (!visible(token)) return;
      const existing = new Map(rows.value.map(row => [row.deviceId, row]));
      rows.value = result.map(device => ({
        ...device,
        checked: false,
        current: null,
        pending: null,
        error: "",
        ...existing.get(device.deviceId)
      }));
      // 有未确认提交的设备从目录移除时仍保留，防止丢失原 requestId。
      for (const row of existing.values())
        if (row.pending && !result.some(d => d.deviceId === row.deviceId))
          rows.value.push(row);
      selected.value = selected.value.filter(id =>
        rows.value.some(row => row.deviceId === id)
      );
      await refresh();
    } catch (cause) {
      if (visible(token))
        error.value = apiErrorMessage(cause, "云手机列表加载失败");
    } finally {
      if (visible(token)) loading.value = false;
    }
  }

  async function queue(): Promise<void> {
    if (!canQueue.value) return;
    if (!pending.value) {
      for (const row of chosen.value)
        row.pending = Object.freeze({
          deviceId: row.deviceId,
          requestId: registrationRequestId(),
          countryId: "187",
          unitPrice: form.unitPrice,
          providerId: form.providerId,
          expiresAt: Date.now() + 3600000
        });
    }
    busy.value = true;
    const token = generation;
    const batch = rows.value.filter(row => row.pending);
    try {
      for (const row of batch) {
        if (!visible(token)) break;
        const request = row.pending!;
        if (row.current && row.current.requestId !== request.requestId) {
          row.error = "设备已有另一笔许可，请核对；不会覆盖当前任务";
          continue;
        }
        try {
          const result = await prepareDeviceRegistration(request);
          if (!result?.requestId) throw new Error("invalid response");
          row.current = result;
          row.checked = true;
          row.pending = null;
          row.error = "";
        } catch (cause) {
          row.error = apiErrorMessage(
            cause,
            "保存结果未确认；重试将沿用本台原任务编号"
          );
        }
      }
    } finally {
      busy.value = false;
    }
  }

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
      if (!value) return;
      await Promise.all([loadDevices(), loadPrices()]);
      const poll = async () => {
        if (!visible(token)) return;
        await refresh();
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
    rows,
    selected,
    form,
    tiers,
    merchants,
    busy,
    loading,
    pricesLoading,
    error,
    pending,
    canQueue,
    total,
    eligible,
    queue,
    loadDevices,
    loadPrices,
    refresh
  };
}
