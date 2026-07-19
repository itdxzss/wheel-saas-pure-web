<script setup lang="ts">
import { computed, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WheelPagination from "@/components/WheelPagination/index.vue";
import type { MarketingTaskRow } from "@/api/marketing-task";
import {
  canModifyTaskMaterial,
  formatEpoch,
  taskStatusLabel,
  taskStatusTagType
} from "../constants";
import Delete from "~icons/ep/delete";
import Plus from "~icons/ep/plus";
import GroupMarketingTemplatePreviewDialog from "./GroupMarketingTemplatePreviewDialog.vue";
import {
  marketingPromotionHref,
  marketingPromotionLink,
  marketingTemplateSummary
} from "./marketing-template-info";

defineOptions({
  name: "GroupMarketingTaskTable"
});

const props = defineProps<{
  columns: TableColumnList;
  loading: boolean;
  page: number;
  pageSize: number;
  rows: MarketingTaskRow[];
  selectedCount: number;
  total: number;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "delete-selected"): void;
  (event: "refresh"): void;
  (event: "row-action", row: MarketingTaskRow, action: string): void;
  (event: "selection-change", rows: MarketingTaskRow[]): void;
  (event: "update:page", value: number): void;
  (event: "update:pageSize", value: number): void;
}>();

const currentPage = computed({
  get: () => props.page,
  set: value => emit("update:page", value)
});
const currentPageSize = computed({
  get: () => props.pageSize,
  set: value => emit("update:pageSize", value)
});
const templatePreviewVisible = ref(false);
const previewTask = ref<MarketingTaskRow | null>(null);

function openTemplatePreview(row: MarketingTaskRow): void {
  previewTask.value = row;
  templatePreviewVisible.value = true;
}

function asMarketingTaskRow(row: unknown): MarketingTaskRow {
  return row as MarketingTaskRow;
}

function taskLifecycleAction(status: MarketingTaskRow["status"]): string {
  if (status === 1) return "start";
  if (status === 2) return "pause";
  if (status === 5) return "resume";
  return "";
}

function taskLifecycleLabel(status: MarketingTaskRow["status"]): string {
  if (status === 1) return "启动";
  if (status === 2) return "暂停";
  if (status === 5) return "继续";
  return "";
}

function taskLifecycleType(
  status: MarketingTaskRow["status"]
): "primary" | "success" | "warning" {
  if (status === 2) return "warning";
  return status === 5 ? "success" : "primary";
}
</script>

<template>
  <PureTableBar title="营销任务" :columns="columns" @refresh="emit('refresh')">
    <template #buttons>
      <el-button
        type="primary"
        :icon="useRenderIcon(Plus)"
        @click="emit('create')"
      >
        新增营销任务
      </el-button>
      <el-button
        type="danger"
        plain
        :disabled="selectedCount === 0"
        :icon="useRenderIcon(Delete)"
        @click="emit('delete-selected')"
      >
        批量删除
        <span v-if="selectedCount">({{ selectedCount }})</span>
      </el-button>
    </template>

    <template #default="{ dynamicColumns }">
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        @selection-change="emit('selection-change', $event)"
      >
        <el-table-column type="selection" width="48" />
        <el-table-column
          v-if="!dynamicColumns[0].hide"
          prop="id"
          label="ID"
          width="90"
        />
        <el-table-column
          v-if="!dynamicColumns[1].hide"
          label="任务名称"
          min-width="220"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="task-name-cell">
              <strong>{{ row.taskName }}</strong>
              <small>
                {{ row.accountGroupName }} · 营销模板 ·
                {{ row.marketingTemplateName || "-" }}
              </small>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[2].hide"
          label="营销模板预览"
          min-width="240"
        >
          <template #default="{ row }">
            <el-button
              v-if="
                marketingTemplateSummary(
                  row.marketingTemplateContent,
                  row.marketingTemplateBodyText
                ) !== '—'
              "
              link
              type="primary"
              class="template-preview-button"
              @click="openTemplatePreview(asMarketingTaskRow(row))"
            >
              <span class="template-summary">
                {{
                  marketingTemplateSummary(
                    row.marketingTemplateContent,
                    row.marketingTemplateBodyText
                  )
                }}
              </span>
            </el-button>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[3].hide"
          label="推广链接"
          min-width="220"
        >
          <template #default="{ row }">
            <el-tooltip
              v-if="marketingPromotionLink(row.marketingTemplatePromotionLink)"
              :content="
                marketingPromotionLink(row.marketingTemplatePromotionLink)
              "
              placement="top"
            >
              <el-link
                v-if="
                  marketingPromotionHref(row.marketingTemplatePromotionLink)
                "
                :href="
                  marketingPromotionHref(row.marketingTemplatePromotionLink)
                "
                target="_blank"
                rel="noopener noreferrer"
                type="primary"
                :underline="false"
                class="promotion-link"
              >
                {{ marketingPromotionLink(row.marketingTemplatePromotionLink) }}
              </el-link>
              <span v-else class="promotion-link">
                {{ marketingPromotionLink(row.marketingTemplatePromotionLink) }}
              </span>
            </el-tooltip>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[4].hide"
          label="营销账号在线数量"
          width="150"
        >
          <template #default="{ row }">
            {{ row.selectedAccountCount ?? 0 }} 个在线
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[5].hide"
          label="营销账号封禁/禁言"
          width="150"
        >
          <template #default="{ row }">
            <el-tag size="small" type="warning" effect="plain">
              失败 {{ row.failedMessageCount ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[6].hide"
          label="营销群组数量"
          width="130"
        >
          <template #default="{ row }">
            {{ row.targetGroupCount ?? 0 }} 个群
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[7].hide"
          label="发送条数"
          width="110"
        >
          <template #default="{ row }">
            {{ row.sentMessageCount ?? 0 }}
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[8].hide"
          label="发送状态"
          width="120"
        >
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="taskStatusTagType(row.status)"
              effect="plain"
            >
              {{ taskStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="!dynamicColumns[9].hide"
          label="最后发送时间"
          width="180"
        >
          <template #default="{ row }">
            {{ formatEpoch(row.lastSentAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="330">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="emit('row-action', asMarketingTaskRow(row), 'detail')"
            >
              明细
            </el-button>
            <el-button
              v-if="[1, 2, 5].includes(row.status)"
              link
              :type="taskLifecycleType(row.status)"
              @click="
                emit(
                  'row-action',
                  asMarketingTaskRow(row),
                  taskLifecycleAction(row.status)
                )
              "
            >
              {{ taskLifecycleLabel(row.status) }}
            </el-button>
            <el-button
              v-if="[1, 2, 5].includes(row.status)"
              link
              type="danger"
              @click="emit('row-action', asMarketingTaskRow(row), 'close')"
            >
              手动关闭
            </el-button>
            <el-button
              v-if="canModifyTaskMaterial(row.status)"
              link
              type="primary"
              @click="emit('row-action', asMarketingTaskRow(row), 'material')"
            >
              修改营销素材
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无符合条件的营销任务" />
        </template>
      </el-table>

      <WheelPagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :total="total"
        @change="emit('refresh')"
      />
    </template>
  </PureTableBar>

  <GroupMarketingTemplatePreviewDialog
    v-model="templatePreviewVisible"
    :task="previewTask"
  />
</template>

<style scoped>
.task-name-cell strong,
.task-name-cell small {
  display: block;
}

.task-name-cell small {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
}

.template-preview-button {
  justify-content: flex-start;
  width: 100%;
  padding: 0;
}

.template-summary,
.promotion-link {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
