<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import FacebookDetectIcon from "~icons/logos/facebook";
import TikTokDetectIcon from "~icons/logos/tiktok-icon";
import {
  deleteBuyerChannel,
  detectBuyerChannel,
  listBuyerChannels,
  type BuyerChannelOptions,
  type BuyerChannelRow,
  type ChannelPlatform,
  type ChannelDetectResult
} from "@/api/buyer-channel";
import { listBuyerTemplateOptions } from "@/api/buyer-template";
import { listIpCountryOptions } from "@/api/resource-ip";
import ChannelDetectDialog from "./components/ChannelDetectDialog.vue";
import ChannelFormDrawer from "./components/ChannelFormDrawer.vue";
import FacebookEventGuideDialog from "./components/FacebookEventGuideDialog.vue";
import { previewPlatformOptions } from "./components/channel-platform-fields";
import { previewOwnerOptions } from "./components/channel-preview-options";
import { toBuyerChannelCountries } from "./domain/channel-country-options";
import { openSafeChannelLink } from "./domain/channel-domain";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "BuyerChannel" });

const previewOptions: BuyerChannelOptions = {
  uploadFee: { label: "买量通道上号成功费用", value: 0.05 },
  platforms: previewPlatformOptions,
  eventOptions: [],
  countries: [],
  templates: [],
  owners: previewOwnerOptions,
  creators: previewOwnerOptions,
  parentUsers: previewOwnerOptions
};
const filters = reactive<{
  targetCountry?: string;
  templateId?: number;
  creatorId?: number;
  parentUserId?: number;
}>({});
const options = ref<BuyerChannelOptions>(previewOptions);
const rows = ref<BuyerChannelRow[]>([]);
const errorMessage = ref("");
const loading = ref(false);
const page = ref(1);
const pageSize = ref(30);
const pageSizes = [30, 60, 200, 500];
const total = ref(0);
const drawerVisible = ref(false);
const editingId = ref<number>();
const guideVisible = ref(false);
const detectVisible = ref(false);
const detectResult = ref<ChannelDetectResult | null>(null);

const columns = [
  { label: "渠道名称", prop: "name" },
  { label: "推广码", prop: "channelCode" },
  { label: "目标国家", prop: "targetCountry" },
  { label: "绑定模板", prop: "templateName" },
  { label: "推广平台", prop: "platform" },
  { label: "FB域名状态", prop: "domainStatus" },
  { label: "推广链接", prop: "promotionUrl" },
  { label: "裂变链接", prop: "fissionUrl" },
  { label: "预选区号", prop: "defaultDialCode" },
  { label: "状态", prop: "status" },
  { label: "创建人", prop: "creatorName" },
  { label: "创建时间", prop: "createdAt" }
];

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const result = await listBuyerChannels({
      page: page.value,
      page_size: pageSize.value,
      ...filters
    });
    rows.value = result.list;
    total.value = result.total;
    errorMessage.value = "";
  } catch (error) {
    rows.value = [];
    total.value = 0;
    errorMessage.value = apiErrorMessage(error, "渠道列表加载失败");
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
}

function add(): void {
  editingId.value = undefined;
  drawerVisible.value = true;
}
function edit(row: BuyerChannelRow): void {
  editingId.value = row.id;
  drawerVisible.value = true;
}
function query(): void {
  page.value = 1;
  void refresh();
}
function openLink(url: string): void {
  try {
    openSafeChannelLink(url);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "链接无效");
  }
}

function supportsDetection(row: BuyerChannelRow): boolean {
  return row.platform === "FACEBOOK" || row.platform === "TIKTOK";
}

function detectionIcon(platform: ChannelPlatform) {
  return platform === "TIKTOK" ? TikTokDetectIcon : FacebookDetectIcon;
}

function platformLabel(platform: ChannelPlatform): string {
  return (
    previewOptions.platforms.find(option => option.value === platform)?.label ??
    platform
  );
}

async function detect(row: BuyerChannelRow): Promise<void> {
  if (!supportsDetection(row)) return;
  try {
    detectResult.value = await detectBuyerChannel(row.id);
    detectVisible.value = true;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "渠道检测失败");
  }
}

async function remove(row: BuyerChannelRow): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除渠道“${row.name}”吗？`, "删除确认", {
      type: "warning"
    });
    await deleteBuyerChannel(row.id);
    ElMessage.success("渠道已删除");
    await refresh();
  } catch (error) {
    if (error === "cancel" || error === "close") return;
    ElMessage.error(
      error instanceof Error ? error.message : "渠道仍被占用，无法删除"
    );
  }
}

onMounted(async () => {
  const [countryResult, templateResult] = await Promise.allSettled([
    listIpCountryOptions(),
    listBuyerTemplateOptions()
  ]);
  options.value = {
    ...previewOptions,
    countries:
      countryResult.status === "fulfilled"
        ? toBuyerChannelCountries(countryResult.value)
        : [],
    templates: templateResult.status === "fulfilled" ? templateResult.value : []
  };
  if (countryResult.status === "rejected") {
    ElMessage.error("目标国家加载失败");
  }
  if (templateResult.status === "rejected") {
    ElMessage.error("模板选项加载失败");
  }
  await refresh();
});
</script>

<template>
  <div class="channel-page">
    <el-alert
      class="fee-banner"
      type="warning"
      show-icon
      :closable="false"
      :title="`${options.uploadFee.label}：${options.uploadFee.value}`"
    />
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="目标国家"
          ><el-select
            v-model="filters.targetCountry"
            clearable
            filterable
            placeholder="全部"
            ><el-option
              v-for="item in options.countries"
              :key="item.code"
              :label="item.name"
              :value="item.code" /></el-select
        ></el-form-item>
        <el-form-item label="模板"
          ><el-select v-model="filters.templateId" clearable placeholder="全部"
            ><el-option
              v-for="item in options.templates"
              :key="item.id"
              :label="item.name"
              :value="item.id" /></el-select
        ></el-form-item>
        <el-form-item label="创建人"
          ><el-select v-model="filters.creatorId" clearable placeholder="全部"
            ><el-option
              v-for="item in options.creators"
              :key="item.id"
              :label="item.name"
              :value="item.id" /></el-select
        ></el-form-item>
        <el-form-item label="父级用户"
          ><el-select
            v-model="filters.parentUserId"
            clearable
            placeholder="全部"
            ><el-option
              v-for="item in options.parentUsers"
              :key="item.id"
              :label="item.name"
              :value="item.id" /></el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" @click="query">查询</el-button
          ><el-button
            @click="
              Object.keys(filters).forEach(key => delete filters[key]);
              query();
            "
            >重置</el-button
          ></el-form-item
        >
      </el-form>
    </el-card>
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      description="渠道列表加载失败"
      type="error"
      show-icon
      :closable="false"
    >
      <el-button link type="primary" @click="refresh">重试</el-button>
    </el-alert>
    <PureTableBar title="渠道管理" :columns="columns" @refresh="refresh">
      <template #buttons>
        <el-button link type="primary" @click="guideVisible = true"
          >Facebook事件配置指引</el-button
        >
        <el-button
          v-auth="'tenant:buyer-channel:create'"
          type="primary"
          @click="add"
          >新增</el-button
        >
        <el-button @click="refresh">刷新</el-button>
      </template>
      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" border>
          <el-table-column
            v-for="column in dynamicColumns"
            :key="column.prop"
            v-bind="column"
            min-width="130"
          >
            <template
              v-if="
                column.prop === 'promotionUrl' || column.prop === 'fissionUrl'
              "
              #default="{ row }"
              ><el-button
                link
                type="primary"
                @click="openLink(row[column.prop])"
                >打开链接</el-button
              ></template
            >
            <template v-else-if="column.prop === 'status'" #default="{ row }"
              ><el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">{{
                row.status === "ENABLED" ? "启用" : "禁用"
              }}</el-tag></template
            >
            <template v-else-if="column.prop === 'platform'" #default="{ row }"
              ><el-tag type="info">{{ platformLabel(row.platform) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="210">
            <template #default="{ row }">
              <el-button
                v-auth="'tenant:buyer-channel:edit'"
                link
                type="primary"
                @click="edit(row)"
                >编辑</el-button
              >
              <el-button
                v-if="supportsDetection(row)"
                v-auth="'tenant:buyer-channel:detect'"
                link
                type="primary"
                :icon="detectionIcon(row.platform)"
                @click="detect(row)"
                >探测</el-button
              >
              <el-button
                v-auth="'tenant:buyer-channel:delete'"
                link
                type="danger"
                @click="remove(row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
          <template #empty><el-empty description="暂无渠道" /></template>
        </el-table>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          class="pagination"
          :page-sizes="pageSizes"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="refresh"
          @size-change="query"
        />
      </template>
    </PureTableBar>
    <ChannelFormDrawer
      v-model="drawerVisible"
      :channel-id="editingId"
      :options="options"
      @saved="refresh"
    />
    <FacebookEventGuideDialog v-model="guideVisible" />
    <ChannelDetectDialog v-model="detectVisible" :result="detectResult" />
  </div>
</template>

<style scoped>
.channel-page {
  padding: 16px;
}

.fee-banner,
.filter-card,
.channel-page > .el-alert {
  margin-bottom: 16px;
}

.pagination {
  justify-content: flex-end;
  margin-top: 16px;
}

:deep(.filter-card .el-select) {
  width: 180px;
}
</style>
