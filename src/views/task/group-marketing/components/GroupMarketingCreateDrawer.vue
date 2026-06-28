<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type {
  MarketingSelection,
  MarketingTreeAccount
} from "@/api/marketing-task";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { MarketingTemplateRow } from "@/api/marketing-template";
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
}>();

const emit = defineEmits<{
  (event: "account-group-change", groupId: number | ""): void;
  (event: "submit", payload: GroupMarketingCreatePayload): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<GroupMarketingCreateForm>("form", { required: true });
const treeRef = ref<TreeRef>();

const treeProps = {
  children: "children",
  label: "label",
  disabled: "disabled"
};

const treeData = computed<TreeNode[]>(() =>
  props.treeAccounts.map(account => ({
    id: `account:${account.accountId}`,
    label: `${account.wsPhone} · ${account.status}`,
    disabled: account.status !== "ONLINE",
    children: account.groups.map(group => ({
      id: `group:${account.accountId}:${group.groupLinkId}`,
      label: `${group.groupName || group.groupJid} · ${
        group.isAdmin ? "管理员" : "成员"
      }`,
      disabled: account.status !== "ONLINE"
    }))
  }))
);

const onlineAccountCount = computed(
  () => props.treeAccounts.filter(account => account.status === "ONLINE").length
);

const totalGroupCount = computed(() =>
  props.treeAccounts.reduce(
    (total, account) => total + account.groups.length,
    0
  )
);

function defaultCheckedKeys(): string[] {
  return props.treeAccounts.flatMap(account =>
    account.status === "ONLINE"
      ? account.groups.map(
          group => `group:${account.accountId}:${group.groupLinkId}`
        )
      : []
  );
}

function resetCheckedKeys(): void {
  void nextTick(() => {
    treeRef.value?.setCheckedKeys(defaultCheckedKeys());
  });
}

watch(
  () => [props.treeAccounts, visible.value],
  () => {
    if (visible.value) resetCheckedKeys();
  },
  { deep: true }
);

function onAccountGroupChange(value: number | ""): void {
  emit("account-group-change", value);
}

function buildSelections(): MarketingSelection[] {
  const checked = treeRef.value?.getCheckedKeys(true) ?? [];
  const grouped = new Map<number, number[]>();
  for (const key of checked) {
    const value = String(key);
    if (!value.startsWith("group:")) continue;
    const [, accountIdRaw, groupLinkIdRaw] = value.split(":");
    const accountId = Number(accountIdRaw);
    const groupLinkId = Number(groupLinkIdRaw);
    if (!Number.isFinite(accountId) || !Number.isFinite(groupLinkId)) continue;
    const groupIds = grouped.get(accountId) ?? [];
    groupIds.push(groupLinkId);
    grouped.set(accountId, groupIds);
  }
  return Array.from(grouped.entries()).map(([accountId, groupLinkIds]) => ({
    accountId,
    groupLinkIds
  }));
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
    title="新增群组营销任务"
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
              在线账号 {{ onlineAccountCount }} 个 · 可选群组
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
            default-expand-all
            node-key="id"
            :data="treeData"
            :props="treeProps"
            empty-text="该分组下暂无可营销账号"
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
      <el-form-item label="发送状态">
        <el-select v-model="form.startMode" class="form-control">
          <el-option label="待启动" value="PENDING" />
          <el-option label="立即启动" value="IMMEDIATE" />
        </el-select>
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
