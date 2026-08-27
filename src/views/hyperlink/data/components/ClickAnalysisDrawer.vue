<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  exportHyperlinkClickAnalysis,
  getHyperlinkClickAnalysis,
  type DataPackageCountryOption,
  type HyperlinkClickAnalysisBucket,
  type HyperlinkClickAnalysisMode,
  type HyperlinkClickAnalysisResult
} from "@/api/hyperlink-data-package";
import { apiErrorMessage } from "@/utils/api-error";
import { downloadBlobFile } from "@/utils/download";
import { dataPackageCountryFlag } from "../composables/useDataPackagePage";

defineOptions({ name: "HyperlinkClickAnalysisDrawer" });

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{ countries: DataPackageCountryOption[] }>();

const defaultThresholds = [5, 10, 15, 20];
const mode = ref<HyperlinkClickAnalysisMode>("never-click");
const dateRange = ref<[Date, Date]>(lastSevenDays());
const selectedCountry = ref("");
const groupByCountry = ref(false);
const thresholds = ref<number[]>([...defaultThresholds]);
const nextThreshold = ref<number | undefined>();
const countryKeyword = ref("");
const loading = ref(false);
const exportingKey = ref("");
const errorMessage = ref("");
const result = ref<HyperlinkClickAnalysisResult | null>(null);

const countryOptions = computed(() =>
  props.countries.filter(country => Boolean(country.countryIso2))
);
const quickCountries = computed(() => countryOptions.value.slice(0, 6));
const moreCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  return countryOptions.value.slice(6).filter(country => {
    if (!keyword) return true;
    return `${country.nameZh} ${country.countryIso2}`
      .toLowerCase()
      .includes(keyword);
  });
});
const modeTitle = computed(() =>
  mode.value === "never-click"
    ? "收到几次都没点（可多设几档）"
    : "点击比例最低多少（%，可多设几档）"
);
const modeHelp = computed(() =>
  mode.value === "never-click"
    ? "筛选成功发送达到指定次数、但从来没有点击过的号码。"
    : "筛选点击次数 ÷ 成功发送次数达到指定比例的号码。"
);
const displayBuckets = computed<HyperlinkClickAnalysisBucket[]>(() =>
  result.value?.buckets?.length
    ? result.value.buckets
    : thresholds.value.map(threshold => ({ threshold, count: 0, percent: 0 }))
);

watch(visible, opened => {
  if (opened) void refreshAnalysis();
});

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date): Date {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999
  );
}

function lastSevenDays(): [Date, Date] {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - 6);
  return [start, end];
}

function selectDatePreset(preset: "today" | "yesterday" | "week"): void {
  const date = startOfDay(new Date());
  if (preset === "yesterday") date.setDate(date.getDate() - 1);
  if (preset === "week") {
    dateRange.value = lastSevenDays();
  } else {
    dateRange.value = [date, endOfDay(date)];
  }
  void refreshAnalysis();
}

function selectCountry(value: string): void {
  selectedCountry.value = value;
  void refreshAnalysis();
}

function removeThreshold(value: number): void {
  if (thresholds.value.length <= 1) {
    ElMessage.warning("至少保留一个分析档位");
    return;
  }
  thresholds.value = thresholds.value.filter(item => item !== value);
  void refreshAnalysis();
}

function addThreshold(): void {
  const value = nextThreshold.value;
  if (!value || value <= 0) {
    ElMessage.warning("阈值必须大于 0");
    return;
  }
  if (!Number.isInteger(value)) {
    ElMessage.warning("分析阈值必须为整数");
    return;
  }
  if (mode.value === "uv-ratio" && value > 100) {
    ElMessage.warning("点击比例不能大于 100%");
    return;
  }
  thresholds.value = [...new Set([...thresholds.value, value])].sort(
    (left, right) => left - right
  );
  nextThreshold.value = undefined;
  void refreshAnalysis();
}

function resetThresholds(): void {
  thresholds.value = [...defaultThresholds];
  void refreshAnalysis();
}

async function refreshAnalysis(): Promise<void> {
  if (!dateRange.value?.[0] || !dateRange.value?.[1]) {
    ElMessage.warning("请选择分析时间范围");
    return;
  }
  const rangeDays =
    (dateRange.value[1].getTime() - dateRange.value[0].getTime()) / 86_400_000;
  if (rangeDays > 90) {
    ElMessage.warning("一次最多看 90 天");
    return;
  }
  loading.value = true;
  try {
    result.value = await getHyperlinkClickAnalysis(mode.value, {
      dateFrom: dateRange.value[0].getTime(),
      dateTo: dateRange.value[1].getTime(),
      thresholds: thresholds.value,
      dimension: groupByCountry.value ? "recipient_country" : undefined,
      countryIso2: selectedCountry.value || undefined
    });
    errorMessage.value = "";
  } catch (error) {
    result.value = null;
    errorMessage.value = apiErrorMessage(error, "点击分析加载失败");
    ElMessage.error(errorMessage.value);
  } finally {
    loading.value = false;
  }
}

async function exportBucket(
  bucket: HyperlinkClickAnalysisBucket,
  countryIso2?: string
): Promise<void> {
  const key = `${countryIso2 ?? "ALL"}-${bucket.threshold}`;
  exportingKey.value = key;
  try {
    const exported = await exportHyperlinkClickAnalysis(mode.value, {
      dateFrom: dateRange.value[0].getTime(),
      dateTo: dateRange.value[1].getTime(),
      threshold: bucket.threshold,
      countryIso2: countryIso2 || selectedCountry.value || undefined
    });
    downloadBlobFile(exported.filename, exported.blob);
    ElMessage.success(`已导出 ${exported.exportedCount} 个号码`);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "分析号码导出失败"));
  } finally {
    exportingKey.value = "";
  }
}
</script>

<template>
  <el-drawer
    v-model="visible"
    class="click-analysis-drawer"
    title="超链点击分析"
    size="880px"
    direction="rtl"
    destroy-on-close
  >
    <div v-loading="loading" class="analysis-content">
      <div class="drawer-subtitle">
        按号码的点击表现挑出号码并导出 · 一次最多看 90 天
      </div>

      <el-card shadow="never" class="filter-card">
        <div class="filter-line">
          <span class="filter-label">分析时间</span>
          <el-button-group>
            <el-button @click="selectDatePreset('today')">今天</el-button>
            <el-button @click="selectDatePreset('yesterday')">昨天</el-button>
            <el-button @click="selectDatePreset('week')">近 7 天</el-button>
          </el-button-group>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            @change="refreshAnalysis"
          />
        </div>

        <div class="filter-line country-line">
          <span class="filter-label">受众国家</span>
          <div class="country-buttons">
            <el-button
              :type="selectedCountry === '' ? 'primary' : 'default'"
              @click="selectCountry('')"
            >
              🌐 全部
            </el-button>
            <el-button
              v-for="country in quickCountries"
              :key="country.value"
              :type="
                selectedCountry === country.countryIso2 ? 'primary' : 'default'
              "
              @click="selectCountry(country.countryIso2!)"
            >
              {{ dataPackageCountryFlag(country.countryIso2) }}
              {{ country.nameZh }}
            </el-button>
            <el-popover
              v-if="countryOptions.length > 6"
              placement="bottom-start"
              :width="320"
              trigger="hover"
            >
              <template #reference>
                <el-button
                  >更多国家 ({{ countryOptions.length - 6 }})</el-button
                >
              </template>
              <el-input
                v-model="countryKeyword"
                clearable
                placeholder="搜索国家或 ISO2"
              />
              <div class="more-country-list">
                <el-button
                  v-for="country in moreCountries"
                  :key="country.value"
                  text
                  :type="
                    selectedCountry === country.countryIso2
                      ? 'primary'
                      : 'default'
                  "
                  @click="selectCountry(country.countryIso2!)"
                >
                  {{ dataPackageCountryFlag(country.countryIso2) }}
                  {{ country.nameZh }} ({{ country.countryIso2 }})
                </el-button>
                <el-empty
                  v-if="moreCountries.length === 0"
                  :image-size="52"
                  description="没有匹配国家"
                />
              </div>
            </el-popover>
          </div>
        </div>

        <div class="filter-line group-line">
          <span class="filter-label">结果展示</span>
          <el-switch
            v-model="groupByCountry"
            active-text="按国家分组"
            @change="refreshAnalysis"
          />
        </div>
      </el-card>

      <el-tabs v-model="mode" class="mode-tabs" @tab-change="refreshAnalysis">
        <el-tab-pane label="从来不点的号码" name="never-click" />
        <el-tab-pane label="点击率高的号码" name="uv-ratio" />
      </el-tabs>

      <el-card shadow="never" class="threshold-card">
        <div class="threshold-heading">
          <div>
            <strong>{{ modeTitle }}</strong>
            <p>{{ modeHelp }}</p>
          </div>
          <el-button link type="primary" @click="resetThresholds">
            恢复默认
          </el-button>
        </div>
        <div class="threshold-editor">
          <el-tag
            v-for="threshold in thresholds"
            :key="threshold"
            closable
            effect="plain"
            @close="removeThreshold(threshold)"
          >
            {{ threshold }}{{ mode === "uv-ratio" ? "%" : " 次" }}
          </el-tag>
          <el-input-number
            v-model="nextThreshold"
            :min="1"
            :max="mode === 'uv-ratio' ? 100 : 9999"
            :precision="0"
            controls-position="right"
            placeholder="新增档位"
          />
          <el-button type="primary" plain @click="addThreshold">添加</el-button>
          <el-button type="primary" @click="refreshAnalysis"
            >开始分析</el-button
          >
        </div>
      </el-card>

      <el-alert
        v-if="errorMessage"
        type="error"
        show-icon
        :closable="false"
        :title="errorMessage"
      >
        <el-button link type="primary" @click="refreshAnalysis">重试</el-button>
      </el-alert>
      <el-alert
        v-else-if="result && !result.factSourceReady"
        type="info"
        show-icon
        :closable="false"
        title="当前环境尚未接入超链任务点击事实，以下按真实空结果展示。"
      />

      <div class="result-header">
        <span>成功发送去重号码</span>
        <strong>{{ (result?.totalPhones ?? 0).toLocaleString() }}</strong>
      </div>

      <template v-if="groupByCountry && result?.countries?.length">
        <el-card
          v-for="country in result.countries"
          :key="country.countryIso2"
          shadow="never"
          class="country-result"
        >
          <div class="country-result-title">
            <strong>
              {{ dataPackageCountryFlag(country.countryIso2) }}
              {{ country.countryIso2 }}
            </strong>
            <span>成功发送去重 {{ country.totalPhones.toLocaleString() }}</span>
          </div>
          <div class="bucket-grid">
            <div
              v-for="bucket in country.buckets"
              :key="bucket.threshold"
              class="bucket-item"
            >
              <div class="bucket-title">
                <span>
                  ≥ {{ bucket.threshold
                  }}{{ mode === "uv-ratio" ? "%" : " 次" }}
                </span>
                <el-button
                  v-auth="'tenant:hyperlink_data:export'"
                  link
                  type="primary"
                  :loading="
                    exportingKey ===
                    `${country.countryIso2}-${bucket.threshold}`
                  "
                  @click="exportBucket(bucket, country.countryIso2)"
                >
                  导出号码
                </el-button>
              </div>
              <strong>{{ bucket.count.toLocaleString() }}</strong>
              <el-progress :percentage="bucket.percent" :stroke-width="8" />
            </div>
          </div>
        </el-card>
      </template>
      <div v-else class="bucket-grid">
        <div
          v-for="bucket in displayBuckets"
          :key="bucket.threshold"
          class="bucket-item"
        >
          <div class="bucket-title">
            <span>
              ≥ {{ bucket.threshold }}{{ mode === "uv-ratio" ? "%" : " 次" }}
            </span>
            <el-button
              v-auth="'tenant:hyperlink_data:export'"
              link
              type="primary"
              :loading="exportingKey === `ALL-${bucket.threshold}`"
              @click="exportBucket(bucket)"
            >
              导出号码
            </el-button>
          </div>
          <strong>{{ bucket.count.toLocaleString() }}</strong>
          <el-progress :percentage="bucket.percent" :stroke-width="8" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 360px;
}

.drawer-subtitle,
.threshold-heading p,
.country-result-title span {
  color: var(--el-text-color-secondary);
}

.filter-card :deep(.el-card__body),
.threshold-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-line,
.country-buttons,
.threshold-heading,
.threshold-editor,
.result-header,
.country-result-title,
.bucket-title {
  display: flex;
  align-items: center;
}

.filter-line,
.country-buttons,
.threshold-editor {
  flex-wrap: wrap;
  gap: 8px;
}

.filter-label {
  width: 68px;
  flex: 0 0 68px;
  font-weight: 600;
}

.country-buttons {
  flex: 1;
}

.more-country-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 260px;
  padding-top: 10px;
  overflow: auto;
}

.threshold-heading,
.result-header,
.country-result-title,
.bucket-title {
  justify-content: space-between;
  gap: 12px;
}

.threshold-heading p {
  margin: 5px 0 0;
  font-size: 13px;
}

.threshold-editor :deep(.el-input-number) {
  width: 130px;
}

.result-header {
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.result-header strong {
  font-size: 24px;
  color: var(--el-color-primary);
}

.bucket-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bucket-item {
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.bucket-item > strong {
  display: block;
  margin: 7px 0;
  font-size: 22px;
}

.country-result-title {
  margin-bottom: 12px;
}

@media (width <= 900px) {
  :global(.click-analysis-drawer) {
    width: 100% !important;
  }

  .filter-label {
    width: 100%;
    flex-basis: 100%;
  }

  .bucket-grid {
    grid-template-columns: 1fr;
  }
}
</style>
