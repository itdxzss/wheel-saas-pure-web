<script setup lang="ts">
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  actOnScriptTask,
  getScriptTask,
  listScriptTasks,
  type ScriptAction,
  type ScriptDetail,
  type ScriptTask
} from "@/api/script-marketing";
import { apiErrorMessage } from "@/utils/api-error";
import { taskLabels } from "./form";
import ScriptCreateDrawer from "./components/ScriptCreateDrawer.vue";
import ScriptDetailDrawer from "./components/ScriptDetailDrawer.vue";

defineOptions({ name: "TaskScriptMarketing" });
const filters = reactive({
  keyword: "",
  status: undefined as number | undefined
});
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const rows = ref<ScriptTask[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const operating = ref<number>();
const createOpen = ref(false);
const editTask = ref<ScriptDetail>();
const detailOpen = ref(false);
const detail = ref<ScriptDetail>();
const detailLoading = ref(false);
let requestId = 0;
let detailRequestId = 0;
async function load() {
  const request = ++requestId;
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await listScriptTasks({
      ...filters,
      page: page.value,
      pageSize: pageSize.value
    });
    if (request !== requestId) return;
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    if (request === requestId)
      errorMessage.value = apiErrorMessage(error, "任务读取失败");
  } finally {
    if (request === requestId) loading.value = false;
  }
}
function search() {
  page.value = 1;
  void load();
}
function create() {
  editTask.value = undefined;
  createOpen.value = true;
}
async function edit(id: number) {
  try {
    editTask.value = await getScriptTask(id);
    createOpen.value = true;
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "配置读取失败"));
  }
}
async function showDetail(id: number) {
  const request = ++detailRequestId;
  detail.value = undefined;
  detailLoading.value = true;
  detailOpen.value = true;
  try {
    const result = await getScriptTask(id);
    if (request !== detailRequestId || !detailOpen.value) return;
    detail.value = result;
  } catch (error) {
    if (request === detailRequestId)
      ElMessage.error(apiErrorMessage(error, "详情读取失败"));
  } finally {
    if (request === detailRequestId) detailLoading.value = false;
  }
}
watch(detailOpen, open => {
  if (open) return;
  detailRequestId++;
  detail.value = undefined;
  detailLoading.value = false;
});
async function act(row: ScriptTask, action: ScriptAction) {
  if (action === "close") {
    try {
      await ElMessageBox.confirm(
        "关闭后不能恢复此任务，确认关闭？",
        "关闭任务",
        { type: "warning" }
      );
    } catch {
      return;
    }
  }
  operating.value = row.id;
  try {
    await actOnScriptTask(row.id, action);
    ElMessage.success("操作已保存");
    await load();
    if (detailOpen.value && detail.value?.task.id === row.id)
      await showDetail(row.id);
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, "任务操作失败"));
  } finally {
    operating.value = undefined;
  }
}
onMounted(load);
</script>

<template>
  <div class="script-marketing-page" aria-label="剧本营销任务">
    <div class="page-search bg-bg_color">
      <el-form :model="filters" inline @submit.prevent="search">
        <el-form-item label="任务名称"
          ><el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索任务名称"
        /></el-form-item>
        <el-form-item label="状态"
          ><el-select
            v-model="filters.status"
            clearable
            placeholder="全部状态"
            style="width: 180px"
          >
            <el-option
              v-for="status in [0, 1, 2, 3, 4]"
              :key="status"
              :value="status"
              :label="taskLabels[status]"
            /> </el-select
        ></el-form-item>
        <el-form-item
          ><el-button type="primary" native-type="submit">查询</el-button
          ><el-button
            @click="
              filters.keyword = '';
              filters.status = undefined;
              search();
            "
            >重置</el-button
          ></el-form-item
        >
      </el-form>
    </div>
    <div class="task-panel bg-bg_color">
      <div class="task-toolbar">
        <div>
          <h2>剧本营销任务</h2>
          <el-text type="info"
            >管理员与推手按配置顺序发送，每个群独立推进</el-text
          >
        </div>
        <el-space
          ><el-button :loading="loading" @click="load">刷新</el-button
          ><el-button
            v-auth="'tenant:script_marketing:create'"
            type="primary"
            @click="create"
            >新建剧本任务</el-button
          ></el-space
        >
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        :closable="false"
        show-icon
      />
      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        border
        empty-text="暂无剧本任务，点击右上角创建"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column
          prop="taskName"
          label="任务名称"
          min-width="190"
          show-overflow-tooltip
        />
        <el-table-column label="状态" min-width="160"
          ><template #default="{ row }">
            <el-tag
              :type="
                row.status === 3
                  ? 'success'
                  : row.status === 2
                    ? 'warning'
                    : 'info'
              "
              >{{
                row.status === 2 && row.inFlightCount
                  ? "正在暂停 · 有在途消息"
                  : taskLabels[row.status]
              }}</el-tag
            >
          </template></el-table-column
        >
        <el-table-column prop="groupCount" label="目标群" width="85" />
        <el-table-column
          prop="successCount"
          label="成功"
          width="75"
        /><el-table-column
          prop="failedCount"
          label="失败"
          width="75"
        /><el-table-column prop="unknownCount" label="未知" width="75" />
        <el-table-column label="操作" fixed="right" min-width="290"
          ><template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row.id)"
              >详情</el-button
            >
            <el-button
              v-if="row.status === 0"
              v-auth="'tenant:script_marketing:edit'"
              link
              @click="edit(row.id)"
              >编辑</el-button
            >
            <span v-auth="'tenant:script_marketing:operate'">
              <el-button
                v-if="row.status === 0"
                link
                type="primary"
                :disabled="operating !== undefined"
                @click="act(row, 'start')"
                >启动</el-button
              >
              <el-button
                v-if="row.status === 1"
                link
                type="warning"
                :disabled="operating !== undefined"
                @click="act(row, 'pause')"
                >暂停 / 接管</el-button
              >
              <el-button
                v-if="row.status === 2"
                link
                type="primary"
                :disabled="operating !== undefined"
                @click="act(row, 'resume')"
                >继续</el-button
              >
              <el-button
                v-if="[0, 1, 2].includes(row.status)"
                link
                type="danger"
                :disabled="operating !== undefined"
                @click="act(row, 'close')"
                >关闭</el-button
              >
            </span>
          </template></el-table-column
        >
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        class="pagination"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="load"
        @size-change="search"
      />
    </div>
    <ScriptCreateDrawer v-model="createOpen" :task="editTask" @saved="search" />
    <ScriptDetailDrawer
      v-model="detailOpen"
      :detail="detail"
      :loading="detailLoading"
      @refresh="detail && showDetail(detail.task.id)"
    />
  </div>
</template>

<style scoped>
.page-search {
  padding: 20px 20px 0;
  border-radius: 8px;
}
.task-panel {
  padding: 20px;
  margin-top: 16px;
  border-radius: 8px;
}
.task-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
h2 {
  margin-bottom: 4px;
  font-size: 18px;
  font-weight: 600;
}
.pagination {
  justify-content: flex-end;
  margin-top: 18px;
}
</style>
