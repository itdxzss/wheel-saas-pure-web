<script setup lang="ts">
import { computed } from "vue";
import type { PullTaskGlobalSettingForm } from "../composables/usePullTaskGlobalSetting";

defineOptions({
  name: "PullTaskGlobalSettingDialog"
});

const props = defineProps<{
  form: PullTaskGlobalSettingForm;
  loading: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: "cancel"): void;
  (event: "save"): void;
  (event: "update:form", value: PullTaskGlobalSettingForm): void;
}>();

const visible = defineModel<boolean>({ required: true });

function updateForm(patch: Partial<PullTaskGlobalSettingForm>): void {
  emit("update:form", { ...props.form, ...patch });
}

const marketingSilenceMinutes = computed({
  get: () => props.form.marketingSilenceMinutes,
  set: value => updateForm({ marketingSilenceMinutes: value })
});
const groupLockdownMinutes = computed({
  get: () => props.form.groupLockdownMinutes,
  set: value => updateForm({ groupLockdownMinutes: value })
});
const maxMarketingAccountsPerGroup = computed({
  get: () => props.form.maxMarketingAccountsPerGroup,
  set: value => updateForm({ maxMarketingAccountsPerGroup: value })
});
</script>

<template>
  <el-dialog
    v-model="visible"
    title="拉群营销全局设置"
    width="560px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-form v-loading="loading" :model="form" label-width="150px">
      <el-form-item label="营销静默时间">
        <div class="number-field">
          <el-input-number
            v-model="marketingSilenceMinutes"
            :min="0"
            :step="1"
            step-strictly
            controls-position="right"
          />
          <span>分钟</span>
        </div>
        <div class="field-tip">必须为大于等于0的整数</div>
      </el-form-item>
      <el-form-item label="群组封控时间">
        <div class="number-field">
          <el-input-number
            v-model="groupLockdownMinutes"
            :min="0"
            :step="1"
            step-strictly
            controls-position="right"
          />
          <span>分钟</span>
        </div>
        <div class="field-tip">必须为大于等于0的整数</div>
      </el-form-item>
      <el-form-item label="单群营销账号上限">
        <div class="number-field">
          <el-input-number
            v-model="maxMarketingAccountsPerGroup"
            :min="1"
            :step="1"
            step-strictly
            controls-position="right"
          />
          <span>个</span>
        </div>
        <div class="field-tip">必须为大于等于1的整数</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="saving" @click="emit('cancel')"> 取消 </el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="loading"
        @click="emit('save')"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.number-field {
  display: flex;
  gap: 10px;
  align-items: center;
}

.field-tip {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
