<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import {
  buyerChannelStatsSortFields,
  exportBuyerChannelStats,
  getBuyerChannelStatsOptions,
  listBuyerChannelStats,
  type BuyerChannelStatsOptions,
  type BuyerChannelStatsQuery,
  type BuyerChannelStatsRow,
  type BuyerChannelStatsSortField,
  type BuyerChannelStatsSortOrder
} from "@/api/buyer-channel-stats";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import ChannelStatsTable from "./components/ChannelStatsTable.vue";
import { useDailyStatsPanels } from "./composables/useDailyStatsPanels";
import {
  defaultShanghaiDateRange,
  normalizeShanghaiDateRange,
  type ShanghaiDateRange
} from "./domain/stats-format";

defineOptions({ name: "BuyerChannelStats" });

const emptyOptions: BuyerChannelStatsOptions = {
  channels: [],
  templates: [],
  countries: [],
  creators: [],
  parentUsers: []
};
const filters = reactive<{
  dateRange: ShanghaiDateRange | null;
  channelId?: number;
  channelName: string;
  templateId?: number;
  countryCode?: string;
  creatorId?: number;
  parentUserId?: number;
}>({ dateRange: defaultShanghaiDateRange(), channelName: "" });
const options = ref<BuyerChannelStatsOptions>(emptyOptions);
const rows = ref<BuyerChannelStatsRow[]>([]);
const loading = ref(false);
const exporting = ref(false);
const sortBy = ref<BuyerChannelStatsSortField>();
const sortOrder = ref<BuyerChannelStatsSortOrder>();
const daily = useDailyStatsPanels({
  replaceSummary: replacement => {
    rows.value = rows.value.map(row =>
      row.channelId === replacement.channelId &&
      row.countryCode === replacement.countryCode
        ? replacement
        : row
    );
  },
  onVersionConflict: () => {
    ElMessage.warning("日明细已被其他人更新，已刷新数据，请重试");
  }
});
const tableColumns = [
  { label: "渠道/国家", prop: "channelName", hide: false },
  { label: "绑定模板", prop: "templateName", hide: false },
  { label: "消耗", prop: "spend" },
  { label: "展示", prop: "impressions" },
  { label: "点击/点击率", prop: "clicks" },
  { label: "其他费用", prop: "otherFee" },
  { label: "总费用/手续费", prop: "totalFee" },
  { label: "UV", prop: "uv" },
  { label: "访问时长", prop: "visitDurationSeconds" },
  { label: "登录请求次数/去重人数", prop: "loginRequestCount" },
  { label: "登录成功次数/去重人数", prop: "loginSuccessUserCount" },
  { label: "解绑数量", prop: "unbindCount" },
  { label: "解绑率", prop: "unbindRate" },
  { label: "请求登录率", prop: "loginRequestRate" },
  { label: "登录成功率", prop: "loginSuccessRate" },
  { label: "访客上号率", prop: "visitorConversionRate" },
  { label: "获号成本", prop: "accountCost" }
];

function queryParams(): BuyerChannelStatsQuery {
  const dateRange = normalizeShanghaiDateRange(filters.dateRange);
  filters.dateRange = dateRange;
  return {
    startDate: dateRange[0],
    endDate: dateRange[1],
    channelId: filters.channelId,
    channelName: filters.channelName.trim() || undefined,
    templateId: filters.templateId,
    countryCode: filters.countryCode,
    creatorId: filters.creatorId,
    parentUserId: filters.parentUserId,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  };
}

async function loadRows(): Promise<void> {
  loading.value = true;
  try {
    rows.value = await listBuyerChannelStats(queryParams());
  } catch (error) {
    rows.value = [];
    ElMessage.error(apiErrorMessage(error, "渠道统计加载失败"));
  } finally {
    loading.value = false;
  }
}

function reset(): void {
  Object.assign(filters, {
    dateRange: defaultShanghaiDateRange(),
    channelId: undefined,
    channelName: "",
    templateId: undefined,
    countryCode: undefined,
    creatorId: undefined,
    parentUserId: undefined
  });
  sortBy.value = undefined;
  sortOrder.value = undefined;
  void loadRows();
}

function sort(
  field?: BuyerChannelStatsSortField,
  order?: BuyerChannelStatsSortOrder
): void {
  sortBy.value =
    field && buyerChannelStatsSortFields.includes(field) ? field : undefined;
  sortOrder.value = sortBy.value ? order : undefined;
  void loadRows();
}

async function expand(row: BuyerChannelStatsRow): Promise<void> {
  try {
    const dateRange = normalizeShanghaiDateRange(filters.dateRange);
    filters.dateRange = dateRange;
    await daily.loadPanel(row.channelId, row.countryCode, dateRange);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "日明细加载失败"));
  }
}

async function saveDaily(
  summary: BuyerChannelStatsRow,
  row: Parameters<typeof daily.saveRow>[2]
): Promise<void> {
  try {
    const dateRange = normalizeShanghaiDateRange(filters.dateRange);
    filters.dateRange = dateRange;
    const result = await daily.saveRow(
      summary.channelId,
      summary.countryCode,
      row,
      dateRange
    );
    if (result === "saved") ElMessage.success("日明细已保存");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "日明细保存失败"));
  }
}

async function exportCurrent(): Promise<void> {
  exporting.value = true;
  try {
    const result = await exportBuyerChannelStats(queryParams());
    downloadBlobFile(result.filename, result.blob);
    ElMessage.success("渠道统计已导出");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "导出失败"));
  } finally {
    exporting.value = false;
  }
}

onMounted(async () => {
  try {
    options.value = await getBuyerChannelStatsOptions();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "统计筛选项加载失败"));
  }
  await loadRows();
});
</script>

<template>
  <div class="channel-stats-page">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            :clearable="false"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="filters.channelId"
            clearable
            filterable
            placeholder="全部"
          >
            <el-option
              v-for="item in options.channels"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道名称"
          ><el-input v-model="filters.channelName" clearable
        /></el-form-item>
        <el-form-item label="模板">
          <el-select v-model="filters.templateId" clearable placeholder="全部">
            <el-option
              v-for="item in options.templates"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标国家">
          <el-select
            v-model="filters.countryCode"
            clearable
            filterable
            placeholder="全部"
          >
            <el-option
              v-for="item in options.countries"
              :key="item.code"
              :label="item.name"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人">
          <el-select v-model="filters.creatorId" clearable placeholder="全部">
            <el-option
              v-for="item in options.creators"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="父级用户">
          <el-select
            v-model="filters.parentUserId"
            clearable
            placeholder="全部"
          >
            <el-option
              v-for="item in options.parentUsers"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRows">查询</el-button>
          <el-button @click="reset">重置</el-button>
          <el-button
            v-auth="'tenant:buyer-channel-stats:export'"
            :loading="exporting"
            @click="exportCurrent"
            >导出</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
    <PureTableBar title="渠道统计" :columns="tableColumns" @refresh="loadRows">
      <template #default="{ dynamicColumns }">
        <ChannelStatsTable
          :rows="rows"
          :loading="loading"
          :panel-for="daily.panelFor"
          :columns="dynamicColumns"
          @expand="expand"
          @save="saveDaily"
          @sort="sort"
        />
      </template>
    </PureTableBar>
  </div>
</template>

<style scoped>
.channel-stats-page {
  padding: 16px;
}

.filter-card {
  margin-bottom: 16px;
}

:deep(.filter-card .el-select) {
  width: 170px;
}
</style>
