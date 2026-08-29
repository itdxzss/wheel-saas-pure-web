<script setup lang="ts">
import { computed, ref, watch } from "vue";
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

const draft = ref<AccountFilterForm>(emptyAccountFilterForm());

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});

watch(
  () => props.modelValue,
  open => {
    if (open) {
      draft.value = { ...props.filter };
    }
  },
  { immediate: true }
);

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
      title="不设置任何条件即为「全部有效账号」；这里只列出后端真正会应用的筛选项。"
    />

    <el-form :disabled="readonly" label-width="110px">
      <el-form-item label="包含国家">
        <el-select
          v-model="draft.country_iso2s"
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
          v-model="draft.exclude_country_iso2s"
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
          v-model="draft.group_ids"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="按分组 ID 限定"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="渠道">
        <el-select
          v-model="draft.channel_ids"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="按渠道 ID 限定；armada 与分组归一到同一维度，同时设置会取交集"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="协议">
        <el-input
          v-model="draft.protocol_id"
          clearable
          placeholder="留空表示不限协议"
          class="filter-control"
        />
      </el-form-item>
      <el-form-item label="账号类型">
        <el-select
          v-model="draft.account_type"
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
      <el-form-item label="注册天数">
        <div class="range-row">
          <el-input-number
            v-model="draft.register_days_min"
            :min="0"
            controls-position="right"
            placeholder="最小"
          />
          <span class="range-sep">至</span>
          <el-input-number
            v-model="draft.register_days_max"
            :min="0"
            controls-position="right"
            placeholder="最大"
          />
        </div>
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
</style>
