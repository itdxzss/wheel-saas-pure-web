<script setup lang="ts">
import { computed } from "vue";
import type {
  CommonGroupTask,
  CommonGroupTaskItem
} from "../../composables/useCommonGroupCreate";

defineOptions({ name: "CommonGroupTaskDrawer" });

const props = defineProps<{
  pollingError: string;
  progress: number;
  task: CommonGroupTask | null;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
  (event: "return-to-form"): void;
  (event: "retry", item: CommonGroupTaskItem): void;
}>();

const visible = defineModel<boolean>({ required: true });

const statusText = computed(() => {
  const texts = {
    PROCESSING: "执行中",
    SUCCESS: "全部成功",
    PARTIAL_SUCCESS: "部分成功",
    FAILED: "全部失败"
  };
  return props.task ? texts[props.task.status] : "-";
});

const statusType = (status: CommonGroupTaskItem["status"]) => {
  if (status === "SUCCESS") return "success";
  if (status === "PARTIAL" || status === "RESULT_UNKNOWN") return "warning";
  if (status === "FAILED") return "danger";
  if (status === "PROCESSING") return "primary";
  return "info";
};

const itemStatusText = (status: CommonGroupTaskItem["status"]) =>
  ({
    PENDING: "等待执行",
    PROCESSING: "执行中",
    SUCCESS: "成功",
    PARTIAL: "部分完成",
    RESULT_UNKNOWN: "结果未知",
    FAILED: "失败"
  })[status];
</script>

<template>
  <el-drawer v-model="visible" title="普群任务详情" size="960px">
    <template v-if="task">
      <el-alert
        v-if="pollingError"
        :title="pollingError"
        type="error"
        show-icon
        :closable="false"
        class="polling-alert"
      />

      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务 ID">
          {{ task.taskId }}
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          {{ statusText }}
        </el-descriptions-item>
        <el-descriptions-item label="群组总数">
          {{ task.items.length }}
        </el-descriptions-item>
        <el-descriptions-item label="成功 / 失败">
          {{ task.items.filter(item => item.status === "SUCCESS").length }} /
          {{ task.items.filter(item => item.status === "FAILED").length }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="progress-block">
        <span>执行进度</span>
        <el-progress :percentage="progress" />
      </div>

      <el-table :data="task.items" border>
        <el-table-column prop="index" label="序号" width="80" />
        <el-table-column prop="groupName" label="群名称" min-width="180" />
        <el-table-column prop="creatorPhone" label="创群号" min-width="150" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" effect="light">
              {{ itemStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="执行说明" min-width="180" />
        <el-table-column prop="operationTime" label="操作时间" width="170" />
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <el-button
              v-if="row.retryable"
              v-perms="['tenant:normal_group:retry']"
              link
              type="primary"
              @click="emit('retry', row)"
            >
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <section class="task-log-block">
        <h4>任务日志</h4>
        <ol>
          <li v-for="log in task.logs" :key="log">{{ log }}</li>
        </ol>
      </section>
    </template>

    <template #footer>
      <el-button @click="emit('refresh')">刷新</el-button>
      <el-button @click="emit('return-to-form')">返回表单</el-button>
      <el-button type="primary" @click="visible = false">完成</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.polling-alert {
  margin-bottom: 16px;
}

.progress-block {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  align-items: center;
  margin: 20px 0;
}

.task-log-block {
  padding: 16px 20px;
  margin-top: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.task-log-block h4 {
  margin: 0 0 12px;
}

.task-log-block ol {
  padding-left: 24px;
  margin: 0;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}
</style>
