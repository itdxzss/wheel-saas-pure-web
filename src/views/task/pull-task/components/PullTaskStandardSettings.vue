<script setup lang="ts">
import { computed } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { GroupFolderRow } from "@/api/group-folder";
import type { StandardPullTaskCreateForm } from "../composables/useStandardPullTaskCreate";
import PullTaskStandardGroupSettings from "./PullTaskStandardGroupSettings.vue";

defineOptions({
  name: "PullTaskStandardSettings"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  groupFolders: GroupFolderRow[];
  groupAvatarFile: File | null;
}>();

const emit = defineEmits<{
  (event: "avatar-change", file: File): void;
  (event: "avatar-clear"): void;
}>();

const form = defineModel<StandardPullTaskCreateForm>("form", {
  required: true
});

function nonNegativeCount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

const stationDemand = computed(() => {
  const pullStationCount = nonNegativeCount(form.value.stationCountPerCall);
  const initialStationCount =
    form.value.creationMode === "NEW_GROUP"
      ? nonNegativeCount(form.value.initialStationCount)
      : 0;
  return Math.max(pullStationCount, initialStationCount);
});
const selectedStationGroup = computed(() =>
  props.accountGroups.find(group => group.id === form.value.stationGroupId)
);
const stationCapacity = computed(
  () =>
    selectedStationGroup.value?.executableOnlineAccounts ??
    selectedStationGroup.value?.onlineAccounts ??
    0
);
const stationCapacityTitle = computed(() => {
  if (stationDemand.value === 0) {
    return "站台容量：当前配置不需要站台账号";
  }
  if (!selectedStationGroup.value) {
    return `当前配置至少需要 ${stationDemand.value} 个在线正常站台，请选择站台分组`;
  }
  return `站台容量：至少需要 ${stationDemand.value} 个，当前可执行在线账号 ${stationCapacity.value} 个`;
});
const stationCapacityType = computed<"success" | "warning" | "info">(() => {
  if (stationDemand.value === 0) return "info";
  return selectedStationGroup.value &&
    stationCapacity.value >= stationDemand.value
    ? "success"
    : "warning";
});
</script>

<template>
  <div class="settings-sections">
    <el-card shadow="never" header="基本设置">
      <el-form :model="form" label-position="top" class="settings-form">
        <section class="setting-block mode-block">
          <h3>模式选择</h3>
          <el-form-item label="版本选择">
            <el-select
              model-value="NORMAL_LINK"
              disabled
              class="version-select"
            >
              <el-option label="普通群链接版本" value="NORMAL_LINK" />
            </el-select>
          </el-form-item>
        </section>

        <section
          v-if="form.creationMode === 'PASTED_LINK'"
          class="setting-block link-source-block"
        >
          <h3>群链接配置</h3>
          <el-form-item label="群组分组">
            <el-select
              v-model="form.groupFolderId"
              clearable
              filterable
              class="full-width"
              placeholder="请选择分组"
            >
              <el-option
                v-for="folder in groupFolders"
                :key="folder.id"
                :label="`${folder.name}（${folder.groupCount} 个群）`"
                :value="folder.id"
              />
            </el-select>
          </el-form-item>
        </section>

        <section
          v-else
          class="setting-block new-group-block"
          data-testid="pull-task-new-group-settings"
        >
          <h3>建群配置</h3>
          <div class="setting-grid new-group-grid">
            <el-form-item label="建群人分组" required>
              <el-select
                v-model="form.creatorGroupId"
                clearable
                filterable
                class="full-width"
                placeholder="请选择建群人分组"
                data-testid="pull-task-creator-group"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="`${group.name}（可执行在线 ${group.executableOnlineAccounts ?? group.onlineAccounts}）`"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="建群时初始站台数">
              <el-input-number
                v-model="form.initialStationCount"
                :min="0"
                :precision="0"
                :step="1"
                controls-position="right"
                class="full-width"
                data-testid="pull-task-initial-station-count"
              />
            </el-form-item>
          </div>
        </section>

        <section class="setting-block task-base-block">
          <h3>任务基础</h3>
          <div class="setting-grid task-grid">
            <el-form-item label="任务名称" required>
              <el-input
                v-model="form.taskName"
                maxlength="128"
                show-word-limit
                placeholder="请输入任务名称"
              />
            </el-form-item>
            <el-form-item label="自动启动">
              <el-switch
                v-model="form.autoStart"
                active-text="自动启动"
                inactive-text="待启动"
              />
            </el-form-item>
          </div>
        </section>

        <section class="setting-block strategy-block">
          <h3>执行策略</h3>
          <div class="setting-grid strategy-grid">
            <el-form-item label="拉手同步料子方式">
              <el-radio-group v-model="form.pullerSyncMode">
                <el-radio-button value="SINGLE">单个</el-radio-button>
                <el-radio-button value="BATCH">批量</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="设置料子内容管理">
              <el-radio-group v-model="form.materialAdminTiming">
                <el-radio-button :value="2">任务完成后设置</el-radio-button>
                <el-radio-button :value="1">任务开始后设置</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="是否清空群原成员">
              <el-switch v-model="form.clearExistingMembers" />
            </el-form-item>
            <el-form-item label="拉手踩链接进群">
              <el-switch v-model="form.pullerJoinByLink" />
            </el-form-item>
            <el-form-item label="拉人完成后群主退群">
              <el-switch v-model="form.creatorLeaveAfterPull" />
            </el-form-item>
          </div>
        </section>

        <section class="setting-block pull-params-block">
          <h3>拉人参数</h3>
          <div class="setting-grid params-grid">
            <el-form-item label="单次拉人数范围" required>
              <div class="range-inputs">
                <el-input-number
                  v-model="form.pullCountMin"
                  :min="1"
                  controls-position="right"
                />
                <span>~</span>
                <el-input-number
                  v-model="form.pullCountMax"
                  :min="form.pullCountMin"
                  controls-position="right"
                />
              </div>
            </el-form-item>
            <el-form-item label="站台数量/次">
              <el-input-number
                v-model="form.stationCountPerCall"
                :min="0"
                :max="50"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="拉人间隔" required>
              <el-input-number
                v-model="form.pullIntervalSeconds"
                :min="0"
                controls-position="right"
                class="full-width"
              />
              <span class="field-unit">秒</span>
            </el-form-item>
            <el-form-item label="拉手数量" required>
              <el-input-number
                v-model="form.pullerCountPerGroup"
                :min="1"
                :max="50"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="同时启动任务数">
              <el-input-number
                v-model="form.concurrentGroupCount"
                :min="1"
                :max="100"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="前期单次拉人数" required>
              <el-input-number
                v-model="form.earlyPullCount"
                :min="1"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
            <el-form-item label="前期拉人执行次数" required>
              <el-input-number
                v-model="form.earlyPullCallCount"
                :min="1"
                controls-position="right"
                class="full-width"
              />
              <span class="field-unit">次</span>
            </el-form-item>
          </div>
        </section>

        <section class="setting-block account-block">
          <h3>账号分组</h3>
          <div class="setting-grid account-grid">
            <el-form-item label="管理分组" required>
              <el-select
                v-model="form.managerGroupId"
                clearable
                filterable
                class="full-width"
                placeholder="每群默认 1 个管理员"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="拉手分组" required>
              <el-select
                v-model="form.pullerGroupId"
                clearable
                filterable
                class="full-width"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="站台分组">
              <el-select
                v-model="form.stationGroupId"
                clearable
                filterable
                class="full-width"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-alert
            v-if="form.creationMode === 'NEW_GROUP'"
            :title="stationCapacityTitle"
            description="建群时占用的站台会减少后续拉人调用的可选站台；分组偏小时，执行行会卡在“等待站台”。需求按初始站台数和每次拉人站台数的较大值计算，不相加。"
            :type="stationCapacityType"
            :closable="false"
            show-icon
            class="station-capacity"
            data-testid="pull-task-station-capacity"
          />

          <h4>完成归档</h4>
          <div class="setting-grid archive-grid">
            <el-form-item label="任务完成的管理移至分组">
              <el-select
                v-model="form.managerFinishGroupId"
                clearable
                filterable
                class="full-width"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="任务完成的拉手移至分组">
              <el-select
                v-model="form.pullerFinishGroupId"
                clearable
                filterable
                class="full-width"
              >
                <el-option
                  v-for="group in accountGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
          </div>
        </section>

        <section class="setting-block note-block">
          <h3>任务备注</h3>
          <el-form-item label="此项非必填，仅用于任务列表中的测试记录">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              maxlength="512"
              show-word-limit
              placeholder="请输入任务备注"
            />
          </el-form-item>
        </section>
      </el-form>
    </el-card>

    <PullTaskStandardGroupSettings
      v-model:form="form"
      :group-avatar-file="groupAvatarFile"
      @avatar-change="emit('avatar-change', $event)"
      @avatar-clear="emit('avatar-clear')"
    />
  </div>
</template>

<style scoped>
.settings-sections {
  display: grid;
  gap: 16px;
}

.settings-form {
  display: grid;
  grid-template-columns: minmax(220px, 0.6fr) minmax(420px, 1.4fr);
  gap: 12px;
}

.setting-block {
  min-width: 0;
  padding: 12px 14px 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.setting-block h3 {
  padding-bottom: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.task-base-block,
.strategy-block,
.pull-params-block,
.account-block,
.note-block {
  grid-column: 1 / -1;
}

.setting-grid {
  display: grid;
  gap: 0 12px;
}

.task-grid {
  grid-template-columns: minmax(280px, 1fr) 180px;
}

.new-group-grid {
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 0.7fr);
}

.strategy-grid {
  grid-template-columns: repeat(4, minmax(180px, 1fr));
}

.params-grid {
  grid-template-columns: repeat(4, minmax(160px, 1fr));
}

.account-grid {
  grid-template-columns: repeat(3, minmax(220px, 1fr));
}

.archive-grid {
  grid-template-columns: repeat(2, minmax(260px, 1fr));
}

.account-block h4 {
  padding-top: 12px;
  margin: 0 0 12px;
  font-size: 13px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.station-capacity {
  margin-bottom: 14px;
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.version-select {
  width: 260px;
  max-width: 100%;
}

.range-inputs {
  display: flex;
  gap: 8px;
  align-items: center;
}

.range-inputs :deep(.el-input-number) {
  width: 130px;
}

.full-width {
  width: 100%;
}

.field-unit {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1200px) {
  .settings-form,
  .strategy-grid,
  .params-grid,
  .new-group-grid,
  .account-grid,
  .archive-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }

  .task-base-block,
  .strategy-block,
  .pull-params-block,
  .account-block,
  .note-block {
    grid-column: 1 / -1;
  }
}
</style>
