<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import type { UploadFile } from "element-plus";
import type {
  PullTaskGroupCandidateRow,
  PullTaskGroupCandidateStatus,
  PullTaskGroupSource
} from "@/api/pull-task";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { PullTaskMarketingCreateDraft } from "../create-draft";
import { usePullTaskGroupCandidates } from "../usePullTaskGroupCandidates";

defineOptions({ name: "PullTaskMarketingCreateTargetGroupSection" });

interface CandidateTableRef {
  clearSelection: () => void;
  toggleRowSelection: (
    row: PullTaskGroupCandidateRow,
    selected: boolean
  ) => void;
}

const sourceLabels: Record<PullTaskGroupSource, string> = {
  HISTORICAL: "历史老群",
  SELF_COLLECTED: "自收群",
  MIXED: "混合来源"
};

const statusLabels: Record<PullTaskGroupCandidateStatus, string> = {
  NORMAL: "正常",
  WAITING_ACCOUNT_ONLINE: "等待账号上线",
  NO_ADMIN_PERMISSION: "无管理权限",
  NO_ELIGIBLE_ACCOUNT: "无可用账号",
  GROUP_BANNED: "群已封禁",
  LINK_INVALID: "链接失效",
  GROUP_UNAVAILABLE: "群不可用",
  UNKNOWN: "待确认",
  OCCUPIED: "已占用"
};

const draft = defineModel<PullTaskMarketingCreateDraft>({ required: true });
const candidateTable = ref<CandidateTableRef>();
const {
  candidateGroups,
  waitingGroups,
  candidateLoading,
  waitingPoolLoading,
  selectedCandidateJids,
  page,
  pageSize,
  total,
  loadCandidates,
  restoreWaitingPool,
  updateCandidateSelection,
  selectAllCurrentPage,
  addSelectedToWaitingPool,
  removeFromWaitingPool,
  releaseWaitingPool
} = usePullTaskGroupCandidates(draft);

onMounted(() => {
  void initializeGroups();
});

defineExpose({ releaseWaitingPool });

async function initializeGroups(): Promise<void> {
  await restoreWaitingPool();
  await refreshCandidates();
}

function selectAvatar(file: UploadFile): void {
  if (file.raw) draft.value.groupAvatarFile = file.raw;
}

function rowSelectable(row: PullTaskGroupCandidateRow): boolean {
  return row.selectable && !row.inCurrentWaitingPool;
}

async function searchCandidates(): Promise<void> {
  page.value = 1;
  selectedCandidateJids.value = [];
  candidateTable.value?.clearSelection();
  await refreshCandidates();
}

async function refreshCandidates(): Promise<void> {
  const selected = new Set(selectedCandidateJids.value);
  await loadCandidates();
  await nextTick();
  candidateTable.value?.clearSelection();
  for (const row of candidateGroups.value) {
    if (selected.has(row.groupJid)) {
      candidateTable.value?.toggleRowSelection(row, true);
    }
  }
}

async function selectAllExecutable(): Promise<void> {
  const rows = selectAllCurrentPage();
  await nextTick();
  candidateTable.value?.clearSelection();
  for (const row of rows) {
    candidateTable.value?.toggleRowSelection(row, true);
  }
}

async function addToWaitingPool(): Promise<void> {
  await addSelectedToWaitingPool();
  candidateTable.value?.clearSelection();
  if (waitingGroups.value.length > 0)
    draft.value.targetGroupTab = "WAITING_POOL";
}

function sourceLabel(source: PullTaskGroupSource): string {
  return sourceLabels[source];
}

function accountLabel(row: PullTaskGroupCandidateRow): string {
  if (row.operableAccounts.length === 0) return "--";
  return row.operableAccounts
    .map(account => {
      const role = account.groupRole === "CREATOR" ? "群主" : "管理员";
      const online = account.loginState === 1 ? "在线" : "离线";
      return `${account.accountPhone}（${role}/${online}）`;
    })
    .join("、");
}

function countryLabel(row: PullTaskGroupCandidateRow): string {
  return [row.countryFlag, row.countryName].filter(Boolean).join(" ") || "--";
}

function statusTagType(
  row: PullTaskGroupCandidateRow
): "success" | "warning" | "info" | "danger" {
  if (row.inCurrentWaitingPool || row.status === "OCCUPIED") return "info";
  if (row.status === "NORMAL") return "success";
  if (row.status === "WAITING_ACCOUNT_ONLINE" || row.status === "UNKNOWN") {
    return "warning";
  }
  return "danger";
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return "--";
  const milliseconds =
    timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(milliseconds).toLocaleString("zh-CN", { hour12: false });
}
</script>

<template>
  <el-card shadow="never" class="create-section">
    <template #header>
      <div class="section-header">
        <el-tag round type="success">2</el-tag>
        <div>
          <strong>目标群配置</strong>
          <p>群资源、成员清理、资料权限、目标群组与等待任务池</p>
        </div>
      </div>
    </template>

    <div class="form-grid">
      <el-form-item label="群资源使用方式">
        <el-radio-group v-model="draft.resourceSource">
          <el-radio-button value="HISTORICAL">历史老群</el-radio-button>
          <el-radio-button value="SELF_COLLECTED">自收群</el-radio-button>
          <el-radio-button value="MIXED">混合来源</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="是否清空当前群成员">
        <el-switch
          v-model="draft.clearMembers"
          active-text="清空"
          inactive-text="不清理"
        />
      </el-form-item>

      <el-form-item label="是否禁言">
        <el-radio-group v-model="draft.muted">
          <el-radio-button :value="false">否</el-radio-button>
          <el-radio-button :value="true">是</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="群最大人数" required>
        <el-input-number v-model="draft.groupMaxMembers" :min="1" :max="1024" />
      </el-form-item>

      <el-form-item label="群名称修改方式">
        <el-radio-group v-model="draft.groupNameMode">
          <el-radio-button value="KEEP">不修改</el-radio-button>
          <el-radio-button value="UNIFIED">使用统一名称</el-radio-button>
          <el-radio-button value="TEMPLATE_SEQUENCE"
            >名称模板加序号</el-radio-button
          >
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="draft.groupNameMode === 'UNIFIED'"
        label="统一群名称"
        required
      >
        <el-input
          v-model="draft.unifiedGroupName"
          maxlength="100"
          show-word-limit
          placeholder="请输入所有目标群统一使用的名称"
        />
      </el-form-item>

      <el-form-item
        v-else-if="draft.groupNameMode === 'TEMPLATE_SEQUENCE'"
        label="群名称模板"
        required
      >
        <el-input
          v-model="draft.groupNameTemplate"
          maxlength="100"
          show-word-limit
          placeholder="例如：活动群-{序号}"
        />
      </el-form-item>

      <el-form-item label="群头像">
        <div class="upload-row">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            :on-change="selectAvatar"
          >
            <el-button>选择文件</el-button>
          </el-upload>
          <span>{{ draft.groupAvatarFile?.name || "不修改" }}</span>
        </div>
      </el-form-item>

      <el-form-item label="群描述">
        <el-radio-group v-model="draft.groupDescriptionMode">
          <el-radio-button value="KEEP">不修改</el-radio-button>
          <el-radio-button value="UNIFIED">使用统一描述</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="draft.groupDescriptionMode === 'UNIFIED'"
        label="统一群描述"
        required
      >
        <el-input
          v-model="draft.unifiedGroupDescription"
          type="textarea"
          :rows="3"
          maxlength="512"
          show-word-limit
          placeholder="请输入所有目标群统一使用的描述"
        />
      </el-form-item>

      <el-form-item label="群资料修改权限">
        <el-select v-model="draft.groupInfoPermission">
          <el-option label="仅管理员" value="ADMIN_ONLY" />
          <el-option label="所有成员" value="ALL_MEMBERS" />
        </el-select>
      </el-form-item>

      <el-form-item label="入群审批">
        <el-select v-model="draft.joinApproval">
          <el-option label="开启" value="ENABLED" />
          <el-option label="关闭" value="DISABLED" />
        </el-select>
      </el-form-item>

      <el-form-item label="成员邀请权限">
        <el-select v-model="draft.memberInvitePermission">
          <el-option label="仅管理员" value="ADMIN_ONLY" />
          <el-option label="所有成员" value="ALL_MEMBERS" />
        </el-select>
      </el-form-item>
    </div>

    <el-alert
      title="修改群资料或权限后，创建前需要重新读取群资料进行校验"
      type="info"
      :closable="false"
      class="section-alert"
    />

    <el-tabs v-model="draft.targetGroupTab" class="target-tabs">
      <el-tab-pane label="目标群组选择" name="CANDIDATES">
        <div class="filter-grid">
          <el-form-item label="群组来源">
            <el-select v-model="draft.resourceSource">
              <el-option label="历史老群" value="HISTORICAL" />
              <el-option label="自收群" value="SELF_COLLECTED" />
              <el-option label="混合来源" value="MIXED" />
            </el-select>
          </el-form-item>
          <el-form-item label="群名称">
            <el-input
              v-model="draft.groupNameKeyword"
              clearable
              placeholder="模糊匹配"
            />
          </el-form-item>
          <el-form-item label="群组 JID">
            <el-input
              v-model="draft.groupJid"
              clearable
              placeholder="精确匹配"
            />
          </el-form-item>
          <el-form-item label="当前管理账号">
            <el-input
              v-model="draft.managerPhone"
              clearable
              placeholder="手机号模糊匹配"
            />
          </el-form-item>
          <el-form-item label="显示普通成员群组">
            <el-switch v-model="draft.showRegularGroups" />
          </el-form-item>
          <el-form-item label="发言权限">
            <el-select
              v-model="draft.speakPermission"
              clearable
              placeholder="不限"
            >
              <el-option label="仅管理员" value="ADMIN_ONLY" />
              <el-option label="所有成员" value="ALL_MEMBERS" />
            </el-select>
          </el-form-item>
          <el-form-item label="群当前人数" class="range-field">
            <el-slider
              v-model="draft.memberCountRange"
              range
              :min="0"
              :max="1024"
            />
          </el-form-item>
          <el-form-item label="群所属大洲">
            <el-select
              v-model="draft.continent"
              disabled
              placeholder="元数据同步后开放"
            />
          </el-form-item>
          <el-form-item label="群所属国家">
            <el-select
              v-model="draft.countries"
              multiple
              disabled
              placeholder="元数据同步后开放"
            />
          </el-form-item>
          <el-form-item label="当前账号角色">
            <el-select
              v-model="draft.currentRole"
              disabled
              placeholder="元数据同步后开放"
            />
          </el-form-item>
          <el-form-item label="群组状态">
            <el-select
              v-model="draft.groupStatus"
              disabled
              placeholder="后续筛选项"
            />
          </el-form-item>
          <el-form-item label="是否被其他任务占用">
            <el-select
              v-model="draft.occupancy"
              disabled
              placeholder="列表直接展示占用状态"
            />
          </el-form-item>
          <el-form-item label="入群审批">
            <el-select
              v-model="draft.filterJoinApproval"
              disabled
              placeholder="元数据同步后开放"
            />
          </el-form-item>
          <el-form-item label="成员邀请权限">
            <el-select
              v-model="draft.filterInvitePermission"
              disabled
              placeholder="元数据同步后开放"
            />
          </el-form-item>
          <el-form-item label="群存续天数" class="range-field">
            <el-slider
              v-model="draft.groupAgeRange"
              range
              disabled
              :min="0"
              :max="3650"
            />
          </el-form-item>
        </div>

        <div class="candidate-summary" data-testid="candidate-summary">
          <span
            >当前筛选 {{ total }} 个 · 已勾选
            {{ selectedCandidateJids.length }} 个</span
          >
          <div>
            <el-button @click="searchCandidates">查询</el-button>
            <el-button
              data-testid="select-current-page"
              @click="selectAllExecutable"
            >
              全选本页可执行
            </el-button>
            <el-button
              type="primary"
              :loading="waitingPoolLoading"
              data-testid="add-to-waiting-pool"
              @click="addToWaitingPool"
            >
              加入等待任务池
            </el-button>
          </div>
        </div>

        <el-table
          ref="candidateTable"
          v-loading="candidateLoading"
          data-testid="candidate-table"
          :data="candidateGroups"
          row-key="groupJid"
          border
          @selection-change="updateCandidateSelection"
        >
          <el-table-column
            type="selection"
            width="52"
            reserve-selection
            :selectable="rowSelectable"
          />
          <el-table-column prop="groupName" label="群组信息" min-width="180">
            <template #default="{ row }">
              <strong>{{ row.groupName || "未命名群组" }}</strong>
              <div class="muted-text">{{ row.groupJid }}</div>
            </template>
          </el-table-column>
          <el-table-column label="来源/国家" min-width="130">
            <template #default="{ row }">
              <div>{{ sourceLabel(row.source) }}</div>
              <div class="muted-text">{{ countryLabel(row) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="可操作管理账号" min-width="260">
            <template #default="{ row }">{{ accountLabel(row) }}</template>
          </el-table-column>
          <el-table-column prop="memberSize" label="人数" width="78" />
          <el-table-column label="最近同步" width="170">
            <template #default="{ row }">{{
              formatTime(row.lastSyncedAt)
            }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="170">
            <template #default="{ row }">
              <el-tooltip
                :content="row.disabledReason || ''"
                :disabled="!row.disabledReason"
              >
                <el-tag :type="statusTagType(row)">
                  {{ statusLabels[row.status] }}
                </el-tag>
              </el-tooltip>
              <div v-if="row.inCurrentWaitingPool" class="muted-text">
                已在当前等待池
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无符合筛选条件的群组" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="refreshCandidates"
        />
      </el-tab-pane>

      <el-tab-pane
        :label="`等待任务池 (${waitingGroups.length})`"
        name="WAITING_POOL"
      >
        <div class="waiting-actions">
          <el-button :loading="waitingPoolLoading" @click="restoreWaitingPool">
            刷新等待任务池
          </el-button>
        </div>
        <el-table
          v-loading="waitingPoolLoading"
          data-testid="waiting-pool-table"
          :data="waitingGroups"
          row-key="groupJid"
          border
        >
          <el-table-column prop="groupName" label="群组" min-width="180" />
          <el-table-column prop="groupJid" label="群组 JID" min-width="200" />
          <el-table-column label="来源" width="110">
            <template #default="{ row }">{{
              sourceLabel(row.source)
            }}</template>
          </el-table-column>
          <el-table-column label="管理账号" min-width="260">
            <template #default="{ row }">{{ accountLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="最近校验" width="170">
            <template #default="{ row }">{{
              formatTime(row.lastValidatedAt)
            }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="danger"
                :data-testid="`remove-waiting-${row.groupJid}`"
                @click="removeFromWaitingPool(row.groupJid)"
              >
                移出
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="尚未加入群组" />
          </template>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<style scoped>
.create-section {
  margin-bottom: 16px;
}

.section-header,
.upload-row,
.candidate-summary {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-header {
  align-items: flex-start;
}

.section-header strong {
  font-size: 16px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
}

.form-grid,
.filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}

.filter-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-input-number),
.filter-grid :deep(.el-select) {
  width: 100%;
}

.range-field {
  grid-column: span 2;
}

.section-alert {
  margin: 8px 0 16px;
}

.target-tabs {
  padding-top: 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.candidate-summary {
  justify-content: space-between;
  margin: 8px 0 16px;
  color: var(--el-text-color-regular);
}

.muted-text {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.waiting-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

@media (width <= 900px) {
  .form-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .range-field {
    grid-column: auto;
  }

  .candidate-summary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
