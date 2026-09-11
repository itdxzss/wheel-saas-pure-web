<script setup lang="ts">
import { computed, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import Download from "~icons/ep/download";
import { contactTaskColumns } from "./domain/table-columns";
import type { ContactTaskListItem, ContactTaskStats } from "@/api/contact-task";
import ContactTaskSearchCard from "./components/ContactTaskSearchCard.vue";
import ContactTaskDrawer from "./components/ContactTaskDrawer.vue";
import ContactTaskAccountDrawer from "./components/ContactTaskAccountDrawer.vue";
import { useContactTaskPage } from "./composables/useContactTaskPage";
import {
  rangeTags,
  visibleRangeTags,
  hiddenRangeCount,
  flagUrl
} from "./domain/task-range";
import { MESSAGE_TYPE_LINK } from "./domain/task-form";
import { rowActions, statusLabel, statusTagType } from "./domain/task-status";

import ContactTaskProgress from "./components/ContactTaskProgress.vue";
import ContactTaskReceiptCell from "./components/ContactTaskReceiptCell.vue";
import { useContactRefresh } from "./composables/useContactRefresh";
import {
  needsReceiptRefresh,
  receiptCsv,
  type ReceiptFilter
} from "./domain/receipt-metrics";

defineOptions({ name: "ContactHyperlinkTask" });

const page = useContactTaskPage();
const initialFilter = ref<ReceiptFilter>("ALL");
function openResults(row: ContactTaskListItem, filter: ReceiptFilter = "ALL") {
  initialFilter.value = filter;
  page.openAccountData(row);
}
function updateStats(stats: ContactTaskStats) {
  const row = page.rows.value.find(item => item.id === stats.taskId);
  if (row) {
    row.stats = stats;
    row.runStatus = stats.runStatus;
  }
}
useContactRefresh(
  computed(
    () =>
      !page.drawerVisible.value &&
      !page.accountDrawerVisible.value &&
      !page.loading.value &&
      !page.deleting.value &&
      page.selectedRows.value.length === 0 &&
      page.rows.value.some(row => needsReceiptRefresh(row.stats))
  ),
  page.load
);
const { tableRef } = page;

const ACTION_LABELS: Record<string, string> = {
  start: "启动",
  pause: "暂停",
  resume: "恢复",
  stop: "停止",
  edit: "编辑",
  view: "查看",
  data: "任务结果"
};

/** 内容列：链接消息给标题，图文消息给文案预览。 */
function contentPreview(row: ContactTaskListItem): string {
  const text = row.messageType === MESSAGE_TYPE_LINK ? row.title : row.content;
  const trimmed = (text ?? "").trim();
  if (!trimmed) {
    return "-";
  }
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

function formatTime(value: number | null): string {
  return value ? new Date(value).toLocaleString() : "-";
}

const csvRows = computed(() =>
  page.rows.value.map(row => ({
    任务ID: row.id,
    任务名称: row.name,
    消息类型: row.messageType === MESSAGE_TYPE_LINK ? "链接消息" : "图文消息",
    消息标题: row.title ?? "",
    推广链接: row.promotionLink ?? "",
    状态: statusLabel(row.isEnabled, row.runStatus),
    ...receiptCsv(row.stats),
    计划开始时间: formatTime(row.taskStartAt)
  }))
);

/** 导出本页数据为 CSV，与竞品一致：导出的是当前页而不是全量。 */
function exportCsv() {
  const data = csvRows.value;
  if (data.length === 0) {
    return;
  }
  const headers = Object.keys(data[0]);
  const lines = [
    headers.join(","),
    ...data.map(item =>
      headers
        .map(key => {
          const cell = String((item as Record<string, unknown>)[key] ?? "");
          return `"${cell.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
  ];
  const blob = new Blob([`﻿${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `通讯录任务_${Date.now()}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function runAction(row: ContactTaskListItem, action: string) {
  if (action === "data") {
    openResults(row);
    return;
  }
  if (action === "edit") {
    page.openDetail(row.id, "edit");
    return;
  }
  if (action === "view") {
    page.openDetail(row.id, "view");
    return;
  }
  page.act(row, action as "start" | "pause" | "resume" | "stop");
}
</script>

<template>
  <div class="contact-task-page">
    <el-card shadow="never" class="intro-card">
      <div class="intro-title">
        通讯录营销
        <el-tag type="success" effect="plain" round>好友群发</el-tag>
      </div>
      <p>
        Android 账号自动获取自己的<b>云端 LID 联系人</b>，无需等待通讯录同步；
        Web 账号使用已有通讯录中的 LID 联系人及有名字的其他联系人。
        名单准备完成后固定本次收件人，按配置间隔逐条发送。准备状态和失败原因可在任务结果中查看。
      </p>
    </el-card>

    <ContactTaskSearchCard
      v-model:name="page.searchName.value"
      v-model:run-status="page.searchRunStatus.value"
      v-model:created-range="page.searchCreatedRange.value"
      @search="page.search"
      @reset="page.resetSearch"
    />

    <PureTableBar
      class="contact-table-bar"
      title=""
      :columns="contactTaskColumns"
      table-key="contact-hyperlink-task-list"
      @refresh="page.load"
    >
      <template #buttons>
        <div class="table-toolbar">
          <el-button
            type="primary"
            :icon="useRenderIcon(Plus)"
            @click="page.openCreate"
            >新建任务</el-button
          >
          <el-button
            v-perms="['tenant:contact_task:delete']"
            type="danger"
            :icon="useRenderIcon(Delete)"
            plain
            :loading="page.deleting.value"
            :disabled="page.loading.value || !page.selectedRows.value.length"
            @click="page.deleteSelected"
          >
            批量删除（{{ page.selectedRows.value.length }}）
          </el-button>
          <el-button
            :icon="useRenderIcon(Download)"
            :disabled="!page.hasRows.value"
            @click="exportCsv"
          >
            导出本页 CSV
          </el-button>
        </div>
      </template>
      <template #default="{ size, dynamicColumns }">
        <div class="table-content">
          <span v-perms="['tenant:contact_task:delete']" class="cell-sub">
            进行中、已暂停的任务需先停止后删除
          </span>
          <el-table
            ref="tableRef"
            v-loading="page.loading.value"
            :size="size"
            :data="page.rows.value"
            row-key="id"
            border
            stripe
            @selection-change="page.onSelectionChange"
          >
            <template v-for="column in dynamicColumns" :key="column.prop">
              <el-table-column
                v-if="column.prop === 'selection' && !column.hide"
                type="selection"
                width="48"
                fixed="left"
                :selectable="page.selectable"
              />
              <el-table-column
                v-if="column.prop === 'id' && !column.hide"
                prop="id"
                label="ID"
                min-width="100"
              />
              <el-table-column
                v-if="column.prop === 'name' && !column.hide"
                prop="name"
                label="任务名称"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column
                v-if="column.prop === 'content' && !column.hide"
                label="消息类型 / 内容"
                min-width="240"
              >
                <template #default="{ row }">
                  <div class="cell-strong">
                    {{
                      row.messageType === MESSAGE_TYPE_LINK
                        ? "链接消息"
                        : "图文消息"
                    }}
                  </div>
                  <div class="cell-sub">
                    {{ contentPreview(row) }}
                  </div>
                  <div
                    v-if="row.messageType === MESSAGE_TYPE_LINK"
                    class="cell-sub"
                  >
                    {{ row.promotionLink || "-" }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'status' && !column.hide"
                label="状态"
                width="110"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="statusTagType(row.isEnabled, row.runStatus)"
                    effect="plain"
                  >
                    {{ statusLabel(row.isEnabled, row.runStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'progress' && !column.hide"
                label="执行进度"
                min-width="200"
              >
                <template #default="{ row }">
                  <ContactTaskProgress
                    :metrics="row.stats?.metrics"
                    :accounts="row.stats?.accounts"
                    :preparing="
                      (row.stats?.accounts.preparingAccountNum ?? 0) > 0
                    "
                  />
                </template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'receipts' && !column.hide"
                label="消息回执（条）"
                min-width="260"
              >
                <template #default="{ row }"
                  ><ContactTaskReceiptCell
                    :stats="row.stats"
                    @filter="openResults(row, $event)"
                /></template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'accountStats' && !column.hide"
                label="账号统计"
                min-width="200"
              >
                <template #default="{ row }">
                  <div class="cell-sub">
                    选中账号：{{
                      row.stats?.accounts.selectedAccountNum ?? "—"
                    }}
                  </div>
                  <div class="cell-sub">
                    有收件人账号数：{{
                      row.stats?.accounts.readyAccountNum ?? "—"
                    }}
                  </div>
                  <div class="cell-sub">
                    执行异常账号数：{{
                      row.stats?.accounts.failedAccountNum ?? "—"
                    }}
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'accountRange' && !column.hide"
                label="账号范围"
                min-width="230"
              >
                <template #default="{ row }">
                  <div v-if="rangeTags(row).length === 0" class="cell-sub">
                    全部有效账号
                  </div>
                  <div v-else class="range-tags">
                    <el-tag
                      v-for="tag in visibleRangeTags(row)"
                      :key="tag.text"
                      size="small"
                      effect="plain"
                      :type="tag.excluded ? 'danger' : 'info'"
                    >
                      <img
                        v-if="tag.iso2"
                        :src="flagUrl(tag.iso2)"
                        alt=""
                        class="range-flag"
                      />
                      {{ tag.text }}
                    </el-tag>
                    <el-tooltip
                      v-if="hiddenRangeCount(row) > 0"
                      :content="
                        rangeTags(row)
                          .map(t => t.text)
                          .join('、')
                      "
                    >
                      <el-tag size="small" effect="plain">
                        +{{ hiddenRangeCount(row) }}
                      </el-tag>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'taskStartAt' && !column.hide"
                label="计划开始时间"
                width="180"
              >
                <template #default="{ row }">{{
                  formatTime(row.taskStartAt)
                }}</template>
              </el-table-column>
              <el-table-column
                v-if="column.prop === 'actions' && !column.hide"
                label="操作"
                width="220"
                fixed="right"
              >
                <template #default="{ row }">
                  <el-popconfirm
                    v-for="action in rowActions(row.isEnabled, row.runStatus)"
                    :key="action"
                    :disabled="action !== 'stop'"
                    title="停止后任务将被终止，且无法恢复"
                    @confirm="runAction(row, action)"
                  >
                    <template #reference>
                      <el-button
                        link
                        type="primary"
                        size="small"
                        @click="
                          action === 'stop' ? undefined : runAction(row, action)
                        "
                      >
                        {{ ACTION_LABELS[action] }}
                      </el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </template>
          </el-table>

          <WheelPagination
            :total="page.total.value"
            :current-page="page.page.value"
            :page-size="page.pageSize.value"
            :page-sizes="[10, 20, 50, 100, 200]"
            @update:current-page="page.changePage"
            @update:page-size="page.changePageSize"
          />
        </div>
      </template>
    </PureTableBar>

    <ContactTaskDrawer
      v-model="page.drawerVisible.value"
      :mode="page.drawerMode.value"
      :detail="page.drawerDetail.value"
      :matched-account-count="page.matchedAccountCount.value"
      :submitting="page.submitting.value"
      @submit="page.submit"
      @filter-change="page.onFilterChange"
    />

    <ContactTaskAccountDrawer
      v-model="page.accountDrawerVisible.value"
      :task-id="page.accountDrawerTaskId.value"
      :task-name="page.accountDrawerTaskName.value"
      :initial-filter="initialFilter"
      @stats="updateStats"
    />
  </div>
</template>

<style scoped src="./components/ContactTaskPage.css" />
