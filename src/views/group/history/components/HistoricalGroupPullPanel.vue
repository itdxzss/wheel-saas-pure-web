<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";
import type { UploadFile } from "element-plus";
import type { HistoricalGroupDetail } from "@/api/historical-group";
import HistoricalGroupExecutionResult from "./HistoricalGroupExecutionResult.vue";
import { useHistoricalGroupExecution } from "../composables/useHistoricalGroupExecution";

defineOptions({
  name: "HistoricalGroupPullPanel"
});

const props = defineProps<{
  active: boolean;
  detail: HistoricalGroupDetail;
}>();

const state = useHistoricalGroupExecution({
  detail: () => props.detail
});

function updateMaterialFile(uploadFile: UploadFile): void {
  state.materialFile.value = uploadFile.raw ?? null;
}

function clearMaterialFile(): void {
  state.materialFile.value = null;
}

watch(
  [
    () => props.active,
    () => props.detail.accountId,
    () => props.detail.groupJid,
    () => props.detail.linkAvailable,
    () => props.detail.inviteUrl
  ],
  ([active]) => {
    if (active) void state.open();
    else state.close();
  },
  { immediate: true }
);

onBeforeUnmount(() => state.close());
</script>

<template>
  <el-card shadow="never" class="historical-group-pull-panel">
    <template #header>
      <strong>单群拉人 + 全部营销账号发送</strong>
    </template>

    <el-alert
      v-if="!state.linkGateOpen.value"
      type="error"
      :closable="false"
      show-icon
      title="群链接硬门禁未通过"
      :description="state.gateReason.value"
    />

    <el-form inline label-position="top" class="pull-form">
      <el-form-item label="拉手账号分组" required>
        <el-select
          v-model="state.pullerAccountGroupId.value"
          :loading="state.optionsLoading.value"
          :disabled="!state.linkGateOpen.value || state.submitting.value"
          filterable
          placeholder="选择随机拉手账号来源分组"
        >
          <el-option
            v-for="group in state.accountGroups.value"
            :key="group.id"
            :label="`${group.name}（${group.totalAccounts} 个账号）`"
            :value="group.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="TXT、CSV、XLS、XLSX 材料" required>
        <el-upload
          :auto-upload="false"
          :disabled="!state.linkGateOpen.value || state.submitting.value"
          :limit="1"
          accept=".txt,.csv,.xls,.xlsx"
          :on-change="updateMaterialFile"
          :on-remove="clearMaterialFile"
        >
          <el-button>选择材料文件</el-button>
        </el-upload>
      </el-form-item>

      <el-form-item label="单次添加人数" required>
        <el-input-number
          v-model="state.singleAddCount.value"
          :disabled="!state.linkGateOpen.value || state.submitting.value"
          :min="1"
          :precision="0"
          :step="1"
          step-strictly
        />
      </el-form-item>

      <el-form-item label="执行">
        <el-button
          type="primary"
          :disabled="state.pullDisabled.value"
          :loading="state.submitting.value"
          @click="state.startPull"
        >
          创建并启动拉人
        </el-button>
      </el-form-item>
    </el-form>

    <el-alert
      v-if="state.executionError.value"
      type="error"
      :closable="false"
      show-icon
      :title="state.executionError.value"
    />

    <HistoricalGroupExecutionResult
      v-if="state.execution.value"
      :execution="state.execution.value"
      :polling="state.polling.value"
    />

    <section v-if="state.pullPhaseComplete.value" class="marketing-section">
      <h4>拉人阶段已完成</h4>
      <el-alert
        v-if="!state.marketingReady.value"
        type="info"
        :closable="false"
        title="本次执行没有可发送的营销账号"
      />
      <el-form v-else inline label-position="top">
        <el-form-item label="现有营销模板" required>
          <el-select
            v-model="state.marketingTemplateId.value"
            :loading="state.optionsLoading.value"
            :disabled="state.marketingSending.value"
            filterable
            placeholder="选择发送给全部营销账号的模板"
          >
            <el-option
              v-for="template in state.marketingTemplates.value"
              :key="template.id"
              :label="template.templateName"
              :value="template.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="营销发送">
          <el-button
            type="success"
            :disabled="state.marketingDisabled.value"
            :loading="state.marketingSending.value"
            @click="state.sendMarketing"
          >
            全部营销账号发送
          </el-button>
        </el-form-item>
      </el-form>
    </section>
  </el-card>
</template>

<style scoped>
.pull-form {
  margin-top: 16px;
}

.pull-form :deep(.el-form-item) {
  min-width: 230px;
}

.pull-form :deep(.el-select) {
  width: 260px;
}

.marketing-section {
  margin-top: 20px;
}

.marketing-section :deep(.el-select) {
  width: 300px;
}
</style>
