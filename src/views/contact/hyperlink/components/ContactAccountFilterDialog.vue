<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useContactAccountOptions } from "../composables/useContactAccountOptions";
import {
  emptyAccountFilterForm,
  type AccountFilterForm
} from "../domain/account-filter";

const props = defineProps<{
  modelValue: boolean;
  filter: AccountFilterForm;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm", value: AccountFilterForm): void;
}>();

/** 账号类型取值与账号管理页一致。 */
const ACCOUNT_TYPE_OPTIONS = [
  { value: 1, label: "个人号" },
  { value: 2, label: "商业号" }
];

const ONLINE_STATUS_OPTIONS = [
  { value: "ONLINE", label: "在线" },
  { value: "OFFLINE", label: "离线" }
];

/** 设备类型：机型 × 账号性质 × 协议后端的组合，取值与超链任务共用。 */
const PLATFORM_OPTIONS = [
  { value: "ANDROID_PERSONAL", label: "Android 个人" },
  { value: "ANDROID_BUSINESS_PRIMARY", label: "Android 商业主设备" },
  { value: "ANDROID_BUSINESS_COMPANION", label: "Android 商业分身" },
  { value: "IOS_PERSONAL", label: "iOS 个人" },
  { value: "IOS_BUSINESS_PRIMARY", label: "iOS 商业主设备" },
  { value: "IOS_BUSINESS_COMPANION", label: "iOS 商业分身" }
];

const CONTINENT_OPTIONS = [
  { value: "ASIA", label: "亚洲" },
  { value: "AFRICA", label: "非洲" },
  { value: "EUROPE", label: "欧洲" },
  { value: "NORTH_AMERICA", label: "北美洲" },
  { value: "SOUTH_AMERICA", label: "南美洲" },
  { value: "OCEANIA", label: "大洋洲" },
  { value: "ANTARCTICA", label: "南极洲" }
];

const ROTATION_STATUS_OPTIONS = [
  { value: 0, label: "未轮换" },
  { value: 1, label: "轮换中" },
  { value: 2, label: "已完成" },
  { value: 3, label: "轮换失败" }
];

const IMPORT_MODE_OPTIONS = [
  { value: "six_segment", label: "六段" },
  { value: "full_param", label: "全参" }
];

const WID_TYPE_OPTIONS = [
  { value: "web5", label: "分身设备" },
  { value: "native6", label: "主设备" }
];

const GROUP_INVITE_OPTIONS = [
  { value: true, label: "允许" },
  { value: false, label: "禁止" }
];

const MARKETING_SOURCE_OPTIONS = [
  { value: 0, label: "买量" },
  { value: 1, label: "自登" },
  { value: 2, label: "买入" },
  { value: 3, label: "转入" },
  { value: 4, label: "群扫码" }
];

const draft = ref<AccountFilterForm>(emptyAccountFilterForm());

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

const {
  options,
  loading: optionsLoading,
  error: optionsError,
  reload: reloadOptions
} = useContactAccountOptions(visible);

// 历史筛选中的已删除/停用项仍保留 ID，避免编辑时悄悄扩大账号范围。
const unavailableGroups = computed(() =>
  draft.value.groupIds.filter(
    id => !options.value.groups.some(o => o.id === id)
  )
);
const unavailableChannels = computed(() =>
  draft.value.channelIds.filter(
    id => !options.value.channels.some(o => o.id === id)
  )
);

watch(
  () => props.modelValue,
  open => {
    if (open) {
      draft.value = { ...props.filter };
    }
  },
  { immediate: true }
);

/** 日期区间控件用一个数组，落到表单是两个独立字段。 */
const createdRange = computed<[number, number] | null>(() =>
  draft.value.createdAtFrom != null && draft.value.createdAtTo != null
    ? [draft.value.createdAtFrom, draft.value.createdAtTo]
    : null
);

function applyCreatedRange(value: [number, number] | null) {
  draft.value.createdAtFrom = value ? Number(value[0]) : null;
  draft.value.createdAtTo = value ? Number(value[1]) : null;
}

function reset() {
  draft.value = emptyAccountFilterForm();
}

function confirm() {
  emit("confirm", { ...draft.value });
  visible.value = false;
}
</script>

<template>
  <el-dialog v-model="visible" title="账号范围" width="720px" append-to-body>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      class="filter-tip"
      title="不设置任何条件即为「全部有效账号」。筛选条件与超链任务共用同一套下推 SQL，列出的每一项都真的会生效。"
    />

    <el-alert
      v-if="optionsError"
      type="error"
      :closable="false"
      show-icon
      class="filter-tip"
      :title="optionsError"
    >
      <el-button link type="primary" @click="reloadOptions">
        重新加载
      </el-button>
    </el-alert>

    <el-form :disabled="readonly" label-width="110px">
      <el-form-item label="包含国家">
        <el-select
          v-model="draft.countryIso2s"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="留空表示不限国家，填 ISO2 代码如 CN"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="排除国家">
        <el-select
          v-model="draft.excludeCountryIso2s"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="这些国家的号不参与本任务"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="账号分组">
        <el-select
          v-model="draft.groupIds"
          multiple
          filterable
          :loading="optionsLoading"
          :disabled="optionsLoading || Boolean(optionsError)"
          placeholder="请选择账号分组，可搜索名称"
          no-data-text="暂无账号分组"
          class="filter-control"
        >
          <el-option
            v-for="option in options.groups"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
          <el-option
            v-for="id in unavailableGroups"
            :key="id"
            :label="`已选分组 #${id}（当前不可选）`"
            :value="id"
            disabled
          />
        </el-select>
      </el-form-item>
      <el-form-item label="渠道">
        <el-select
          v-model="draft.channelIds"
          multiple
          filterable
          :loading="optionsLoading"
          :disabled="optionsLoading || Boolean(optionsError)"
          placeholder="请选择推广渠道，可搜索名称"
          no-data-text="暂无可用推广渠道"
          class="filter-control"
        >
          <el-option
            v-for="option in options.channels"
            :key="option.id"
            :label="option.name"
            :value="option.id"
          />
          <el-option
            v-for="id in unavailableChannels"
            :key="id"
            :label="`已选渠道 #${id}（当前不可选）`"
            :value="id"
            disabled
          />
        </el-select>
      </el-form-item>
      <el-form-item label="协议">
        <el-input
          v-model="draft.protocolId"
          clearable
          placeholder="留空表示不限协议"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="账号类型">
        <el-select
          v-model="draft.accountType"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in ACCOUNT_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input
          v-model="draft.phone"
          clearable
          placeholder="按号码模糊匹配"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="通讯录好友数">
        <div class="range-row">
          <el-input-number
            v-model="draft.contactNamedNumMin"
            :min="0"
            controls-position="right"
            placeholder="最小"
          />
          <span class="range-sep">至</span>
          <el-input-number
            v-model="draft.contactNamedNumMax"
            :min="0"
            controls-position="right"
            placeholder="最大"
          />
        </div>
        <div class="field-hint">
          指通讯录里<b>有名字</b>的联系人数，也就是本任务实际会发送的人数；
          不是「双向好友」——那个口径两套协议都不暴露，至今没有采集源。
        </div>
      </el-form-item>
      <el-form-item label="在线状态">
        <el-select
          v-model="draft.onlineStatus"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in ONLINE_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="设备类型">
        <el-select
          v-model="draft.platform"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in PLATFORM_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间">
        <el-date-picker
          :model-value="createdRange"
          type="datetimerange"
          value-format="x"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          class="filter-control"
          @update:model-value="applyCreatedRange"
        />
      </el-form-item>
      <el-form-item label="注册天数">
        <div class="range-row">
          <el-input-number
            v-model="draft.registerDaysMin"
            :min="0"
            controls-position="right"
            placeholder="最小"
          />
          <span class="range-sep">至</span>
          <el-input-number
            v-model="draft.registerDaysMax"
            :min="0"
            controls-position="right"
            placeholder="最大"
          />
        </div>
      </el-form-item>
      <el-form-item label="存活天数">
        <div class="range-row">
          <el-input-number
            v-model="draft.retentionDaysMin"
            :min="0"
            :step="0.1"
            :precision="1"
            controls-position="right"
            placeholder="最小"
          />
          <span class="range-sep">至</span>
          <el-input-number
            v-model="draft.retentionDaysMax"
            :min="0"
            :step="0.1"
            :precision="1"
            controls-position="right"
            placeholder="最大"
          />
        </div>
      </el-form-item>
      <el-form-item label="账号所属大洲">
        <el-select
          v-model="draft.continent"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in CONTINENT_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="允许拉群">
        <el-select
          v-model="draft.groupInviteAllowed"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in GROUP_INVITE_OPTIONS"
            :key="String(option.value)"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="轮换状态">
        <el-select
          v-model="draft.rotationStatus"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in ROTATION_STATUS_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="导入方式">
        <el-select
          v-model="draft.importMode"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in IMPORT_MODE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select
          v-model="draft.widType"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in WID_TYPE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="运营来源">
        <el-select
          v-model="draft.source"
          clearable
          placeholder="不限"
          class="filter-control"
        >
          <el-option
            v-for="option in MARKETING_SOURCE_OPTIONS"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="导入批次号">
        <el-input-number
          v-model="draft.importBatchId"
          :min="1"
          controls-position="right"
          placeholder="按批次 ID 限定"
          class="filter-control"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="readonly" @click="reset">清空条件</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="readonly" @click="confirm">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.filter-tip {
  margin-bottom: 14px;
}

.filter-control {
  width: 100%;
}

.range-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.range-sep {
  color: var(--el-text-color-secondary);
}

.field-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
</style>
