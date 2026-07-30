<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  createEmptyRoleAccountConfig,
  type PullTaskMarketingCreateDraft,
  type RoleResourceKey
} from "../create-draft";

defineOptions({ name: "PullTaskMarketingCreateRoleConfigSection" });

const draft = defineModel<PullTaskMarketingCreateDraft>({ required: true });

const resourceCards = [
  { key: "ADMIN", title: "管理员账号" },
  { key: "PULLER", title: "拉手账号" },
  { key: "WATER_ARMY", title: "水军账号" },
  { key: "MARKETER", title: "营销账号" }
] as const;

const activeRoleKey = ref<RoleResourceKey>("ADMIN");
const roleDialogVisible = ref(false);

function roleTitle(key: RoleResourceKey): string {
  return resourceCards.find(card => card.key === key)?.title ?? "角色账号";
}

function roleFilterSummary(key: RoleResourceKey): string {
  const config = draft.value.roleAccounts[key];
  const parts = [
    config.keyword.trim() ? "关键词：" + config.keyword.trim() : "",
    config.accountGroupId ? "分组：" + config.accountGroupId : "",
    config.selectedAccountIds.length
      ? "已选：" + config.selectedAccountIds.length + " 个"
      : ""
  ].filter(Boolean);
  return parts.join("；") || "未设置本地筛选条件";
}

function openRoleDialog(key: RoleResourceKey): void {
  activeRoleKey.value = key;
  roleDialogVisible.value = true;
}

function clearRoleAccount(key: RoleResourceKey): void {
  draft.value.roleAccounts[key] = createEmptyRoleAccountConfig();
  ElMessage.success(roleTitle(key) + "配置已清空");
}

function saveRoleFilter(): void {
  roleDialogVisible.value = false;
  ElMessage.success(roleTitle(activeRoleKey.value) + "本地筛选条件已保存");
}
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">3</el-tag>
        <div>
          <strong>角色账号与拉手配置</strong>
          <p>分别配置管理员账号、拉手账号、水军账号和营销账号</p>
        </div>
      </div>
    </template>

    <div class="resource-grid">
      <div v-for="card in resourceCards" :key="card.key" class="resource-card">
        <div class="resource-header">
          <div>
            <strong>{{ card.title }}</strong>
            <span>{{ roleFilterSummary(card.key) }}</span>
          </div>
          <div class="resource-actions">
            <el-button size="small" @click="openRoleDialog(card.key)">
              修改筛选条件
            </el-button>
            <el-button size="small" @click="clearRoleAccount(card.key)">
              清空
            </el-button>
          </div>
        </div>
        <div class="resource-counts">
          <span>
            当前可用
            <strong>{{
              draft.roleAccounts[card.key].availableCount ?? "--"
            }}</strong>
          </span>
          <span>
            已占用
            <strong>{{
              draft.roleAccounts[card.key].occupiedCount ?? "--"
            }}</strong>
          </span>
        </div>
        <el-empty
          :image-size="36"
          description="账号筛选接口待确认，当前保留本地筛选状态"
        />
      </div>
    </div>

    <div class="form-grid parameter-grid">
      <el-form-item label="每群计划使用拉手数量">
        <el-input-number v-model="draft.pullerCountPerGroup" :min="1" />
        <span class="field-unit">个/群</span>
      </el-form-item>
      <el-form-item label="每个拉手最多拉多少人">
        <el-input-number v-model="draft.maxPeoplePerPuller" :min="1" />
        <span class="field-unit">人</span>
      </el-form-item>
      <el-form-item label="单个拉手每次最多拉多少人">
        <el-input-number v-model="draft.maxPeoplePerPull" :min="1" />
        <span class="field-unit">人</span>
      </el-form-item>
      <el-form-item label="两次拉人之间等待时间">
        <el-input-number
          v-model="draft.pullIntervalMs"
          :min="500"
          :step="100"
        />
        <span class="field-unit">毫秒</span>
      </el-form-item>
      <el-form-item label="最大使用拉手总数">
        <el-input-number v-model="draft.maxPullers" :min="0" />
        <span class="field-unit">0 表示不限</span>
      </el-form-item>
      <el-form-item label="最大使用群组数">
        <el-input-number v-model="draft.maxGroups" :min="0" />
        <span class="field-unit">0 表示不限</span>
      </el-form-item>
      <el-form-item label="连续异常群组上限">
        <el-input-number v-model="draft.abnormalGroupLimit" :min="0" />
        <span class="field-unit">0 表示不限</span>
      </el-form-item>
      <el-form-item label="拉手最大重试次数">
        <el-input-number v-model="draft.pullerRetryLimit" :min="0" />
        <span class="field-unit">次</span>
      </el-form-item>
      <el-form-item label="拉手熔断次数">
        <el-input-number v-model="draft.pullerCircuitBreakCount" :min="1" />
        <span class="field-unit">次</span>
      </el-form-item>
      <el-form-item label="拉手完成后是否退出群组">
        <el-switch
          v-model="draft.pullerExitAfterCompletion"
          active-text="已开启"
          inactive-text="已关闭"
        />
      </el-form-item>
      <el-form-item label="到达执行上限后的处理方式">
        <el-radio-group v-model="draft.upperLimitAction">
          <el-radio-button value="PAUSE">暂停</el-radio-button>
          <el-radio-button value="STOP">停止</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="每群计划水军人数">
        <el-input-number v-model="draft.waterArmyPerGroup" :min="0" />
        <span class="field-unit">人/群</span>
      </el-form-item>
      <el-form-item label="水军单任务入群上限">
        <el-input-number v-model="draft.waterArmyTaskGroupLimit" :min="0" />
        <span class="field-unit">个群</span>
      </el-form-item>
      <el-form-item label="水军每日入群上限">
        <el-input-number v-model="draft.waterArmyDailyGroupLimit" :min="0" />
        <span class="field-unit">个群</span>
      </el-form-item>
      <el-form-item label="允许跨任务复用">
        <el-switch
          v-model="draft.allowCrossTaskReuse"
          active-text="已开启"
          inactive-text="已关闭"
        />
      </el-form-item>
      <el-form-item label="水军资源不足处理">
        <el-select v-model="draft.waterArmyShortageAction">
          <el-option label="暂停当前群" value="PAUSE_GROUP" />
          <el-option label="允许部分完成" value="PARTIAL_COMPLETE" />
          <el-option label="转人工" value="MANUAL" />
        </el-select>
      </el-form-item>
      <el-form-item label="允许降低计划数量">
        <el-switch
          v-model="draft.allowReducePlan"
          active-text="已开启"
          inactive-text="已关闭"
        />
      </el-form-item>
      <el-form-item label="允许替换水军">
        <el-switch
          v-model="draft.allowWaterArmyReplacement"
          active-text="已开启"
          inactive-text="已关闭"
        />
      </el-form-item>
    </div>

    <el-alert
      title="营销账号进入群组不占用拉手额度；拉手额度按实际尝试人数统计"
      type="info"
      :closable="false"
    />

    <el-dialog
      v-model="roleDialogVisible"
      :title="roleTitle(activeRoleKey) + '筛选条件'"
      width="520px"
      append-to-body
    >
      <el-alert
        title="账号筛选接口待确认；以下条件仅保存在当前前端草稿中"
        type="info"
        :closable="false"
        class="role-dialog-alert"
      />
      <el-form label-position="top">
        <el-form-item label="账号关键词">
          <el-input
            v-model="draft.roleAccounts[activeRoleKey].keyword"
            clearable
            placeholder="手机号、备注或账号标识"
          />
        </el-form-item>
        <el-form-item label="账号分组 ID">
          <el-input-number
            v-model="draft.roleAccounts[activeRoleKey].accountGroupId"
            :min="1"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoleFilter"
          >保存本地条件</el-button
        >
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped>
.create-section {
  margin-bottom: 16px;
}

.section-header,
.resource-header,
.resource-actions,
.resource-counts {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-header {
  align-items: flex-start;
}

.section-header strong,
.resource-card strong {
  font-size: 16px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.resource-card {
  padding: 16px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.resource-header {
  justify-content: space-between;
}

.resource-header > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-header span,
.field-unit {
  color: var(--el-text-color-secondary);
}

.role-dialog-alert {
  margin-bottom: 16px;
}

.resource-counts {
  margin-top: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.parameter-grid :deep(.el-input-number),
.parameter-grid :deep(.el-select) {
  flex: 1;
  width: 100%;
}

.field-unit {
  margin-left: 8px;
  white-space: nowrap;
}

@media (width <= 900px) {
  .resource-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
