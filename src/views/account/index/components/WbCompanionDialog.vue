<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { TenantAccount } from "@/api/account";
import {
  createWbCompanionTasks,
  findWbMember,
  getWbCompanionTask,
  listWbTargets,
  stopWbCompanionTask,
  wbCompanionErrorText,
  type WbCompanionCreateItem,
  type WbCompanionSummary,
  type WbCompanionTask,
  type WbMember,
  type WbTarget
} from "@/api/wb-companion";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "WbCompanionDialog" });

const props = defineProps<{
  accounts: TenantAccount[];
  /** 单个账号已挂分身时的快照：环境和用户锁定，只能补齐。 */
  summary: WbCompanionSummary | null;
}>();
const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (event: "finished"): void }>();

const POLL_MS = 2000;
const MAX_CONNECTIONS = 4;
const targets = ref<WbTarget[]>([]);
const envId = ref("");
const username = ref("");
const member = ref<WbMember | null>(null);
const looking = ref(false);
const count = ref(MAX_CONNECTIONS);
const submitting = ref(false);
const results = ref<WbCompanionCreateItem[]>([]);
const tasks = ref<Record<number, WbCompanionTask>>({});
let timer: number | null = null;

const refill = computed(() => props.summary !== null);
const single = computed(() => props.accounts.length === 1);
const maxCount = computed(() =>
  member.value && !member.value.shadowEnabled ? 1 : MAX_CONNECTIONS
);
const canSubmit = computed(
  () => !!envId.value && !!member.value && !submitting.value
);
const running = computed(() =>
  Object.values(tasks.value).some(task => task.status === 1)
);

watch(open, async value => {
  if (!value) return stopPolling();
  results.value = [];
  tasks.value = {};
  member.value = null;
  count.value = MAX_CONNECTIONS;
  username.value = props.summary?.wbUsername ?? "";
  try {
    targets.value = await listWbTargets();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "读取 WB 环境失败"));
    targets.value = [];
  }
  envId.value = props.summary?.wbEnvId ?? targets.value[0]?.envId ?? "";
  if (refill.value) void lookup();
});

async function lookup(): Promise<void> {
  if (!envId.value || !username.value.trim()) return;
  looking.value = true;
  member.value = null;
  try {
    member.value = await findWbMember(envId.value, username.value.trim());
    count.value = Math.min(count.value, maxCount.value);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "查找 WB 用户失败"));
  } finally {
    looking.value = false;
  }
}

async function submit(): Promise<void> {
  if (!member.value) return;
  submitting.value = true;
  try {
    const result = await createWbCompanionTasks({
      accountIds: props.accounts.map(row => row.id as number),
      wbEnvId: envId.value,
      wbMemberId: member.value.id,
      wbUsername: member.value.username,
      targetCount: count.value
    });
    results.value = result.items;
    const failed = result.items.filter(item => item.taskId === null).length;
    if (failed > 0) ElMessage.warning(`${failed} 个账号未能发起，原因见列表`);
    await poll();
    startPolling();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "发起登录失败"));
  } finally {
    submitting.value = false;
  }
}

async function poll(): Promise<void> {
  const ids = results.value
    .map(item => item.taskId)
    .filter((id): id is number => id !== null)
    .filter(id => !tasks.value[id] || tasks.value[id].status === 1);
  const loaded = await Promise.allSettled(ids.map(getWbCompanionTask));
  const next = { ...tasks.value };
  loaded.forEach(item => {
    if (item.status === "fulfilled") next[item.value.id] = item.value;
  });
  tasks.value = next;
  if (results.value.length > 0 && !running.value) {
    stopPolling();
    emit("finished");
  }
}

function startPolling(): void {
  stopPolling();
  timer = window.setInterval(() => void poll(), POLL_MS);
}

function stopPolling(): void {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

async function stopAll(): Promise<void> {
  const ids = Object.values(tasks.value)
    .filter(task => task.status === 1)
    .map(task => task.id);
  await Promise.allSettled(ids.map(stopWbCompanionTask));
  await poll();
}

function phoneOf(accountId: number): string {
  const row = props.accounts.find(item => item.id === accountId);
  return row?.ws_phone ?? String(accountId);
}

/** 第 index 条（从 0 开始）连接在任务里的状态，用于单个账号的逐条进度。 */
function slotState(task: WbCompanionTask, index: number): string {
  if (index < task.baseCount) return "已有";
  const done = task.baseCount + task.succeededCount;
  if (index < done) return "成功";
  if (index >= task.targetCount) return "";
  if (index === done) {
    if (task.status === 1) {
      return (
        ["WB 发起中", "安卓输入配对码", "等待 WB 确认上线"][task.step] ??
        "进行中"
      );
    }
    if (task.status === 3) return "失败";
  }
  return task.status === 1 ? "排队" : "未开始";
}

function slotType(state: string): "success" | "primary" | "danger" | "info" {
  if (state === "成功" || state === "已有") return "success";
  if (state === "失败") return "danger";
  if (state === "排队" || state === "未开始") return "info";
  return "primary";
}

function statusText(task: WbCompanionTask | undefined): string {
  if (!task) return "发起中";
  const done = task.baseCount + task.succeededCount;
  const text = ["", "进行中", "成功", "失败", "已停止"][task.status];
  return `${text} ${done}/${task.targetCount}`;
}

onUnmounted(stopPolling);
</script>

<template>
  <el-dialog
    v-model="open"
    :title="refill ? 'WB 分身 · 补齐' : '登录到 WB 分身'"
    width="640px"
    :close-on-click-modal="false"
  >
    <template v-if="results.length === 0">
      <el-form label-width="96px">
        <el-form-item label="安卓号">
          <span v-if="single">{{ accounts[0]?.ws_phone }}</span>
          <span v-else
            >已选 {{ accounts.length }} 个安卓号，每个号各自串行登录</span
          >
        </el-form-item>
        <el-form-item label="WB 环境">
          <el-select
            v-model="envId"
            :disabled="refill || targets.length <= 1"
            placeholder="本环境未配置 WB"
            style="width: 240px"
            @change="member = null"
          >
            <el-option
              v-for="target in targets"
              :key="target.envId"
              :label="target.name"
              :value="target.envId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="WB 用户">
          <div class="wb-member">
            <el-input
              v-model="username"
              :disabled="refill"
              placeholder="输入 WB 用户名（精确查找）"
              @keyup.enter="lookup"
            >
              <template #append>
                <el-button
                  :loading="looking"
                  :disabled="refill"
                  @click="lookup"
                >
                  查找
                </el-button>
              </template>
            </el-input>
            <el-alert
              v-if="member"
              :closable="false"
              type="info"
              :title="`${member.username} · 主设备 ${member.deviceCount}/${member.deviceMax}${member.shadowEnabled ? '' : ' · WB 未开启影子连接，只能登录 1 个'}`"
            />
          </div>
        </el-form-item>
        <el-form-item label="分身数量">
          <div>
            <el-radio-group v-model="count">
              <el-radio-button
                v-for="n in MAX_CONNECTIONS"
                :key="n"
                :value="n"
                :disabled="n > maxCount"
              >
                {{ n }}
              </el-radio-button>
            </el-radio-group>
            <p class="wb-hint">
              第 1 个是 WB 主设备，其余是它的影子；WB
              上已有的连接计入数量，只补差额。这个号最多能关联 4
              台设备，已在别处关联的话最后几个会失败。
            </p>
          </div>
        </el-form-item>
      </el-form>
      <el-alert
        type="info"
        :closable="false"
        title="每条约 30–90 秒。可以关掉弹窗，进度在列表和详情里继续显示。"
      />
    </template>

    <template v-else>
      <template v-if="single && results[0]?.taskId && tasks[results[0].taskId]">
        <div
          v-for="index in tasks[results[0].taskId].targetCount"
          :key="index"
          class="wb-progress-row"
        >
          <span class="wb-progress-index">{{ index }}</span>
          <b>{{ index === 1 ? "主设备" : `影子 ${index - 1}` }}</b>
          <el-tag
            :type="slotType(slotState(tasks[results[0].taskId], index - 1))"
          >
            {{ slotState(tasks[results[0].taskId], index - 1) }}
          </el-tag>
        </div>
        <el-alert
          v-if="tasks[results[0].taskId].status === 3"
          class="wb-progress-error"
          type="error"
          :closable="false"
          :title="`${wbCompanionErrorText(tasks[results[0].taskId].errorCode)}；已成功的连接保留。同一个号失败后要等 2 分钟才能重试。`"
        />
      </template>
      <el-table v-else :data="results" size="small" max-height="360">
        <el-table-column label="安卓号" min-width="150">
          <template #default="{ row }">{{ phoneOf(row.accountId) }}</template>
        </el-table-column>
        <el-table-column label="进度" min-width="120">
          <template #default="{ row }">
            <span v-if="row.taskId === null">未发起</span>
            <span v-else>{{ statusText(tasks[row.taskId]) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">
            <span v-if="row.taskId === null">{{ row.errorMessage }}</span>
            <span v-else>{{
              wbCompanionErrorText(tasks[row.taskId]?.errorCode ?? null)
            }}</span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template #footer>
      <template v-if="results.length === 0">
        <el-button @click="open = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="submit"
        >
          开始登录
        </el-button>
      </template>
      <template v-else>
        <el-button v-if="running" @click="stopAll">停止剩余</el-button>
        <el-button type="primary" @click="open = false">
          {{ running ? "后台运行" : "关闭" }}
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<style scoped>
.wb-member {
  display: grid;
  gap: 8px;
  width: 100%;
}

.wb-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.wb-progress-row {
  display: grid;
  grid-template-columns: 28px 80px auto;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.wb-progress-index {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 50%;
}

.wb-progress-error {
  margin-top: 8px;
}
</style>
