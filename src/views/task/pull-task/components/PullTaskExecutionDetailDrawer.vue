<script setup lang="ts">
import type {
  PullTaskStandardExecutionDetail,
  PullTaskStandardMember
} from "@/api/pull-task";
import { formatEpoch, standardStageLabel } from "../constants";
import {
  actionTypeLabel,
  formatGroupLinkUrl,
  pullerAccountLabel,
  roleLabel,
  stationAccountLabel
} from "../standard-execution-display";

defineOptions({ name: "PullTaskExecutionDetailDrawer" });

defineProps<{
  loading: boolean;
  detail: PullTaskStandardExecutionDetail | null;
  members: PullTaskStandardMember[];
}>();

const visible = defineModel<boolean>({ required: true });

function membershipLabel(value: number): string {
  return (
    (
      {
        0: "未入群",
        1: "入群中",
        2: "在群",
        3: "入群失败",
        4: "结果未知"
      } as const
    )[value] ?? "未知"
  );
}

function availabilityLabel(value: number): string {
  return (
    ({ 1: "可用", 2: "风控冷却", 3: "离线或不可用", 4: "已移出" } as const)[
      value
    ] ?? "未知"
  );
}

function resultLabel(value: number): string {
  return (
    (
      {
        1: "待执行",
        2: "已提交",
        3: "成功",
        4: "失败",
        5: "结果未知",
        6: "已取消"
      } as const
    )[value] ?? "未知"
  );
}

function callStatusLabel(value: number): string {
  return (
    (
      {
        1: "已计划",
        2: "已提交",
        3: "已回写",
        4: "结果未知",
        5: "已取消"
      } as const
    )[value] ?? "未知"
  );
}

function pullStatusLabel(value: number): string {
  return (
    (
      {
        0: "未消费",
        1: "已提交",
        2: "成功",
        3: "失败",
        4: "结果未知",
        5: "已取消"
      } as const
    )[value] ?? "未知"
  );
}

function adminStatusLabel(value: number): string {
  return (
    (
      {
        0: "不需要",
        1: "待执行",
        2: "已提交",
        3: "成功",
        4: "失败",
        5: "结果未知",
        6: "已取消"
      } as const
    )[value] ?? "未知"
  );
}

function accountLabel(
  roles: PullTaskStandardExecutionDetail["roles"],
  roleRowId: number
): string {
  const role = roles.find(item => item.roleRowId === roleRowId);
  return role?.accountPhone || "-";
}
</script>

<template>
  <el-drawer
    v-model="visible"
    size="1050px"
    destroy-on-close
    title="群执行明细"
  >
    <div v-loading="loading">
      <el-descriptions v-if="detail" :column="3" border class="overview">
        <el-descriptions-item label="执行行">
          #{{ detail.execution.seq }} / {{ detail.execution.executionId }}
        </el-descriptions-item>
        <el-descriptions-item label="当前阶段">
          {{ standardStageLabel(detail.execution.stage) }}
        </el-descriptions-item>
        <el-descriptions-item label="最近执行">
          {{ formatEpoch(detail.execution.lastBusinessExecutedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="群 JID">
          {{ detail.execution.groupJid || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="群链接" :span="2">
          {{ formatGroupLinkUrl(detail.execution.normalizedLink) }}
        </el-descriptions-item>
        <el-descriptions-item label="当前异常" :span="3">
          {{
            detail.execution.reasonMessage || detail.execution.reasonCode || "-"
          }}
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-if="detail" model-value="roles">
        <el-tab-pane label="账号资源" name="roles">
          <el-table :data="detail.roles" row-key="roleRowId" border>
            <el-table-column prop="roleSeq" label="顺序" width="80" />
            <el-table-column label="角色" width="100">
              <template #default="{ row }">{{
                roleLabel(row.roleType)
              }}</template>
            </el-table-column>
            <el-table-column prop="accountPhone" label="账号" min-width="150" />
            <el-table-column label="在群状态" width="120">
              <template #default="{ row }">{{
                membershipLabel(row.membershipStatus)
              }}</template>
            </el-table-column>
            <el-table-column label="管理员权限" width="120">
              <template #default="{ row }">{{
                adminStatusLabel(row.adminStatus)
              }}</template>
            </el-table-column>
            <el-table-column label="可用状态" width="140">
              <template #default="{ row }">{{
                availabilityLabel(row.availabilityStatus)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="unavailableReasonCode"
              label="异常原因"
              min-width="180"
            />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="执行动作" name="actions">
          <el-table :data="detail.actions" row-key="actionId" border>
            <el-table-column label="动作" width="130">
              <template #default="{ row }">{{
                actionTypeLabel(row.actionType)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="actorRoleRowId"
              label="发起角色行"
              width="120"
            />
            <el-table-column label="发起账号" min-width="150">
              <template #default="{ row }">
                {{ accountLabel(detail.roles, row.actorRoleRowId) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="targetRoleRowId"
              label="目标角色行"
              width="120"
            />
            <el-table-column label="目标账号" min-width="150">
              <template #default="{ row }">
                {{ accountLabel(detail.roles, row.targetRoleRowId) }}
              </template>
            </el-table-column>
            <el-table-column label="结果" width="110">
              <template #default="{ row }">{{
                resultLabel(row.actionStatus)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="reasonMessage"
              label="原因"
              min-width="180"
            />
            <el-table-column label="回写时间" width="180">
              <template #default="{ row }">{{
                formatEpoch(row.resultAt)
              }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="拉人调用" name="calls">
          <el-table :data="detail.calls" row-key="callId" border>
            <el-table-column prop="callSeq" label="调用顺序" width="100" />
            <el-table-column
              prop="pullerAccountId"
              label="拉手账号 ID"
              width="130"
            />
            <el-table-column
              label="拉手账号"
              min-width="150"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ pullerAccountLabel(detail.roles, row.pullerAccountId) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="plannedMaterialCount"
              label="计划料子"
              width="100"
            />
            <el-table-column
              prop="plannedStationCount"
              label="计划站台"
              width="100"
            />
            <el-table-column
              label="站台账号"
              min-width="180"
              show-overflow-tooltip
            >
              <template #default="{ row }">
                {{ stationAccountLabel(detail.roles, row.callId) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">{{
                callStatusLabel(row.callStatus)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="reasonMessage"
              label="原因"
              min-width="180"
            />
            <el-table-column label="回写时间" width="180">
              <template #default="{ row }">{{
                formatEpoch(row.resultAt)
              }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="逐成员结果" name="members">
          <el-table :data="members" row-key="memberId" border>
            <el-table-column prop="memberSeq" label="顺序" width="80" />
            <el-table-column
              prop="normalizedPhone"
              label="号码"
              min-width="150"
            />
            <el-table-column label="入群结果" width="110">
              <template #default="{ row }">{{
                pullStatusLabel(row.pullStatus)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="pullReasonMessage"
              label="入群原因"
              min-width="180"
            />
            <el-table-column label="需管理员" width="100">
              <template #default="{ row }">{{
                row.adminRequired ? "是" : "否"
              }}</template>
            </el-table-column>
            <el-table-column label="提权结果" width="110">
              <template #default="{ row }">{{
                adminStatusLabel(row.adminStatus)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="adminReasonCode"
              label="提权原因"
              min-width="160"
            />
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <el-empty v-else-if="!loading" description="暂无执行明细" />
    </div>
  </el-drawer>
</template>

<style scoped>
.overview {
  margin-bottom: 16px;
}
</style>
