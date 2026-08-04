<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  PullTaskManagerCandidate,
  PullTaskManagerOptionRole,
  PullTaskManagerSupplementOptions
} from "@/api/pull-task";
import type { PullTaskManagerSupplementForm } from "../composables/usePullTaskManagerSupplement";

defineOptions({
  name: "PullTaskManagerSupplementDrawer"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
  loading: boolean;
  saving: boolean;
  options: PullTaskManagerSupplementOptions | null;
}>();

const emit = defineEmits<{
  (event: "account-group-change", accountGroupId: number): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<PullTaskManagerSupplementForm>("form", {
  required: true
});

const membershipLabels: Record<number, string> = {
  0: "未入群",
  1: "入群中",
  2: "已在群",
  3: "入群失败",
  4: "结果未知"
};

const adminLabels: Record<number, string> = {
  0: "不适用",
  1: "待确认",
  2: "设置中",
  3: "管理员",
  4: "设置失败",
  5: "结果未知"
};

function membershipLabel(status: number): string {
  return membershipLabels[status] ?? "未知";
}

function adminLabel(status: number): string {
  return adminLabels[status] ?? "未知";
}

function selectCandidate(candidate: PullTaskManagerCandidate): void {
  form.value.accountId = candidate.accountId;
}

function executorLabel(account: PullTaskManagerOptionRole): string {
  return `${account.accountPhone}（角色行 ${account.roleRowId}）`;
}
</script>

<template>
  <el-drawer
    v-model="visible"
    append-to-body
    destroy-on-close
    size="720px"
    title="补充管理员"
  >
    <div v-loading="loading" class="manager-supplement">
      <div v-if="options" class="count-grid">
        <el-statistic title="当前管理员" :value="options.currentManagerCount" />
        <el-statistic
          title="要求管理员"
          :value="options.requiredManagerCount"
        />
        <el-statistic title="缺少管理员" :value="options.missingManagerCount" />
      </div>

      <el-alert
        v-if="options && options.missingManagerCount === 0"
        title="当前管理员已经补足，请刷新群详情"
        type="success"
        :closable="false"
        show-icon
      />

      <section v-if="options" class="selection-section">
        <h4>当前管理员</h4>
        <el-table :data="options.currentManagers" size="small" border>
          <el-table-column prop="accountPhone" label="管理员账号" />
          <el-table-column label="在群状态" width="110">
            <template #default="{ row }">
              {{ membershipLabel(row.membershipStatus) }}
            </template>
          </el-table-column>
          <el-table-column label="管理权限" width="110">
            <template #default="{ row }">
              {{ adminLabel(row.adminStatus) }}
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="当前没有可用管理员" :image-size="56" />
          </template>
        </el-table>
      </section>

      <el-form
        v-if="options"
        :model="form"
        class="selection-form"
        label-width="130px"
      >
        <el-form-item label="管理员账号分组" required>
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
        <el-form-item label="管理员账号" required>
          <el-select
            v-model="form.accountId"
            class="form-control"
            filterable
            placeholder="请选择在线正常账号"
          >
            <el-option
              v-for="candidate in options.candidates"
              :key="candidate.accountId"
              :label="candidate.accountPhone"
              :value="candidate.accountId"
            />
          </el-select>
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
        <el-form-item v-if="form.entryMode === 2" label="执行设置账号" required>
          <el-select
            v-model="form.executorRoleRowId"
            class="form-control"
            placeholder="选择当前管理员"
          >
            <el-option
              v-for="account in options.executorAccounts"
              :key="account.roleRowId"
              :label="executorLabel(account)"
              :value="account.roleRowId"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <section v-if="options" class="selection-section">
        <h4>候选管理员账号</h4>
        <el-table
          :data="options.candidates"
          row-key="accountId"
          size="small"
          border
          highlight-current-row
          @row-click="selectCandidate"
        >
          <el-table-column label="选择" width="70" align="center">
            <template #default="{ row }">
              <el-radio
                v-model="form.accountId"
                :value="row.accountId"
                aria-label="选择候选管理员"
              />
            </template>
          </el-table-column>
          <el-table-column prop="accountPhone" label="候选管理员账号" />
          <el-table-column prop="accountId" label="账号 ID" width="140" />
          <template #empty>
            <el-empty
              description="当前分组没有在线正常的候选账号"
              :image-size="64"
            />
          </template>
        </el-table>
      </section>

      <el-empty
        v-if="!loading && !options"
        description="候选资源加载失败，请关闭后重试"
      />
    </div>

    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button
        v-auth="'tenant:pull_task:operate'"
        type="primary"
        :loading="saving"
        :disabled="!options || options.missingManagerCount === 0"
        @click="emit('submit')"
      >
        确认补充
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.manager-supplement {
  min-height: 360px;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.count-grid :deep(.el-statistic) {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
}

.selection-form,
.selection-section {
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
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

@media (width <= 720px) {
  .count-grid {
    grid-template-columns: 1fr;
  }
}
</style>
