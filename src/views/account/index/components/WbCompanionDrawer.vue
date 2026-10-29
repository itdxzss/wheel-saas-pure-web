<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { TenantAccount } from "@/api/account";
import {
  getWbCompanionDetail,
  stopWbCompanionTask,
  unbindWbCompanion,
  wbCompanionErrorText,
  type WbCompanionDetail,
  type WbCompanionTask
} from "@/api/wb-companion";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "WbCompanionDrawer" });

const props = defineProps<{ account: TenantAccount | null }>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{
  (event: "refill", account: TenantAccount): void;
  (event: "changed"): void;
}>();

const MAX_CONNECTIONS = 4;
const loading = ref(false);
const working = ref(false);
const detail = ref<WbCompanionDetail | null>(null);

const runningTask = computed(
  () => detail.value?.tasks.find(task => task.status === 1) ?? null
);
const slots = computed(() => {
  const rows = (detail.value?.connections ?? []).map((item, index) => ({
    label: index === 0 ? "主设备" : `影子 ${index}`,
    status: item.connStatus as string,
    wbId: `${item.role === "MAIN" ? "device" : "shadow"} ${item.wbId}`
  }));
  for (let index = rows.length; index < MAX_CONNECTIONS; index++) {
    rows.push({
      label: index === 0 ? "主设备" : `影子 ${index}`,
      status: "EMPTY",
      wbId: "—"
    });
  }
  return rows;
});

watch(open, value => {
  if (value) void load();
});

async function load(): Promise<void> {
  if (!props.account?.id) return;
  loading.value = true;
  try {
    detail.value = await getWbCompanionDetail(props.account.id);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "读取 WB 分身失败"));
  } finally {
    loading.value = false;
  }
}

async function unbind(): Promise<void> {
  if (!props.account?.id) return;
  try {
    await ElMessageBox.confirm(
      "WB 会删除这台设备和它的影子，各连接退出关联；WB 那边已计入的收益不受影响。",
      "全部解绑？",
      {
        type: "warning",
        confirmButtonText: "全部解绑",
        cancelButtonText: "取消"
      }
    );
  } catch {
    return;
  }
  working.value = true;
  try {
    await unbindWbCompanion(props.account.id);
    ElMessage.success("已解绑");
    emit("changed");
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "解绑失败"));
  } finally {
    working.value = false;
  }
}

async function stop(task: WbCompanionTask): Promise<void> {
  working.value = true;
  try {
    await stopWbCompanionTask(task.id);
    emit("changed");
    await load();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "停止失败"));
  } finally {
    working.value = false;
  }
}

type TagType = "primary" | "success" | "warning" | "info" | "danger";

function statusTag(status: string): { text: string; type: TagType } {
  const map: Record<string, { text: string; type: TagType }> = {
    CONNECTED: { text: "在线", type: "success" },
    DISCONNECTED: { text: "掉线", type: "danger" },
    LOGGED_OUT: { text: "授权失效", type: "danger" },
    EMPTY: { text: "空位", type: "info" }
  };
  return map[status] ?? { text: status, type: "info" };
}

function taskResult(task: WbCompanionTask): string {
  const done = task.baseCount + task.succeededCount;
  const text = ["", "进行中", "成功", "失败", "已停止"][task.status];
  return `${text} ${done}/${task.targetCount}`;
}

function formatTime(value: number | null): string {
  return value ? new Date(value).toLocaleString() : "—";
}
</script>

<template>
  <el-drawer
    v-model="open"
    :title="`WB 分身 · ${account?.ws_phone ?? ''}`"
    size="620px"
    destroy-on-close
  >
    <div v-loading="loading" class="wb-drawer">
      <el-descriptions :column="3" border size="small">
        <el-descriptions-item label="WB 环境">
          {{ detail?.wbEnvName ?? detail?.wbEnvId ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="WB 用户">
          {{ detail?.wbUsername ?? "—" }}
        </el-descriptions-item>
        <el-descriptions-item label="WB 设备 ID">
          {{ detail?.wbDeviceId ?? "—" }}
        </el-descriptions-item>
      </el-descriptions>
      <el-alert
        v-if="detail && !detail.live && detail.wbEnvId"
        type="warning"
        :closable="false"
        title="这次没查到 WB，连接状态暂不可用。"
      />
      <el-table :data="slots" size="small">
        <el-table-column label="连接" prop="label" width="100" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status).type" size="small">
              {{ statusTag(row.status).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="WB 侧 ID" prop="wbId" />
      </el-table>
      <div class="wb-drawer-actions">
        <el-button
          v-if="runningTask"
          :loading="working"
          @click="stop(runningTask)"
        >
          停止登录
        </el-button>
        <el-button
          v-else
          type="primary"
          :disabled="!account"
          @click="account && emit('refill', account)"
        >
          {{ detail?.connections.length ? "补齐到 4 个" : "登录到 WB" }}
        </el-button>
        <el-button :loading="loading" @click="load">刷新</el-button>
        <el-button
          type="danger"
          plain
          :loading="working"
          :disabled="!detail?.wbDeviceId || !!runningTask"
          @click="unbind"
        >
          全部解绑
        </el-button>
      </div>
      <h4>登录记录</h4>
      <el-table :data="detail?.tasks ?? []" size="small">
        <el-table-column label="时间" min-width="150">
          <template #default="{ row }">{{
            formatTime(row.createdAt)
          }}</template>
        </el-table-column>
        <el-table-column label="WB 用户" prop="wbUsername" min-width="110" />
        <el-table-column label="结果" min-width="110">
          <template #default="{ row }">{{ taskResult(row) }}</template>
        </el-table-column>
        <el-table-column label="说明" min-width="160">
          <template #default="{ row }">
            {{ wbCompanionErrorText(row.errorCode) || "—" }}
          </template>
        </el-table-column>
      </el-table>
      <p class="wb-drawer-hint">
        会员在 WB 自己删除设备后，这里刷新即显示为空位，可以再补齐。
      </p>
    </div>
  </el-drawer>
</template>

<style scoped>
.wb-drawer {
  display: grid;
  gap: 14px;
}

.wb-drawer h4 {
  margin: 4px 0 0;
}

.wb-drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wb-drawer-hint {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
