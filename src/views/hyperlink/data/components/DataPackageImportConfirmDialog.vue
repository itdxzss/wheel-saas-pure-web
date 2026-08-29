<script setup lang="ts">
import { computed } from "vue";
import type {
  DataPackageImportMode,
  DataPackageListItem
} from "@/api/hyperlink-data-package";
import type { DataPackageTxtInspection } from "../composables/useDataPackageImport";
import Check from "~icons/ep/check";

defineOptions({ name: "DataPackageImportConfirmDialog" });

const props = defineProps<{
  dataPackage: DataPackageListItem | null;
  inspection: DataPackageTxtInspection | null;
  mode: DataPackageImportMode;
  modelValue: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "confirm"): void;
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const modeLabel = computed(() => (props.mode === "APPEND" ? "增量" : "覆盖"));

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="导入确认"
    width="460px"
    append-to-body
    destroy-on-close
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
  >
    <template v-if="inspection">
      <div class="confirm-summary">
        即将向数据包
        <strong>「{{ dataPackage?.name ?? "-" }}」</strong> 以
        <strong>{{ modeLabel }}</strong> 模式导入
        <strong>{{ formatCount(inspection.validPhoneCount) }}</strong>
        条手机号。
      </div>

      <el-alert
        v-if="inspection.brazilRisk"
        class="confirm-risk"
        type="error"
        :closable="false"
        show-icon
      >
        <template #title>
          <strong>巴西号码（55 开头）风险提醒</strong>
        </template>
        <p>
          巴西手机号存在<strong>「+9 / 去9」</strong
          >两种格式，请确认本数据包已经过第三方平台筛选／映射处理，避免大量号码无法识别或重复发送。
        </p>
      </el-alert>

      <div class="confirm-preview">
        <div class="confirm-preview__title">随机预览（前 5 条）</div>
        <div
          v-for="(phone, index) in inspection.previewPhones"
          :key="phone"
          class="confirm-preview__row"
        >
          <span>{{ index + 1 }}</span>
          <strong>{{ phone }}</strong>
        </div>
        <div class="confirm-preview__total">
          ··· 共 {{ formatCount(inspection.validPhoneCount) }} 条
        </div>
      </div>
    </template>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">
        返回修改
      </el-button>
      <el-button type="primary" :loading="submitting" @click="emit('confirm')">
        <el-icon><Check /></el-icon>
        确认上传
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.confirm-summary {
  padding: 12px 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
}

.confirm-summary strong {
  color: var(--el-color-primary);
}

.confirm-risk {
  margin-top: 14px;
}

.confirm-risk p {
  margin: 6px 0 0;
  line-height: 1.65;
}

.confirm-risk p strong {
  color: var(--el-color-danger);
}

.confirm-preview {
  margin-top: 14px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
}

.confirm-preview__title,
.confirm-preview__row,
.confirm-preview__total {
  padding: 9px 13px;
}

.confirm-preview__title {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
}

.confirm-preview__row {
  display: grid;
  grid-template-columns: 36px 1fr;
  border-top: 1px solid var(--el-border-color-lighter);
}

.confirm-preview__row span {
  color: var(--el-text-color-placeholder);
}

.confirm-preview__row strong {
  color: var(--el-color-primary);
}

.confirm-preview__total {
  color: var(--el-text-color-secondary);
  text-align: center;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
