import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getHyperlinkMarketingCountries,
  getHyperlinkMarketingStats,
  type HyperlinkMarketingAccountType,
  type HyperlinkMarketingCountries,
  type HyperlinkMarketingCountryPair,
  type HyperlinkMarketingDeviceOs,
  type HyperlinkMarketingGranularity,
  type HyperlinkMarketingMetric,
  type HyperlinkMarketingTaskType
} from "@/api/hyperlink-analysis";
import { apiErrorMessage } from "@/utils/api-error";
import {
  aggregateMarketingSeries,
  createMarketingDateRange,
  EMPTY_MARKETING_METRIC,
  marketingOverview,
  validateMarketingDateRange
} from "../domain/marketing-stats";

export interface HyperlinkMarketingFilters {
  granularity: HyperlinkMarketingGranularity;
  dateRange: [string, string] | [];
  taskType?: HyperlinkMarketingTaskType;
  senderCountryIso2?: string;
  recipientCountryIso2?: string;
  accountType?: HyperlinkMarketingAccountType;
  deviceOs?: HyperlinkMarketingDeviceOs;
  shortLinkEnabled?: boolean;
}

const EMPTY_COUNTRIES: HyperlinkMarketingCountries = {
  senderCountryIso2: [],
  recipientCountryIso2: []
};

function normalizedCountries(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim().toUpperCase()))]
    .filter(value => value && value !== "ZZ")
    .sort((left, right) => left.localeCompare(right));
}

export function useHyperlinkMarketingAnalysis() {
  const filters = reactive<HyperlinkMarketingFilters>({
    granularity: "day",
    dateRange: createMarketingDateRange("day")
  });
  const items = ref<HyperlinkMarketingCountryPair[]>([]);
  const overviewMetric = ref<HyperlinkMarketingMetric>({
    ...EMPTY_MARKETING_METRIC
  });
  const resultGranularity = ref<HyperlinkMarketingGranularity>("day");
  const loading = ref(false);
  const errorMessage = ref("");
  const countries = ref<HyperlinkMarketingCountries>(EMPTY_COUNTRIES);
  const countriesLoading = ref(false);
  const countriesError = ref("");
  const viewMode = ref<"table" | "trend">("table");

  const senderCountries = computed(() =>
    normalizedCountries(countries.value.senderCountryIso2)
  );
  const recipientCountries = computed(() =>
    normalizedCountries(countries.value.recipientCountryIso2)
  );
  const series = computed<HyperlinkMarketingMetric[]>(() =>
    aggregateMarketingSeries(items.value)
  );
  const overview = computed(() =>
    marketingOverview(overviewMetric.value, series.value)
  );
  const countryScope = computed(
    () =>
      `${filters.senderCountryIso2 || "全部"} → ${filters.recipientCountryIso2 || "全部"}`
  );

  async function loadCountries(): Promise<void> {
    const validation = validateMarketingDateRange(
      filters.dateRange,
      filters.granularity
    );
    if (validation || filters.dateRange.length !== 2) return;
    const [dateFrom, dateTo] = filters.dateRange;
    countriesLoading.value = true;
    countriesError.value = "";
    try {
      countries.value = await getHyperlinkMarketingCountries({
        dateFrom,
        dateTo,
        granularity: filters.granularity
      });
      if (
        filters.senderCountryIso2 &&
        !normalizedCountries(countries.value.senderCountryIso2).includes(
          filters.senderCountryIso2
        )
      ) {
        filters.senderCountryIso2 = undefined;
      }
      if (
        filters.recipientCountryIso2 &&
        !normalizedCountries(countries.value.recipientCountryIso2).includes(
          filters.recipientCountryIso2
        )
      ) {
        filters.recipientCountryIso2 = undefined;
      }
    } catch (error) {
      countries.value = EMPTY_COUNTRIES;
      countriesError.value = apiErrorMessage(error, "国家候选加载失败");
    } finally {
      countriesLoading.value = false;
    }
  }

  async function refresh(notifyValidation = false): Promise<void> {
    const validation = validateMarketingDateRange(
      filters.dateRange,
      filters.granularity
    );
    if (validation) {
      errorMessage.value = validation;
      if (notifyValidation) ElMessage.warning(validation);
      return;
    }
    const [dateFrom, dateTo] = filters.dateRange;
    loading.value = true;
    errorMessage.value = "";
    try {
      await loadCountries();
      const result = await getHyperlinkMarketingStats({
        dateFrom,
        dateTo,
        granularity: filters.granularity,
        taskType: filters.taskType,
        senderCountryIso2: filters.senderCountryIso2,
        recipientCountryIso2: filters.recipientCountryIso2,
        accountType: filters.accountType,
        deviceOs: filters.deviceOs,
        shortLinkEnabled: filters.shortLinkEnabled
      });
      resultGranularity.value = result.granularity;
      overviewMetric.value = result.overview;
      items.value = result.items ?? [];
    } catch (error) {
      items.value = [];
      overviewMetric.value = { ...EMPTY_MARKETING_METRIC };
      errorMessage.value = apiErrorMessage(error, "超链市场分析加载失败");
    } finally {
      loading.value = false;
    }
  }

  function search(): void {
    void refresh(true);
  }

  function changeGranularity(value: HyperlinkMarketingGranularity): void {
    filters.granularity = value;
    filters.dateRange = createMarketingDateRange(value);
    void refresh();
  }

  function applyPreset(span: number): void {
    filters.dateRange = createMarketingDateRange(filters.granularity, span);
    void refresh();
  }

  function reset(): void {
    filters.dateRange = createMarketingDateRange(filters.granularity);
    filters.taskType = undefined;
    filters.senderCountryIso2 = undefined;
    filters.recipientCountryIso2 = undefined;
    filters.accountType = undefined;
    filters.deviceOs = undefined;
    filters.shortLinkEnabled = undefined;
    void refresh();
  }

  async function initialize(): Promise<void> {
    await refresh();
  }

  onMounted(() => void initialize());

  return {
    filters,
    items,
    resultGranularity,
    loading,
    errorMessage,
    countriesLoading,
    countriesError,
    senderCountries,
    recipientCountries,
    series,
    overview,
    countryScope,
    viewMode,
    loadCountries,
    refresh,
    search,
    changeGranularity,
    applyPreset,
    reset,
    initialize
  };
}
