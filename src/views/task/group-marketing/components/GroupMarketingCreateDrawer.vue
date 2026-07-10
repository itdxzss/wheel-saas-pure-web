<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { LoadFunction } from "element-plus";
import type {
  MarketingSelection,
  MarketingTreeAccount
} from "@/api/marketing-task";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { MarketingTemplateRow } from "@/api/marketing-template";
import {
  accountTreeKey,
  buildMarketingSelections,
  defaultDynamicAccountIds,
  groupTreeKey,
  parseMarketingTreeKey
} from "../composables/marketing-selection";
import { disableAccountGroupSendDate } from "../composables/useGroupMarketingTaskPage";
import type {
  GroupMarketingCreateForm,
  GroupMarketingCreatePayload
} from "../composables/useGroupMarketingTaskPage";

defineOptions({
  name: "GroupMarketingCreateDrawer"
});

interface TreeNode {
  id: string;
  label: string;
  disabled?: boolean;
  isLeaf?: boolean;
  children?: TreeNode[];
}

interface TreeRef {
  getCheckedKeys: (leafOnly?: boolean) => Array<string | number>;
  setCheckedKeys: (keys: Array<string | number>) => void;
}

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  marketingTemplates: MarketingTemplateRow[];
  treeAccounts: MarketingTreeAccount[];
  treeLoading: boolean;
  loadAccountGroups: (
    accountId: number
  ) => Promise<MarketingTreeAccount | null>;
}>();

const emit = defineEmits<{
  (event: "account-group-change", groupId: number | ""): void;
  (event: "submit", payload: GroupMarketingCreatePayload): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<GroupMarketingCreateForm>("form", { required: true });
const treeRef = ref<TreeRef>();
const dynamicAccountIds = ref<Set<number>>(new Set());
const loadedAccountsById = ref<Map<number, MarketingTreeAccount>>(new Map());

const treeProps = {
  children: "children",
  label: "label",
  disabled: "disabled",
  isLeaf: "isLeaf"
};

function accountStatusText(account: MarketingTreeAccount): string {
  const text = account.statusText?.trim();
  if (text) {
    return statusTextFromCode(text) ?? text;
  }
  return statusTextFromCode(account.status) ?? "离线";
}

function statusTextFromCode(status: string | null | undefined): string | null {
  switch (status?.trim().toUpperCase()) {
    case "ONLINE":
      return "在线";
    case "RISK":
      return "风控";
    case "BANNED":
      return "封禁";
    case "MUTED":
      return "禁言";
    case "UNAVAILABLE":
      return "不可用";
    case "OFFLINE":
      return "离线";
    default:
      return null;
  }
}

function accountGroupCount(account: MarketingTreeAccount): number {
  if (
    typeof account.groupCount === "number" &&
    Number.isFinite(account.groupCount)
  ) {
    return Math.max(0, Math.trunc(account.groupCount));
  }
  return account.groups.length;
}

function accountSelectable(account: MarketingTreeAccount): boolean {
  return (
    (account.selectable ?? account.status === "ONLINE") &&
    account.groupsError !== true
  );
}

const treeData = computed<TreeNode[]>(() =>
  props.treeAccounts.map(account => ({
    id: accountTreeKey(account.accountId),
    label: `${account.wsPhone} · ${accountStatusText(account)} · ${accountGroupCount(account)}个群`,
    disabled: !accountSelectable(account),
    isLeaf: !accountSelectable(account)
  }))
);

const onlineAccountCount = computed(
  () =>
    props.treeAccounts.filter(account => accountStatusText(account) === "在线")
      .length
);

const accountListSignature = computed(() =>
  props.treeAccounts
    .map(
      account =>
        `${account.accountId}:${account.status}:${account.statusText ?? ""}:${
          account.groupCount ?? ""
        }:${account.selectable ?? ""}:${account.disabledReason ?? ""}:${
          account.groupsError
        }`
    )
    .join("|")
);

const totalGroupCount = computed(() =>
  props.treeAccounts.reduce(
    (total, account) => total + accountGroupCount(account),
    0
  )
);

function defaultCheckedKeys(): string[] {
  return Array.from(defaultDynamicAccountIds(props.treeAccounts)).map(
    accountTreeKey
  );
}

function resetCheckedKeys(): void {
  dynamicAccountIds.value = defaultDynamicAccountIds(props.treeAccounts);
  void nextTick(() => {
    treeRef.value?.setCheckedKeys(defaultCheckedKeys());
  });
}

watch(
  () => [accountListSignature.value, visible.value],
  () => {
    if (!visible.value) return;
    // 只在账号根节点集合变化时重置默认勾选。单账号懒加载群变化不能打断用户已做的勾选。
    loadedAccountsById.value = new Map();
    resetCheckedKeys();
  }
);

function onAccountGroupChange(value: number | ""): void {
  loadedAccountsById.value = new Map();
  dynamicAccountIds.value = new Set();
  emit("account-group-change", value);
}

function onTreeCheck(node: TreeNode): void {
  const parsed = parseMarketingTreeKey(node.id);
  if (!parsed) return;
  const nextDynamicAccountIds = new Set(dynamicAccountIds.value);
  if (parsed.type === "group") {
    // 用户明确点了群组,该账号改为固定群组维度;即使最终全选群组也不按账号动态处理。
    nextDynamicAccountIds.delete(parsed.accountId);
    dynamicAccountIds.value = nextDynamicAccountIds;
    return;
  }
  const checkedKeys = new Set(
    (treeRef.value?.getCheckedKeys(false) ?? []).map(key => String(key))
  );
  if (checkedKeys.has(accountTreeKey(parsed.accountId))) {
    nextDynamicAccountIds.add(parsed.accountId);
  } else {
    nextDynamicAccountIds.delete(parsed.accountId);
  }
  dynamicAccountIds.value = nextDynamicAccountIds;
}

function isTreeNode(value: unknown): value is TreeNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

function toGroupTreeNodes(account: MarketingTreeAccount): TreeNode[] {
  return account.groups.map(group => ({
    id: groupTreeKey(account.accountId, group.groupLinkId),
    label: `${group.groupName || group.groupJid} · ${
      group.isAdmin ? "管理员" : "成员"
    }`,
    disabled: !accountSelectable(account),
    isLeaf: true
  }));
}

const loadTreeNode: LoadFunction = (node, resolve) => {
  if (node.level === 0) {
    resolve(treeData.value);
    return;
  }
  const parsed = isTreeNode(node.data)
    ? parseMarketingTreeKey(node.data.id)
    : null;
  if (!parsed || parsed.type !== "account") {
    resolve([]);
    return;
  }
  const account = props.treeAccounts.find(
    item => item.accountId === parsed.accountId
  );
  if (!account || !accountSelectable(account)) {
    resolve([]);
    return;
  }
  const cached = loadedAccountsById.value.get(parsed.accountId);
  if (cached) {
    resolve(toGroupTreeNodes(cached));
    return;
  }
  void props.loadAccountGroups(parsed.accountId).then(loaded => {
    if (!loaded || loaded.groupsError === true) {
      resolve([]);
      return;
    }
    const nextLoadedAccounts = new Map(loadedAccountsById.value);
    nextLoadedAccounts.set(parsed.accountId, loaded);
    loadedAccountsById.value = nextLoadedAccounts;
    resolve(toGroupTreeNodes(loaded));
  });
};

function buildSelections(): MarketingSelection[] {
  const checked = treeRef.value?.getCheckedKeys(true) ?? [];
  return buildMarketingSelections(checked, dynamicAccountIds.value);
}

function submit(): void {
  emit("submit", {
    form: { ...form.value },
    selections: buildSelections()
  });
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="720px"
    destroy-on-close
    title="新增营销任务"
  >
    <el-form :model="form" label-width="120px" class="create-form">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="form.taskName"
          clearable
          placeholder="请输入任务名称"
        />
      </el-form-item>
      <el-form-item label="选择账号分组" required>
        <el-select
          v-model="form.accountGroupId"
          filterable
          class="form-control"
          placeholder="请选择账号分组"
          @change="onAccountGroupChange"
        >
          <el-option
            v-for="group in accountGroups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="选择发送账号" required>
        <div class="tree-box">
          <div class="tree-toolbar">
            <span>
              在线账号 {{ onlineAccountCount }} 个 · 当前群组
              {{ totalGroupCount }} 个
            </span>
            <el-button size="small" @click="resetCheckedKeys"
              >全选账号</el-button
            >
          </div>
          <el-tree
            ref="treeRef"
            v-loading="treeLoading"
            show-checkbox
            lazy
            :load="loadTreeNode"
            :expand-on-click-node="true"
            node-key="id"
            :data="treeData"
            :props="treeProps"
            empty-text="该分组下暂无可营销账号"
            @check="onTreeCheck"
          />
        </div>
      </el-form-item>
      <el-form-item label="营销模板" required>
        <el-select
          v-model="form.marketingTemplateId"
          filterable
          class="form-control"
          placeholder="请选择营销模板"
        >
          <el-option
            v-for="template in marketingTemplates"
            :key="template.id"
            :label="template.templateName"
            :value="template.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账号群组发送时间">
        <el-date-picker
          v-model="form.accountGroupSendAt"
          type="datetime"
          value-format="x"
          class="form-control"
          clearable
          placeholder="默认开始前72小时"
          :disabled-date="disableAccountGroupSendDate"
        />
      </el-form-item>
      <el-form-item label="任务开始时间" required>
        <el-date-picker
          v-model="form.taskStartAt"
          type="datetime"
          value-format="x"
          class="form-control"
          placeholder="请选择任务开始时间"
        />
      </el-form-item>
      <el-form-item label="任务结束时间" required>
        <el-date-picker
          v-model="form.taskEndAt"
          type="datetime"
          value-format="x"
          class="form-control"
          placeholder="请选择任务结束时间"
        />
      </el-form-item>
      <el-form-item label="单轮发送数量">
        <el-input-number v-model="form.sendPerRound" :min="1" :step="1" />
      </el-form-item>
      <el-form-item label="发送间隔">
        <el-input-number
          v-model="form.sendIntervalSeconds"
          :min="1"
          :step="1"
        />
        <span class="unit">秒</span>
      </el-form-item>
      <el-form-item label="执行选项">
        <div class="switch-list">
          <el-switch
            v-model="form.onlineCheckEnabled"
            active-text="发送前检查账号在线"
          />
          <el-switch
            v-model="form.abnormalGroupSkipped"
            active-text="跳过异常群组"
          />
          <el-switch
            v-model="form.autoRetryEnabled"
            active-text="失败后自动重试"
          />
        </div>
      </el-form-item>
      <el-form-item label="任务备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="可填写本次营销任务说明，方便后续查询。"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">保存任务</el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.create-form {
  padding-right: 12px;
}

.form-control,
.tree-box {
  width: 100%;
}

.tree-box {
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
}

.switch-list {
  display: grid;
  gap: 8px;
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}
</style>
