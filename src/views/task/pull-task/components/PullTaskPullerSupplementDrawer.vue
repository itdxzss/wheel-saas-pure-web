<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  PullTaskPullerCandidate,
  PullTaskPullerSupplementOptions
} from "@/api/pull-task";
import type { PullTaskPullerSupplementForm } from "../composables/usePullTaskPullerSupplement";

defineOptions({ name: "PullTaskPullerSupplementDrawer" });

defineProps<{
  accountGroups: AccountGroupApiRow[];
  loading: boolean;
  saving: boolean;
  options: PullTaskPullerSupplementOptions | null;
}>();

const emit = defineEmits<{
  (event: "account-group-change", accountGroupId: number): void;
  (event: "selection-mode-change", selectionMode: 1 | 2): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<PullTaskPullerSupplementForm>("form", {
  required: true
});

const membershipLabels: Record<number, string> = {
  0: "未入群",
  1: "入群中",
  2: "已在群",
  3: "入群失败",
  4: "结果未知"
};

function membershipLabel(status: number): string {
  return membershipLabels[status] ?? "未知";
}

function candidateLabel(candidate: PullTaskPullerCandidate): string {
  return `${candidate.accountPhone}（账号 ${candidate.accountId}）`;
}

function handleSelectionModeChange(value: string | number | boolean): void {
  emit("selection-mode-change", Number(value) === 2 ? 2 : 1);
}
</script>

<template>
  <el-drawer
    v-model="visible"
    append-to-body
    destroy-on-close
    size="720px"
    title="补充拉手"
  >
    <div v-loading="loading" class="puller-supplement">
      <div v-if="options" class="count-grid">
        <el-statistic title="当前拉手" :value="options.currentPullerCount" />
        <el-statistic title="计划拉手" :value="options.requiredPullerCount" />
        <el-statistic title="缺少拉手" :value="options.missingPullerCount" />
      </div>

      <el-alert
        v-if="options && options.missingPullerCount === 0"
        title="当前拉手已经补足，请刷新群详情"
        type="success"
        :closable="false"
        show-icon
      />

      <section v-if="options" class="selection-section">
        <h4>当前拉手</h4>
        <el-table :data="options.currentPullers" size="small" border>
          <el-table-column prop="accountPhone" label="拉手账号" />
          <el-table-column label="在群状态" width="110">
            <template #default="{ row }">
              {{ membershipLabel(row.membershipStatus) }}
            </template>
          </el-table-column>
          <el-table-column label="占用" width="90">
            <template #default="{ row }">
              {{ row.occupied ? "占用中" : "已释放" }}
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="当前没有可用拉手" :image-size="56" />
          </template>
        </el-table>
      </section>

      <el-form
        v-if="options"
        :model="form"
        class="selection-form"
        label-width="150px"
      >
        <el-form-item label="拉手账号分组" required>
          <el-select
            v-model="form.accountGroupId"
            class="form-control"
            filterable
            @change="emit('account-group-change', $event)"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="补充数量" required>
          <el-input-number
            v-model="form.supplementCount"
            :min="1"
            :max="Math.max(options.missingPullerCount, 1)"
          />
        </el-form-item>
        <el-form-item label="选择方式" required>
          <el-radio-group
            v-model="form.selectionMode"
            @change="handleSelectionModeChange"
          >
            <el-radio :value="1">自动选择</el-radio>
            <el-radio :value="2">手动选择</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="进入群组方式" required>
          <el-radio-group v-model="form.entryMode">
            <el-radio :value="1">踩链接进群</el-radio>
            <el-radio :value="2" :disabled="!options.managerInviteAvailable">
              当前管理员邀请进群
            </el-radio>
          </el-radio-group>
          <small v-if="!options.managerInviteAvailable" class="field-tip">
            当前没有管理员可执行邀请，只能选择踩链接进群
          </small>
        </el-form-item>
        <el-form-item label="目标数据策略">
          <el-checkbox :model-value="form.continueRemainingData" disabled>
            继续使用当前剩余目标数据
          </el-checkbox>
          <small class="field-tip">不会重新上传或重复消费 TXT 数据</small>
        </el-form-item>
      </el-form>

      <section v-if="options" class="selection-section">
        <h4>候选拉手账号</h4>
        <el-checkbox-group
          v-if="form.selectionMode === 2"
          v-model="form.accountIds"
          class="candidate-grid"
        >
          <el-checkbox
            v-for="candidate in options.candidates"
            :key="candidate.accountId"
            :value="candidate.accountId"
          >
            {{ candidateLabel(candidate) }}
          </el-checkbox>
        </el-checkbox-group>
        <el-table v-else :data="options.candidates" size="small" border>
          <el-table-column prop="accountPhone" label="账号" />
          <el-table-column prop="accountId" label="账号 ID" width="140" />
        </el-table>
        <el-empty
          v-if="options.candidates.length === 0"
          description="当前分组没有未占用的在线正常账号"
          :image-size="56"
        />
      </section>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="!options || options.missingPullerCount === 0"
        @click="emit('submit')"
      >
        确认补充
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.puller-supplement {
  min-height: 220px;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.selection-section,
.selection-form {
  margin-top: 20px;
}

.selection-section h4 {
  margin: 0 0 10px;
}

.form-control {
  width: 100%;
}

.field-tip {
  display: block;
  width: 100%;
  color: var(--el-text-color-secondary);
}

.candidate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
</style>
