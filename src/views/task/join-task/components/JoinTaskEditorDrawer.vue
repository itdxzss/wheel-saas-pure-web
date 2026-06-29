<script setup lang="ts">
import { computed } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import {
  failurePolicyOptions,
  joinTaskDistributionOptions
} from "../constants";
import type {
  JoinTaskAccountOption,
  JoinTaskEditorForm
} from "../composables/useJoinTaskPage";

defineOptions({
  name: "JoinTaskEditorDrawer"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  accountOptions: JoinTaskAccountOption[];
  accountsLoading: boolean;
  loading: boolean;
  mode: "create" | "edit" | "copy";
}>();

const emit = defineEmits<{
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<JoinTaskEditorForm>("form", { required: true });
const accountKeyword = defineModel<string>("accountKeyword", {
  required: true
});
const onlyAvailable = defineModel<boolean>("onlyAvailable", {
  required: true
});
const onlyOnline = defineModel<boolean>("onlyOnline", {
  required: true
});

const title = computed(() => {
  if (props.mode === "edit") return "编辑进群任务";
  if (props.mode === "copy") return "复制进群任务";
  return "创建进群任务";
});

const selectedGroupSummary = computed(() => {
  const selected = props.accountGroups.filter(group =>
    form.value.accountGroupIds.includes(group.id)
  );
  return {
    names: selected.map(group => group.name).join("、") || "-",
    total: selected.reduce((sum, group) => sum + group.totalAccounts, 0),
    online: selected.reduce((sum, group) => sum + group.onlineAccounts, 0)
  };
});

const visibleAccounts = computed(() => {
  const keyword = accountKeyword.value.trim().toLowerCase();
  return props.accountOptions.filter(account => {
    const keywordMatched =
      !keyword ||
      account.phone.toLowerCase().includes(keyword) ||
      account.groupName.toLowerCase().includes(keyword);
    const availableMatched = !onlyAvailable.value || !account.disabled;
    const onlineMatched = !onlyOnline.value || account.isOnline;
    return keywordMatched && availableMatched && onlineMatched;
  });
});

const selectedAccountCount = computed(
  () => form.value.selectedAccountIds.length
);

const selectableVisibleIds = computed(() =>
  visibleAccounts.value
    .filter(account => !account.disabled)
    .map(account => account.id)
);

const allVisibleSelected = computed(
  () =>
    selectableVisibleIds.value.length > 0 &&
    selectableVisibleIds.value.every(id =>
      form.value.selectedAccountIds.includes(id)
    )
);

const linkCount = computed(
  () =>
    form.value.linksText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean).length
);

function isChecked(id: number): boolean {
  return form.value.selectedAccountIds.includes(id);
}

function asAccountOption(row: unknown): JoinTaskAccountOption {
  return row as JoinTaskAccountOption;
}

function setAccountChecked(
  account: JoinTaskAccountOption,
  checked: boolean | string | number
): void {
  if (account.disabled) return;
  const ids = new Set(form.value.selectedAccountIds);
  if (checked === true) ids.add(account.id);
  else ids.delete(account.id);
  form.value.selectedAccountIds = Array.from(ids);
}

function toggleVisibleAccounts(): void {
  const ids = new Set(form.value.selectedAccountIds);
  if (allVisibleSelected.value) {
    for (const id of selectableVisibleIds.value) ids.delete(id);
  } else {
    for (const id of selectableVisibleIds.value) ids.add(id);
  }
  form.value.selectedAccountIds = Array.from(ids);
}

function clearSelectedAccounts(): void {
  form.value.selectedAccountIds = [];
}

function submit(): void {
  emit("submit");
}
</script>

<template>
  <el-drawer v-model="visible" size="760px" destroy-on-close :title="title">
    <el-form
      v-loading="loading"
      :model="form"
      label-width="120px"
      class="editor-form"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-form-item label="任务名称" required>
        <el-input
          v-model="form.name"
          clearable
          maxlength="60"
          show-word-limit
          placeholder="请输入任务名称"
        />
      </el-form-item>

      <el-divider content-position="left">选择账号</el-divider>
      <el-form-item label="账号分组" required>
        <el-select
          v-model="form.accountGroupIds"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          class="form-control"
          placeholder="请选择账号分组"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="`${group.name}（在线 ${group.onlineAccounts} / 总 ${group.totalAccounts}）`"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分组账号">
        <div class="account-panel">
          <div class="account-toolbar">
            <span>
              可用 {{ selectedGroupSummary.online }} / 总
              {{ selectedGroupSummary.total }} · 已选
              {{ selectedAccountCount }}
            </span>
            <div class="toolbar-actions">
              <el-button size="small" @click="toggleVisibleAccounts">
                {{ allVisibleSelected ? "取消全选" : "全选当前筛选" }}
              </el-button>
              <el-button size="small" @click="clearSelectedAccounts">
                清空
              </el-button>
            </div>
          </div>
          <div class="account-filters">
            <el-input
              v-model="accountKeyword"
              clearable
              class="account-search"
              placeholder="搜索账号号码"
            />
            <el-checkbox v-model="onlyAvailable">只看可用</el-checkbox>
            <el-checkbox v-model="onlyOnline">只看在线</el-checkbox>
          </div>
          <el-table
            v-loading="accountsLoading"
            :data="visibleAccounts"
            height="260"
            row-key="id"
            border
          >
            <el-table-column width="48">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="isChecked(asAccountOption(row).id)"
                  :disabled="asAccountOption(row).disabled"
                  @change="setAccountChecked(asAccountOption(row), $event)"
                />
              </template>
            </el-table-column>
            <el-table-column
              prop="phone"
              label="账号号码"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="groupName"
              label="所属分组"
              min-width="140"
              show-overflow-tooltip
            />
            <el-table-column label="在线状态" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.isOnline ? 'success' : 'info'"
                  effect="plain"
                >
                  {{ row.stateLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风控状态" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.disabled ? 'danger' : 'success'"
                  effect="plain"
                >
                  {{ row.riskLabel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="管理员设置状态" width="150">
              <template #default="{ row }">
                {{ row.isAdmin ? "已被设置为管理" : "未被设置为管理" }}
              </template>
            </el-table-column>
            <template #empty>
              <el-empty description="暂无可选账号" />
            </template>
          </el-table>
        </div>
      </el-form-item>

      <el-divider content-position="left">进群链接</el-divider>
      <el-form-item label="群链接" required>
        <el-input
          v-model="form.linksText"
          type="textarea"
          :rows="6"
          placeholder="一行一个群链接"
        />
      </el-form-item>
      <el-form-item label="链接数量">
        <el-tag effect="plain">{{ linkCount }} 条</el-tag>
      </el-form-item>

      <el-divider content-position="left">分配方式</el-divider>
      <el-form-item label="分配方式" required>
        <el-radio-group v-model="form.distributionMode" class="mode-group">
          <el-radio-button
            v-for="option in joinTaskDistributionOptions"
            :key="option.value"
            :label="option.value"
          >
            {{ option.label }}
          </el-radio-button>
        </el-radio-group>
      </el-form-item>
      <template v-if="form.distributionMode === 'FIXED_ACCOUNTS_PER_LINK'">
        <el-form-item label="每条链接账号数" required>
          <el-input-number v-model="form.accountsPerLink" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="执行间隔" required>
          <div class="inline-number">
            <el-input-number
              v-model="form.fixedIntervalMinSec"
              :min="1"
              :step="1"
            />
            <span>至</span>
            <el-input-number
              v-model="form.fixedIntervalMaxSec"
              :min="1"
              :step="1"
            />
            <span>秒</span>
          </div>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="执行账号数量" required>
          <el-input-number
            v-model="form.executorAccountCount"
            :min="1"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="每账号链接数" required>
          <el-input-number v-model="form.linksPerAccount" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="执行间隔" required>
          <div class="inline-number">
            <el-input-number
              v-model="form.multiIntervalMinSec"
              :min="1"
              :step="1"
            />
            <span>至</span>
            <el-input-number
              v-model="form.multiIntervalMaxSec"
              :min="1"
              :step="1"
            />
            <span>秒</span>
          </div>
        </el-form-item>
      </template>

      <el-divider content-position="left">失败处理</el-divider>
      <el-form-item label="失败自动重试">
        <el-switch v-model="form.retryEnabled" />
      </el-form-item>
      <el-form-item label="重试次数" required>
        <el-input-number
          v-model="form.retryLimit"
          :disabled="!form.retryEnabled"
          :min="1"
          :step="1"
        />
      </el-form-item>
      <el-form-item label="失败策略">
        <el-select v-model="form.failurePolicy" class="form-control">
          <el-option
            v-for="policy in failurePolicyOptions"
            :key="policy.value"
            :label="policy.label"
            :value="policy.value"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        保存进群任务
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.editor-form {
  padding-right: 12px;
}

.form-control,
.account-panel,
.mode-group {
  width: 100%;
}

.account-panel {
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.account-toolbar,
.account-filters,
.inline-number {
  display: flex;
  gap: 10px;
  align-items: center;
}

.account-toolbar {
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--el-text-color-secondary);
}

.account-filters {
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.account-search {
  width: 220px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.inline-number span {
  color: var(--el-text-color-secondary);
}
</style>
