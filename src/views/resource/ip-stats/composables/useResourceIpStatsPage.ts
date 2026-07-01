import { computed, onMounted, ref } from "vue";
import {
  getIpStatsSummary,
  getIpStatsCountrySampleStats,
  listIpStatsCountries,
  listIpStatsRegionProxies,
  sampleCheckIpStatsCountry,
  type IpCountryStatsRow,
  type IpStatsCountrySampleStats,
  type IpStatsDetailRow,
  type IpStatsRisk,
  type IpStatsSortField,
  type IpStatsSortOrder,
  type IpStatsSummary
} from "@/api/resource-ip-stats";
import type {
  IpAllocationMode,
  ProxyTypeLabel
} from "@/api/resource-ip-mapping";
import { apiErrorMessage } from "@/utils/api-error";
import { message } from "@/utils/message";
import { formatEpochMillis } from "@/utils/time";
import {
  allocationModeOptions,
  detailStatusOptions,
  ipStatsCountryColumns,
  ipStatsDetailColumns,
  proxyTypeOptions,
  riskOptions,
  riskTagType
} from "../constants";

export interface IpStatsSearchForm {
  keyword: string;
  proxyType: ProxyTypeLabel | "";
  allocationMode: IpAllocationMode | "";
  source: string;
  risk: IpStatsRisk | "";
}

export interface IpStatsDetailSearchForm {
  ipKeyword: string;
  accountKeyword: string;
  proxyType: ProxyTypeLabel | "";
  status: number | "";
}

interface SortChange {
  prop?: string;
  order?: "ascending" | "descending" | null;
}

const defaultSummary: IpStatsSummary = {
  totalIpCount: 0,
  inUseIpCount: 0,
  idleIpCount: 0,
  unavailableIpCount: 0,
  coveredRegionCount: 0,
  supportedCountryCount: 0,
  noIpCountryCount: 0
};

const sortFieldMap: Record<string, IpStatsSortField> = {
  totalIpCount: "totalIpCount",
  inUseIpCount: "inUseIpCount",
  idleIpCount: "idleIpCount",
  unavailableIpCount: "unavailableIpCount",
  availableRate: "availableRate",
  unavailableRate: "unavailableRate"
};

const defaultSampleStats: IpStatsCountrySampleStats = {
  region: "",
  totalIpCount: 0,
  availableIpCount: 0,
  inUseIpCount: 0,
  unavailableIpCount: 0
};

export function useResourceIpStatsPage() {
  const summary = ref<IpStatsSummary>({ ...defaultSummary });
  const summaryLoading = ref(false);
  const countryLoading = ref(false);
  const rankLoading = ref(false);
  const detailLoading = ref(false);
  const errorMessage = ref("");

  const searchForm = ref<IpStatsSearchForm>({
    keyword: "",
    proxyType: "",
    allocationMode: "",
    source: "",
    risk: ""
  });
  const detailSearchForm = ref<IpStatsDetailSearchForm>({
    ipKeyword: "",
    accountKeyword: "",
    proxyType: "",
    status: ""
  });

  const countryRows = ref<IpCountryStatsRow[]>([]);
  const rankRows = ref<IpCountryStatsRow[]>([]);
  const detailRows = ref<IpStatsDetailRow[]>([]);
  const selectedCountry = ref<IpCountryStatsRow | null>(null);
  const detailVisible = ref(false);
  const sampleDialogVisible = ref(false);
  const sampleDialogLoading = ref(false);
  const sampleChecking = ref(false);
  const sampleDialogCountry = ref<IpCountryStatsRow | null>(null);
  const sampleDialogStats = ref<IpStatsCountrySampleStats>({
    ...defaultSampleStats
  });
  const sampleCount = ref<number | undefined>();
  const sampleDialogError = ref("");

  const page = ref(1);
  const pageSize = ref(20);
  const total = ref(0);
  const detailPage = ref(1);
  const detailPageSize = ref(10);
  const detailTotal = ref(0);
  const sortField = ref<IpStatsSortField>("totalIpCount");
  const sortOrder = ref<IpStatsSortOrder>("desc");

  const summaryCards = computed(() => [
    {
      key: "total",
      label: "IP 总数量",
      value: summary.value.totalIpCount,
      sub: "包含真实国家和混合池 IP",
      type: "primary"
    },
    {
      key: "covered",
      label: "覆盖国家数",
      value: `${summary.value.coveredRegionCount} / ${summary.value.supportedCountryCount}`,
      sub: "有 IP 的真实国家 / 支持国家",
      type: "success"
    },
    {
      key: "noIp",
      label: "无 IP 国家数",
      value: summary.value.noIpCountryCount,
      sub: "支持国家中 IP 总数为 0",
      type: "danger"
    },
    {
      key: "inUse",
      label: "使用中 IP 数",
      value: summary.value.inUseIpCount,
      sub: "当前正在被账号登录使用",
      type: "warning"
    },
    {
      key: "idle",
      label: "空闲 IP 数",
      value: summary.value.idleIpCount,
      sub: "当前可继续分配使用",
      type: "success"
    },
    {
      key: "unavailable",
      label: "不可用 IP 数",
      value: summary.value.unavailableIpCount,
      sub: "不可用、检测失败或被禁用",
      type: "danger"
    }
  ]);

  const detailSummaryCards = computed<Array<[string, number | string]>>(() => {
    const row = selectedCountry.value;
    if (!row) return [];
    return [
      ["IP 总数", row.totalIpCount],
      ["使用中", row.inUseIpCount],
      ["空闲", row.idleIpCount],
      ["不可用", row.unavailableIpCount],
      ["可用率", `${formatRate(row.availableRate)}%`]
    ];
  });

  const sampleDialogTitle = computed(() => {
    const country = sampleDialogCountry.value;
    return country ? `国家 IP 抽样检测 - ${country.region}` : "国家 IP 抽样检测";
  });

  function formatRate(value: number | null | undefined): string {
    const safeValue = Number(value ?? 0);
    return Number.isFinite(safeValue) ? safeValue.toFixed(2) : "0.00";
  }

  function formatTime(value: number | null | undefined): string {
    return formatEpochMillis(value);
  }

  function rankBarWidth(row: IpCountryStatsRow): string {
    const max = rankRows.value[0]?.totalIpCount || 1;
    const width = Math.max(6, Math.round((row.totalIpCount / max) * 100));
    return `${Math.min(width, 100)}%`;
  }

  async function loadSummary(): Promise<void> {
    summaryLoading.value = true;
    try {
      summary.value = await getIpStatsSummary();
    } catch (error) {
      summary.value = { ...defaultSummary };
      message(apiErrorMessage(error, "IP 统计总览加载失败"), {
        type: "error"
      });
    } finally {
      summaryLoading.value = false;
    }
  }

  async function loadRankRows(): Promise<void> {
    rankLoading.value = true;
    try {
      const result = await listIpStatsCountries({
        ...searchForm.value,
        sortField: "totalIpCount",
        sortOrder: "desc",
        page: 1,
        pageSize: 10
      });
      rankRows.value = result.list ?? [];
    } catch (error) {
      rankRows.value = [];
      message(apiErrorMessage(error, "IP 排行加载失败"), { type: "error" });
    } finally {
      rankLoading.value = false;
    }
  }

  async function loadCountryRows(): Promise<void> {
    countryLoading.value = true;
    errorMessage.value = "";
    try {
      const result = await listIpStatsCountries({
        ...searchForm.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value,
        page: page.value,
        pageSize: pageSize.value
      });
      countryRows.value = result.list ?? [];
      total.value = result.total ?? 0;
    } catch (error) {
      countryRows.value = [];
      total.value = 0;
      errorMessage.value = apiErrorMessage(error, "国家维度统计加载失败");
      message(errorMessage.value, { type: "error" });
    } finally {
      countryLoading.value = false;
    }
  }

  async function refreshAll(): Promise<void> {
    await Promise.all([loadSummary(), loadRankRows(), loadCountryRows()]);
  }

  async function searchCountries(): Promise<void> {
    page.value = 1;
    await Promise.all([loadRankRows(), loadCountryRows()]);
  }

  async function resetSearchForm(): Promise<void> {
    searchForm.value = {
      keyword: "",
      proxyType: "",
      allocationMode: "",
      source: "",
      risk: ""
    };
    page.value = 1;
    sortField.value = "totalIpCount";
    sortOrder.value = "desc";
    await Promise.all([loadRankRows(), loadCountryRows()]);
  }

  function onCountrySortChange(sort: SortChange): void {
    const field = sort.prop ? sortFieldMap[sort.prop] : undefined;
    sortField.value = field ?? "totalIpCount";
    sortOrder.value = sort.order === "ascending" ? "asc" : "desc";
    page.value = 1;
    void loadCountryRows();
  }

  async function openDetail(
    row: IpCountryStatsRow,
    status: number | "" = ""
  ): Promise<void> {
    selectedCountry.value = row;
    detailSearchForm.value = {
      ipKeyword: "",
      accountKeyword: "",
      proxyType: searchForm.value.proxyType,
      status
    };
    detailPage.value = 1;
    detailVisible.value = true;
    await loadDetailRows();
  }

  async function sampleCheckCountry(row: IpCountryStatsRow): Promise<void> {
    sampleDialogCountry.value = row;
    sampleDialogStats.value = {
      region: row.region,
      totalIpCount: row.totalIpCount,
      availableIpCount: row.idleIpCount,
      inUseIpCount: row.inUseIpCount,
      unavailableIpCount: row.unavailableIpCount
    };
    sampleCount.value = undefined;
    sampleDialogError.value = "";
    sampleDialogVisible.value = true;
    sampleDialogLoading.value = true;
    try {
      sampleDialogStats.value = await getIpStatsCountrySampleStats(row.region);
    } catch (error) {
      sampleDialogVisible.value = false;
      message(apiErrorMessage(error, "国家 IP 抽样检测统计加载失败"), {
        type: "error"
      });
    } finally {
      sampleDialogLoading.value = false;
    }
  }

  async function confirmSampleCheckCountry(): Promise<void> {
    const country = sampleDialogCountry.value;
    if (!country || sampleChecking.value) return;

    sampleDialogError.value = "";
    const normalizedSampleCount = Number(sampleCount.value);
    if (!Number.isInteger(normalizedSampleCount) || normalizedSampleCount <= 0) {
      sampleDialogError.value = "请输入大于 0 的整数抽样检测数量。";
      return;
    }
    if (normalizedSampleCount > sampleDialogStats.value.totalIpCount) {
      sampleDialogError.value =
        `抽样检测数量不能超过当前国家 IP 总数量 ${sampleDialogStats.value.totalIpCount}。`;
      return;
    }

    sampleChecking.value = true;
    try {
      await sampleCheckIpStatsCountry(country.region, normalizedSampleCount);
      message(`已完成 ${country.region} ${normalizedSampleCount} 个 IP 抽样检测`, {
        type: "success"
      });
      sampleDialogVisible.value = false;
      await refreshAll();
      if (detailVisible.value && selectedCountry.value?.region === country.region) {
        await loadDetailRows();
      }
    } catch (error) {
      message(apiErrorMessage(error, "国家 IP 抽样检测失败"), {
        type: "error"
      });
    } finally {
      sampleChecking.value = false;
    }
  }

  async function loadDetailRows(): Promise<void> {
    const country = selectedCountry.value;
    if (!country) return;
    detailLoading.value = true;
    try {
      const result = await listIpStatsRegionProxies(country.region, {
        ...detailSearchForm.value,
        page: detailPage.value,
        pageSize: detailPageSize.value
      });
      detailRows.value = result.list ?? [];
      detailTotal.value = result.total ?? 0;
    } catch (error) {
      detailRows.value = [];
      detailTotal.value = 0;
      message(apiErrorMessage(error, "国家 IP 明细加载失败"), {
        type: "error"
      });
    } finally {
      detailLoading.value = false;
    }
  }

  async function searchDetailRows(): Promise<void> {
    detailPage.value = 1;
    await loadDetailRows();
  }

  async function resetDetailSearchForm(): Promise<void> {
    detailSearchForm.value = {
      ipKeyword: "",
      accountKeyword: "",
      proxyType: searchForm.value.proxyType,
      status: ""
    };
    detailPage.value = 1;
    await loadDetailRows();
  }

  onMounted(() => {
    void refreshAll();
  });

  return {
    allocationModeOptions,
    countryColumns: ipStatsCountryColumns,
    countryLoading,
    countryRows,
    detailColumns: ipStatsDetailColumns,
    detailLoading,
    detailPage,
    detailPageSize,
    detailRows,
    detailSearchForm,
    detailStatusOptions,
    detailSummaryCards,
    detailTotal,
    detailVisible,
    errorMessage,
    formatRate,
    formatTime,
    confirmSampleCheckCountry,
    openDetail,
    page,
    pageSize,
    proxyTypeOptions,
    rankBarWidth,
    rankLoading,
    rankRows,
    refreshAll,
    resetDetailSearchForm,
    resetSearchForm,
    riskOptions,
    riskTagType,
    sampleChecking,
    sampleCheckCountry,
    sampleCount,
    sampleDialogCountry,
    sampleDialogError,
    sampleDialogLoading,
    sampleDialogStats,
    sampleDialogTitle,
    sampleDialogVisible,
    searchCountries,
    searchDetailRows,
    searchForm,
    selectedCountry,
    summaryCards,
    summaryLoading,
    total,
    loadCountryRows,
    loadDetailRows,
    onCountrySortChange
  };
}
