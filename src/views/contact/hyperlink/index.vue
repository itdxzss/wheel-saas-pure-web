<script setup lang="ts">
import { computed } from "vue";
import type { ContactTaskListItem } from "@/api/contact-task";
import ContactTaskSearchCard from "./components/ContactTaskSearchCard.vue";
import ContactTaskDrawer from "./components/ContactTaskDrawer.vue";
import ContactTaskAccountDrawer from "./components/ContactTaskAccountDrawer.vue";
import { useContactTaskPage } from "./composables/useContactTaskPage";
import { parseAccountFilter } from "./domain/account-filter";
import { MESSAGE_TYPE_LINK } from "./domain/task-form";
import { rowActions, statusLabel, statusTagType } from "./domain/task-status";

defineOptions({ name: "ContactHyperlinkTask" });

const page = useContactTaskPage();

/** 账号范围列最多平铺 3 个标签，其余折叠成 +N。 */
const RANGE_TAG_LIMIT = 3;

const ACTION_LABELS: Record<string, string> = {
  start: "启动",
  pause: "暂停",
  resume: "恢复",
  stop: "停止",
  edit: "编辑",
  view: "查看",
  data: "账号数据"
};

interface RangeTag {
  text: string;
  excluded: boolean;
  iso2?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  ANDROID_PERSONAL: "Android 个人",
  ANDROID_BUSINESS_PRIMARY: "Android 商业主设备",
  ANDROID_BUSINESS_COMPANION: "Android 商业分身",
  IOS_PERSONAL: "iOS 个人",
  IOS_BUSINESS_PRIMARY: "iOS 商业主设备",
  IOS_BUSINESS_COMPANION: "iOS 商业分身"
};

const CONTINENT_LABELS: Record<string, string> = {
  ASIA: "亚洲",
  AFRICA: "非洲",
  EUROPE: "欧洲",
  NORTH_AMERICA: "北美洲",
  SOUTH_AMERICA: "南美洲",
  OCEANIA: "大洋洲",
  ANTARCTICA: "南极洲"
};

const ROTATION_LABELS: Record<number, string> = {
  0: "未轮换",
  1: "轮换中",
  2: "已完成",
  3: "轮换失败"
};

const SOURCE_LABELS: Record<number, string> = {
  0: "买量",
  1: "自登",
  2: "买入",
  3: "转入",
  4: "群扫码"
};

/** 把落库的筛选 JSON 还原成一串可读标签。 */
function rangeTags(row: ContactTaskListItem): RangeTag[] {
  const filter = parseAccountFilter(row.accountFilter);
  const tags: RangeTag[] = [];
  for (const iso2 of filter.countryIso2s) {
    tags.push({ text: iso2, excluded: false, iso2 });
  }
  for (const iso2 of filter.excludeCountryIso2s) {
    tags.push({ text: `排除 ${iso2}`, excluded: true, iso2 });
  }
  if (filter.groupIds.length > 0) {
    tags.push({ text: `分组 ${filter.groupIds.length} 个`, excluded: false });
  }
  if (filter.channelIds.length > 0) {
    tags.push({
      text: `渠道 ${filter.channelIds.length} 个`,
      excluded: false
    });
  }
  if (filter.protocolId) {
    tags.push({ text: `协议 ${filter.protocolId}`, excluded: false });
  }
  if (filter.accountType != null) {
    tags.push({
      text: filter.accountType === 2 ? "商业号" : "个人号",
      excluded: false
    });
  }
  if (filter.phone) {
    tags.push({ text: `号码 ${filter.phone}`, excluded: false });
  }
  if (filter.registerDaysMin != null) {
    tags.push({ text: `注册≥${filter.registerDaysMin}天`, excluded: false });
  }
  if (filter.registerDaysMax != null) {
    tags.push({ text: `注册≤${filter.registerDaysMax}天`, excluded: false });
  }
  if (filter.contactNamedNumMin != null) {
    tags.push({ text: `好友≥${filter.contactNamedNumMin}`, excluded: false });
  }
  if (filter.contactNamedNumMax != null) {
    tags.push({ text: `好友≤${filter.contactNamedNumMax}`, excluded: false });
  }
  if (filter.onlineStatus) {
    tags.push({
      text: filter.onlineStatus === "ONLINE" ? "在线" : "离线",
      excluded: false
    });
  }
  if (filter.platform) {
    tags.push({ text: PLATFORM_LABELS[filter.platform], excluded: false });
  }
  if (filter.continent) {
    tags.push({ text: CONTINENT_LABELS[filter.continent], excluded: false });
  }
  if (filter.groupInviteAllowed != null) {
    tags.push({
      text: filter.groupInviteAllowed ? "允许拉群" : "禁止拉群",
      excluded: false
    });
  }
  if (filter.retentionDaysMin != null) {
    tags.push({ text: `存活≥${filter.retentionDaysMin}天`, excluded: false });
  }
  if (filter.retentionDaysMax != null) {
    tags.push({ text: `存活≤${filter.retentionDaysMax}天`, excluded: false });
  }
  if (filter.rotationStatus != null) {
    tags.push({
      text: ROTATION_LABELS[filter.rotationStatus],
      excluded: false
    });
  }
  if (filter.importMode) {
    tags.push({
      text: filter.importMode === "six_segment" ? "六段" : "全参",
      excluded: false
    });
  }
  if (filter.widType) {
    tags.push({
      text: filter.widType === "web5" ? "分身设备" : "主设备",
      excluded: false
    });
  }
  if (filter.source != null) {
    tags.push({ text: SOURCE_LABELS[filter.source], excluded: false });
  }
  if (filter.importBatchId != null) {
    tags.push({ text: `批次 ${filter.importBatchId}`, excluded: false });
  }
  if (filter.createdAtFrom != null || filter.createdAtTo != null) {
    tags.push({ text: "限定创建时间", excluded: false });
  }
  return tags;
}

function visibleRangeTags(row: ContactTaskListItem): RangeTag[] {
  return rangeTags(row).slice(0, RANGE_TAG_LIMIT);
}

function hiddenRangeCount(row: ContactTaskListItem): number {
  return Math.max(0, rangeTags(row).length - RANGE_TAG_LIMIT);
}

function flagUrl(iso2: string): string {
  return `https://flagcdn.com/w20/${iso2.toLowerCase()}.png`;
}

/** 成功率：成功条数 / 计划条数。计划为 0 时按 0 显示，避免除零。 */
function successPercent(row: ContactTaskListItem): number {
  const total = row.totalSendNum ?? 0;
  const success = row.successMessageNum ?? 0;
  if (total <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((success / total) * 100));
}

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
    成功条数: row.successMessageNum ?? 0,
    计划条数: row.totalSendNum ?? 0,
    使用号数: row.usedAccountCount ?? 0,
    封号数: row.invalidAccountNum ?? 0,
    号均发量: row.avgSendPerAccount ?? 0,
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
    page.openAccountData(row);
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
        每个账号会向自己<b>通讯录里有名字的联系人</b>发送同一条消息。通讯录由协议层定期推送全量快照，
        任务启用时固化收件人名单，之后按轮次逐条发送。
      </p>
    </el-card>

    <ContactTaskSearchCard
      v-model:name="page.searchName.value"
      v-model:run-status="page.searchRunStatus.value"
      v-model:created-range="page.searchCreatedRange.value"
      @search="page.search"
      @reset="page.resetSearch"
    />

    <el-card shadow="never">
      <div class="table-toolbar">
        <el-button type="primary" @click="page.openCreate">新建任务</el-button>
        <el-button :disabled="!page.hasRows.value" @click="exportCsv">
          导出本页 CSV
        </el-button>
      </div>

      <el-table
        v-loading="page.loading.value"
        :data="page.rows.value"
        border
        stripe
      >
        <el-table-column label="消息类型 / 内容" min-width="240">
          <template #default="{ row }">
            <div class="cell-strong">
              {{
                row.messageType === MESSAGE_TYPE_LINK ? "链接消息" : "图文消息"
              }}
            </div>
            <div class="cell-sub">
              {{ contentPreview(row) }}
            </div>
            <div v-if="row.messageType === MESSAGE_TYPE_LINK" class="cell-sub">
              {{ row.promotionLink || "-" }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag
              :type="statusTagType(row.isEnabled, row.runStatus)"
              effect="plain"
            >
              {{ statusLabel(row.isEnabled, row.runStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="进度（成功 / 计划）" min-width="200">
          <template #default="{ row }">
            <div class="cell-sub">
              {{ row.successMessageNum ?? 0 }} / {{ row.totalSendNum ?? 0 }}
            </div>
            <el-progress
              :percentage="successPercent(row)"
              :stroke-width="10"
              striped
            />
          </template>
        </el-table-column>

        <el-table-column label="账号统计" min-width="200">
          <template #default="{ row }">
            <div class="cell-sub">
              使用号数：{{ row.usedAccountCount ?? 0 }}
            </div>
            <div class="cell-sub">封号数：{{ row.invalidAccountNum ?? 0 }}</div>
            <div class="cell-sub">
              号均发量：{{ row.avgSendPerAccount ?? 0 }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账号范围" min-width="230">
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

        <el-table-column label="计划开始时间" width="180">
          <template #default="{ row }">{{
            formatTime(row.taskStartAt)
          }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" fixed="right">
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
      </el-table>

      <el-pagination
        class="table-pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="page.total.value"
        :current-page="page.page.value"
        :page-size="page.pageSize.value"
        :page-sizes="[10, 20, 50, 100, 200]"
        @current-change="page.changePage"
        @size-change="page.changePageSize"
      />
    </el-card>

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
    />
  </div>
</template>

<style scoped>
.contact-task-page {
  padding: 16px;
}

.intro-card {
  margin-bottom: 12px;
}

.intro-title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 20px;
  font-weight: 700;
}

.intro-card p {
  margin: 8px 0 0;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}

.table-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.cell-strong {
  font-weight: 600;
}

.cell-sub {
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.range-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
}

.range-flag {
  width: 14px;
  height: 14px;
  margin-right: 4px;
  vertical-align: -2px;
  object-fit: cover;
  border-radius: 50%;
}

.table-pagination {
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
