<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { updatePullTaskCreatorDeletion } from "@/api/pull-task";
import { apiErrorMessage } from "@/utils/api-error";
import { canEditCreatorDeletion } from "../creator-deletion-display";

const props = defineProps<{
  taskId: number;
  status?: string;
  startedAt?: number | null;
  enabled?: boolean;
}>();
const emit = defineEmits<{ saved: [] }>();
const saving = ref(false);
const enabled = ref(props.enabled === true);
const editable = computed(() =>
  canEditCreatorDeletion(props.status, props.startedAt)
);
watch(
  () => props.enabled,
  value => {
    enabled.value = value === true;
  }
);

async function save(value: string | number | boolean): Promise<void> {
  if (!editable.value || saving.value) return;
  saving.value = true;
  try {
    await updatePullTaskCreatorDeletion(props.taskId, value === true);
    enabled.value = value === true;
    ElMessage.success("注销建群账号配置已保存");
    emit("saved");
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "注销建群账号配置保存失败"));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div>
    <el-switch
      v-if="editable"
      v-auth="'tenant:pull_task:operate'"
      :model-value="enabled"
      :loading="saving"
      :disabled="saving"
      active-text="开启"
      inactive-text="关闭"
      @change="save"
    />
    <span v-else>{{ enabled ? "开启" : "关闭" }}（配置已冻结）</span>
    <p v-if="editable" class="setting-help">
      仅支持 Android
      主设备。开启后，群设置完成且管理号已确认成为管理员，再永久注销建群账号；确认创建者信息清理完成后继续拉人。注销不可撤销。任务启动后不可修改。
    </p>
  </div>
</template>

<style scoped>
.setting-help {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
