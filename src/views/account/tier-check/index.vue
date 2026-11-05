<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { PureTableBar } from "@/components/RePureTableBar";
import WheelPagination from "@/components/WheelPagination/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  recheckTierCheck,
  stopTierCheck,
  type TierCheckTask
} from "@/api/account-tier-check";
import { hasPerms } from "@/utils/auth";
import { apiErrorMessage } from "@/utils/api-error";
import { formatEpochMillis } from "@/utils/time";
import Search from "~icons/ri/search-line";
import RefreshRight from "~icons/ep/refresh-right";
import { useTierCheckList } from "./composables/useTierCheckList";
import TierCheckCreateDrawer from "./components/TierCheckCreateDrawer.vue";
import TierCheckDetailDrawer from "./components/TierCheckDetailDrawer.vue";
import {
  checkModeText,
  taskStatusTagType,
  taskStatusText,
  tierLabel,
  tierEntries,
  tierTagType
} from "./tier-check-display";

defineOptions({
  name: "AccountTierCheck"
});

/** 页面路由只带查看权限，写操作按登录用户权限判断，与后端 @PreAuthorize 一致。 */
const canEdit = computed(() => hasPerms("tenant:account:edit"));

const {
  searchForm,
  rows,
  loading,
  page,
  pageSize,
  total,
  refreshTasks,
  searchTasks,
  resetSearchForm
} = useTierCheckList(message => ElMessage.error(message));
const createOpen = ref(false);
const detailOpen = ref(false);
const detailTaskId = ref<number | null>(null);
const acting = ref(new Set<number>());

const columns: TableColumnList = [
  { label: "批次ID", prop: "id", width: 80 },
  { label: "批次名称", prop: "name", minWidth: 170 },
  { label: "查询方式", prop: "mode", width: 120 },
  { label: "号数", prop: "totalCount", width: 70 },
  { label: "档位分布", prop: "tierCounts", minWidth: 220 },
  { label: "状态", prop: "status", width: 100 },
  { label: "创建时间", prop: "createdAt", width: 170 }
];

function openDetail(row: TierCheckTask): void {
  detailTaskId.value = row.id;
  detailOpen.value = true;
}

async function recheck(row: TierCheckTask): Promise<void> {
  if (!canEdit.value || acting.value.has(row.id)) return;
  acting.value.add(row.id);
  try {
    await ElMessageBox.confirm(
      `将对批次 #${row.id} 的 ${row.totalCount} 个账号再查一次档位，并与上次结果对比。`,
      "复查此批",
      { confirmButtonText: "开始复查", cancelButtonText: "取消" }
    );
  } catch {
    acting.value.delete(row.id);
    return;
  }
  try {
    await recheckTierCheck(row.id);
    ElMessage.success("已创建复查批次");
    await refreshTasks();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "创建复查批次失败"));
  } finally {
    acting.value.delete(row.id);
  }
}

async function stop(row: TierCheckTask): Promise<void> {
  if (!canEdit.value || acting.value.has(row.id)) return;
  acting.value.add(row.id);
  try {
    await stopTierCheck(row.id);
    ElMessage.success("已停止");
    await refreshTasks();
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "停止失败"));
  } finally {
    acting.value.delete(row.id);
  }
}

onMounted(refreshTasks);
</script>

<template>
  <div class="tier-check-page">
    <div class="tier-check-search bg-bg_color">
      <el-form :model="searchForm" inline>
        <el-form-item label="批次名称">
          <el-input
            v-model="searchForm.keyword"
            clearable
            placeholder="请输入批次名称"
            @keyup.enter="searchTasks"
          />
        </el-form-item>
        <el-form-item label="查询方式">
          <el-select
            v-model="searchForm.mode"
            clearable
            placeholder="全部"
            style="width: 160px"
          >
            <el-option
              v-for="(label, value) in checkModeText"
              :key="value"
              :value="Number(value)"
              :label="label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            clearable
            placeholder="全部"
            style="width: 140px"
          >
            <el-option
              v-for="(label, value) in taskStatusText"
              :key="value"
              :value="Number(value)"
              :label="label"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="useRenderIcon(Search)"
            @click="searchTasks"
          >
            搜索
          </el-button>
          <el-button
            :icon="useRenderIcon(RefreshRight)"
            @click="resetSearchForm"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <PureTableBar title="档位检测" :columns="columns" @refresh="refreshTasks">
      <template #buttons>
        <el-button v-if="canEdit" type="primary" @click="createOpen = true"
          >新建检测</el-button
        >
      </template>

      <template #default="{ dynamicColumns }">
        <el-table v-loading="loading" :data="rows" row-key="id" border>
          <el-table-column
            v-if="!dynamicColumns[0].hide"
            prop="id"
            label="批次ID"
            width="80"
          />
          <el-table-column
            v-if="!dynamicColumns[1].hide"
            label="批次名称"
            min-width="170"
          >
            <template #default="{ row }">
              <span>{{ row.name }}</span>
              <el-tag
                v-if="row.sourceTaskId"
                class="ml-2"
                size="small"
                type="info"
              >
                复查自 #{{ row.sourceTaskId }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[2].hide"
            label="查询方式"
            width="120"
          >
            <template #default="{ row }">{{
              checkModeText[row.mode]
            }}</template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[3].hide"
            prop="totalCount"
            label="号数"
            width="70"
          />
          <el-table-column
            v-if="!dynamicColumns[4].hide"
            label="档位分布"
            min-width="220"
          >
            <template #default="{ row }">
              <el-tag
                v-for="entry in tierEntries((row as TierCheckTask).tierCounts)"
                :key="entry.tier"
                class="mr-1"
                size="small"
                :type="tierTagType[entry.tier]"
              >
                {{ tierLabel(entry.tier) }} {{ entry.count }}
              </el-tag>
              <span
                v-if="!tierEntries((row as TierCheckTask).tierCounts).length"
                >-</span
              >
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[5].hide"
            label="状态"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="taskStatusTagType[row.status]">{{
                taskStatusText[row.status]
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column
            v-if="!dynamicColumns[6].hide"
            label="创建时间"
            width="170"
          >
            <template #default="{ row }">{{
              formatEpochMillis(row.createdAt)
            }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                @click="openDetail(row as TierCheckTask)"
              >
                详情
              </el-button>
              <el-button
                v-if="canEdit"
                link
                type="primary"
                :disabled="row.status === 1 || acting.has(row.id)"
                @click="recheck(row as TierCheckTask)"
              >
                复查
              </el-button>
              <el-button
                v-if="canEdit && row.status === 1"
                link
                type="primary"
                :disabled="acting.has(row.id)"
                @click="stop(row as TierCheckTask)"
              >
                停止
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无档位检测批次" />
          </template>
        </el-table>

        <WheelPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          @change="refreshTasks"
        />
      </template>
    </PureTableBar>

    <TierCheckCreateDrawer v-model="createOpen" @created="refreshTasks" />
    <TierCheckDetailDrawer
      v-model="detailOpen"
      :task-id="detailTaskId"
      @changed="refreshTasks"
    />
  </div>
</template>

<style scoped>
.tier-check-page {
  padding: 16px;
}

.tier-check-search {
  padding: 16px 16px 0;
}

.tier-check-search :deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
