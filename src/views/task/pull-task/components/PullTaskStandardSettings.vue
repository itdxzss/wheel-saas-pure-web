<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type { StandardPullTaskCreateForm } from "../composables/useStandardPullTaskCreate";

defineOptions({
  name: "PullTaskStandardSettings"
});

defineProps<{
  accountGroups: AccountGroupApiRow[];
}>();

const form = defineModel<StandardPullTaskCreateForm>("form", {
  required: true
});
</script>

<template>
  <el-card shadow="never" header="任务与执行配置">
    <el-form :model="form" label-position="top" class="settings-form">
      <el-form-item label="任务名称" required>
        <el-input
          v-model="form.taskName"
          maxlength="128"
          show-word-limit
          placeholder="请输入任务名称"
        />
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="8">
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
        </el-col>
        <el-col :span="8">
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
        </el-col>
        <el-col :span="8">
          <el-form-item label="站台分组" required>
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
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="每群拉手数">
            <el-input-number
              v-model="form.pullerCountPerGroup"
              :min="1"
              :max="50"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="每次调用站台数">
            <el-input-number
              v-model="form.stationCountPerCall"
              :min="0"
              :max="50"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="并发执行群数">
            <el-input-number
              v-model="form.concurrentGroupCount"
              :min="1"
              :max="100"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="单次拉人数下限">
            <el-input-number
              v-model="form.pullCountMin"
              :min="1"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="单次拉人数上限">
            <el-input-number
              v-model="form.pullCountMax"
              :min="form.pullCountMin"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="拉人间隔（秒）">
            <el-input-number
              v-model="form.pullIntervalSeconds"
              :min="0"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="料子管理员设置时点">
            <el-radio-group v-model="form.materialAdminTiming">
              <el-radio :value="1">入群后立即</el-radio>
              <el-radio :value="2">本群料子全部终态后</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="拉手风控冷却（分钟）">
            <el-input-number
              v-model="form.pullerRiskMinutes"
              :min="0"
              controls-position="right"
              class="full-width"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="创建后启动">
            <el-switch
              v-model="form.autoStart"
              active-text="自动启动"
              inactive-text="待启动"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          maxlength="512"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.settings-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.full-width {
  width: 100%;
}
</style>
