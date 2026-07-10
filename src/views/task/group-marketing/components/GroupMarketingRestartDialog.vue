<script setup lang="ts">
import type { MarketingTaskRow } from "@/api/marketing-task";
import type { MarketingTaskRestartForm } from "../composables/useMarketingTaskRestart";

defineOptions({
  name: "GroupMarketingRestartDialog"
});

defineProps<{
  submitting: boolean;
  task: MarketingTaskRow | null;
}>();

const emit = defineEmits<{
  (event: "closed"): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<MarketingTaskRestartForm>("form", { required: true });
</script>

<template>
  <el-dialog
    v-model="visible"
    width="520px"
    destroy-on-close
    title="重新启动营销任务"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    @closed="emit('closed')"
  >
    <el-alert
      v-if="task"
      type="info"
      :closable="false"
      show-icon
      :title="`任务「${task.taskName}」将沿用原账号群组发送时间和历史统计`"
    />
    <el-form :model="form" label-width="110px" class="restart-form">
      <el-form-item label="任务开始时间" required>
        <el-date-picker
          v-model="form.taskStartAt"
          type="datetime"
          value-format="x"
          class="form-control"
          :disabled="submitting"
          placeholder="请选择新的任务开始时间"
        />
      </el-form-item>
      <el-form-item label="任务结束时间" required>
        <el-date-picker
          v-model="form.taskEndAt"
          type="datetime"
          value-format="x"
          class="form-control"
          :disabled="submitting"
          placeholder="请选择新的任务结束时间"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="emit('submit')">
        确认重新启动
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.restart-form {
  margin-top: 18px;
}

.form-control {
  width: 100%;
}
</style>
