<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  countHyperlinkTaskAccounts,
  type HyperlinkAccountFilter,
  type HyperlinkAccountMatchCount,
  type HyperlinkFilterOptions
} from "@/api/hyperlink-task";
import { apiErrorMessage } from "@/utils/api-error";
import {
  createEmptyAccountFilter,
  normalizeAccountFilter,
  validateAccountFilter
} from "../domain/editor-rules";

const visible = defineModel<boolean>({ required: true });
const value = defineModel<HyperlinkAccountFilter>("value", { required: true });
const props = defineProps<{
  options: HyperlinkFilterOptions;
  defaultGroupIds: number[];
  optionErrors?: Record<string, string>;
  countAccounts?: (
    filter: HyperlinkAccountFilter,
    signal?: AbortSignal
  ) => Promise<HyperlinkAccountMatchCount>;
}>();
const emit = defineEmits<{
  (event: "confirmed", value: HyperlinkAccountFilter): void;
}>();

const draft = ref<HyperlinkAccountFilter>(createEmptyAccountFilter());
const match = ref<HyperlinkAccountMatchCount | null>(null);
const matching = ref(false);
const matchError = ref("");
const groupKeyword = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
let controller: AbortController | undefined;
let sequence = 0;

const createdRange = computed<[number, number] | null>({
  get: () =>
    draft.value.createdAtFrom != null && draft.value.createdAtTo != null
      ? ([draft.value.createdAtFrom, draft.value.createdAtTo] as [
          number,
          number
        ])
      : null,
  set: range => {
    draft.value.createdAtFrom = range?.[0] ?? null;
    draft.value.createdAtTo = range?.[1] ?? null;
  }
});
const hasConditions = computed(
  () =>
    JSON.stringify(draft.value) !==
    JSON.stringify(createEmptyAccountFilter(props.defaultGroupIds))
);
const contextOptionError = computed(
  () => props.optionErrors?.["创建上下文"] ?? ""
);
const registerDayOptions = [90, 180, 365, 730, 1095];
const continentOptions = [
  { value: "ASIA", label: "亚洲" },
  { value: "AFRICA", label: "非洲" },
  { value: "EUROPE", label: "欧洲" },
  { value: "NORTH_AMERICA", label: "北美洲" },
  { value: "SOUTH_AMERICA", label: "南美洲" },
  { value: "OCEANIA", label: "大洋洲" },
  { value: "ANTARCTICA", label: "南极洲" }
];
const filteredGroupOptions = computed(() => {
  const keyword = groupKeyword.value.trim().toLowerCase();
  if (!keyword) return props.options.groups;
  return props.options.groups.filter(option =>
    [option.label, ...(option.tags ?? [])].some(value =>
      value.toLowerCase().includes(keyword)
    )
  );
});

function cloneFilter(input: HyperlinkAccountFilter): HyperlinkAccountFilter {
  return JSON.parse(JSON.stringify(input)) as HyperlinkAccountFilter;
}

function stopPending(): void {
  if (timer) clearTimeout(timer);
  timer = undefined;
  controller?.abort();
  controller = undefined;
}

function scheduleCount(): void {
  if (!visible.value) return;
  stopPending();
  const current = ++sequence;
  match.value = null;
  matchError.value = "";
  matching.value = true;
  timer = setTimeout(() => void runCount(current), 250);
}

async function runCount(current: number): Promise<void> {
  if (current !== sequence) return;
  controller?.abort();
  const nextController = new AbortController();
  controller = nextController;
  matching.value = true;
  matchError.value = "";
  try {
    const normalized = normalizeAccountFilter(draft.value);
    const filterError = validateAccountFilter(normalized);
    if (filterError) {
      matchError.value = filterError;
      return;
    }
    const result = await (props.countAccounts ?? countHyperlinkTaskAccounts)(
      normalized,
      nextController.signal
    );
    if (sequence === current) match.value = result;
  } catch (error) {
    if (nextController.signal.aborted || sequence !== current) return;
    match.value = null;
    matchError.value = apiErrorMessage(error, "账号试算失败");
  } finally {
    if (sequence === current) matching.value = false;
  }
}

async function refreshCount(): Promise<void> {
  if (!visible.value) return;
  stopPending();
  const current = ++sequence;
  match.value = null;
  matchError.value = "";
  matching.value = true;
  await runCount(current);
}

function cancel(): void {
  stopPending();
  sequence += 1;
  matching.value = false;
  visible.value = false;
}

function clear(): void {
  draft.value = createEmptyAccountFilter(props.defaultGroupIds);
}

function confirm(): void {
  const normalized = normalizeAccountFilter(draft.value);
  const error = validateAccountFilter(normalized);
  if (error) {
    ElMessage.warning(error);
    return;
  }
  value.value = cloneFilter(normalized);
  emit("confirmed", normalized);
  visible.value = false;
}

watch(visible, opened => {
  if (!opened) {
    stopPending();
    return;
  }
  draft.value = cloneFilter(value.value);
  groupKeyword.value = "";
  scheduleCount();
});
watch(draft, scheduleCount, { deep: true });
onBeforeUnmount(stopPending);
</script>

<template>
  <el-drawer
    v-model="visible"
    title="账号范围筛选"
    size="760px"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="cancel"
  >
    <template #header>
      <div class="drawer-header">
        <b>账号范围筛选</b>
        <el-tag type="success" effect="plain">仅圈定有效账号</el-tag>
      </div>
    </template>

    <div class="count-banner">
      <div>
        <small>实时匹配账号</small
        ><b>{{ matching ? "..." : (match?.availableAccountCount ?? 0) }}</b>
      </div>
      <div>
        <small>协议数</small
        ><b>{{ matching ? "..." : (match?.protocolCount ?? 0) }}</b>
      </div>
      <div>
        <small>最大执行账号</small
        ><b>{{ matching ? "..." : (match?.maxConcurrentNum ?? 0) }}</b>
      </div>
      <el-button v-if="matchError" link type="danger" @click="refreshCount">
        {{ matchError }}，重试
      </el-button>
    </div>

    <el-form label-position="top" class="filter-form">
      <el-card shadow="never">
        <template #header><b>所属分组</b></template>
        <el-form-item label="账号分组">
          <el-select
            v-model="draft.groupIds"
            multiple
            filterable
            :filter-method="query => (groupKeyword = query)"
            clearable
            collapse-tags
            :disabled="Boolean(contextOptionError)"
            placeholder="不选表示不限分组；支持名称/标签搜索"
          >
            <el-option
              v-for="option in filteredGroupOptions"
              :key="option.value"
              :label="option.label"
              :value="Number(option.value)"
            />
          </el-select>
          <small>
            新建与清空默认选择系统业务组 public +
            hyperlink；可手动删除后不限业务组。搜索同时匹配名称和
            tags；当前后端未返回 tags 时只按名称匹配。
          </small>
        </el-form-item>
      </el-card>

      <el-card shadow="never">
        <template #header><b>地理范围</b></template>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="账号所属大洲">
              <el-select v-model="draft.continent" clearable placeholder="不限">
                <el-option
                  v-for="item in continentOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家（包含）">
              <el-select
                v-model="draft.countryIso2s"
                multiple
                filterable
                clearable
                :disabled="Boolean(contextOptionError)"
              >
                <el-option
                  v-for="item in options.countries"
                  :key="item.value"
                  :label="item.label"
                  :value="String(item.value)"
                  :disabled="
                    draft.excludeCountryIso2s.includes(String(item.value))
                  "
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家（排除）">
              <el-select
                v-model="draft.excludeCountryIso2s"
                multiple
                filterable
                clearable
                :disabled="Boolean(contextOptionError)"
              >
                <el-option
                  v-for="item in options.countries"
                  :key="item.value"
                  :label="item.label"
                  :value="String(item.value)"
                  :disabled="draft.countryIso2s.includes(String(item.value))"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="never">
        <template #header><b>账号画像</b></template>
        <el-row :gutter="12">
          <el-col :span="12"
            ><el-form-item label="手机号"
              ><el-input
                v-model="draft.phone"
                clearable
                placeholder="模糊匹配" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="导入批次号"
              ><el-input-number
                v-model="draft.importBatchId"
                :min="1"
                :precision="0"
                class="full-width" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="在线状态"
              ><el-select
                v-model="draft.onlineStatus"
                clearable
                placeholder="不限"
                ><el-option label="在线" value="ONLINE" /><el-option
                  label="离线"
                  value="OFFLINE" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="轮换状态"
              ><el-select
                v-model="draft.rotationStatus"
                clearable
                placeholder="不限"
                ><el-option label="未轮换" :value="0" /><el-option
                  label="轮换中"
                  :value="1" /><el-option label="已完成" :value="2" /><el-option
                  label="失败"
                  :value="3" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="账号类型"
              ><el-select
                v-model="draft.accountType"
                clearable
                placeholder="不限"
                ><el-option label="个人" :value="1" /><el-option
                  label="商业"
                  :value="2" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="导入方式"
              ><el-select
                v-model="draft.importMode"
                clearable
                placeholder="不限"
                ><el-option label="六段" value="six_segment" /><el-option
                  label="全参"
                  value="full_param" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="类型"
              ><el-select v-model="draft.widType" clearable placeholder="不限"
                ><el-option label="分身设备" value="web5" /><el-option
                  label="主设备"
                  value="native6" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="设备类型"
              ><el-select v-model="draft.platform" clearable placeholder="不限"
                ><el-option
                  label="Android 个人"
                  value="ANDROID_PERSONAL" /><el-option
                  label="Android 商业主设备"
                  value="ANDROID_BUSINESS_PRIMARY" /><el-option
                  label="Android 商业伴侣"
                  value="ANDROID_BUSINESS_COMPANION" /><el-option
                  label="iOS 个人"
                  value="IOS_PERSONAL" /><el-option
                  label="iOS 商业主设备"
                  value="IOS_BUSINESS_PRIMARY" /><el-option
                  label="iOS 商业伴侣"
                  value="IOS_BUSINESS_COMPANION" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="账号性质"
              ><el-select v-model="draft.source" clearable placeholder="不限"
                ><el-option label="买量" :value="0" /><el-option
                  label="自登"
                  :value="1" /><el-option label="买入" :value="2" /><el-option
                  label="转入"
                  :value="3" /><el-option
                  label="群扫码"
                  :value="4" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="允许拉群"
              ><el-select
                v-model="draft.groupInviteAllowed"
                clearable
                placeholder="不限"
                ><el-option label="允许" :value="true" /><el-option
                  label="不允许"
                  :value="false" /></el-select></el-form-item
          ></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12"
            ><el-form-item label="双向好友数 ≥"
              ><el-input-number
                v-model="draft.friendCountMin"
                :min="0"
                :precision="0"
                class="full-width" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="双向好友数 ≤"
              ><el-input-number
                v-model="draft.friendCountMax"
                :min="0"
                :precision="0"
                class="full-width" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="存活天数 ≥"
              ><el-input-number
                v-model="draft.retentionDaysMin"
                :min="0"
                :step="0.1"
                :precision="1"
                class="full-width" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="存活天数 ≤"
              ><el-input-number
                v-model="draft.retentionDaysMax"
                :min="0"
                :step="0.1"
                :precision="1"
                class="full-width" /></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="注册天数 ≥"
              ><el-select
                v-model="draft.registerDaysMin"
                filterable
                allow-create
                clearable
                placeholder="不限，可输入或选择"
                ><el-option
                  v-for="day in registerDayOptions"
                  :key="day"
                  :label="`${day} 天`"
                  :value="day" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="注册天数 ≤"
              ><el-select
                v-model="draft.registerDaysMax"
                filterable
                allow-create
                clearable
                placeholder="不限，可输入或选择"
                ><el-option
                  v-for="day in registerDayOptions"
                  :key="day"
                  :label="`${day} 天`"
                  :value="day" /></el-select></el-form-item
          ></el-col>
        </el-row>
      </el-card>

      <el-card shadow="never">
        <template #header><b>协议与渠道</b></template>
        <el-alert
          v-if="contextOptionError"
          type="warning"
          :closable="false"
          :title="`${contextOptionError}，账号分组、国家、渠道和协议候选暂不可用`"
        />
        <el-row :gutter="12">
          <el-col :span="12"
            ><el-form-item label="协议"
              ><el-select
                v-model="draft.protocolId"
                filterable
                clearable
                placeholder="不限"
                :disabled="Boolean(contextOptionError)"
                ><el-option
                  v-for="item in options.protocols"
                  :key="item.value"
                  :label="item.label"
                  :value="String(item.value)" /></el-select></el-form-item
          ></el-col>
          <el-col :span="12"
            ><el-form-item label="渠道"
              ><el-select
                v-model="draft.channelIds"
                multiple
                filterable
                clearable
                placeholder="不限（可多选）"
                :disabled="Boolean(contextOptionError)"
                ><el-option
                  v-for="item in options.channels"
                  :key="item.value"
                  :label="item.label"
                  :value="Number(item.value)" /></el-select></el-form-item
          ></el-col>
        </el-row>
      </el-card>

      <el-card shadow="never">
        <template #header><b>入库时间</b></template>
        <el-date-picker
          v-model="createdRange"
          type="datetimerange"
          value-format="x"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="full-width"
          :shortcuts="[
            {
              text: '今日',
              value: () => [new Date().setHours(0, 0, 0, 0), Date.now()]
            },
            {
              text: '近7日',
              value: () => [Date.now() - 7 * 86400000, Date.now()]
            },
            {
              text: '近30日',
              value: () => [Date.now() - 30 * 86400000, Date.now()]
            }
          ]"
        />
      </el-card>
    </el-form>

    <template #footer>
      <el-button :disabled="!hasConditions" @click="clear">清空条件</el-button>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.drawer-header,
.count-banner {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.count-banner {
  padding: 14px 18px;
  margin-bottom: 14px;
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
}

.count-banner > div {
  display: grid;
  gap: 4px;
}

.count-banner b {
  font-size: 22px;
  color: var(--el-color-primary);
}

.count-banner small,
.filter-form small {
  color: var(--el-text-color-secondary);
}

.filter-form {
  display: grid;
  gap: 12px;
}

.full-width,
:deep(.el-select) {
  width: 100%;
}
</style>
