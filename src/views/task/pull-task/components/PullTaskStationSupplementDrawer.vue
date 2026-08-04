<script setup lang="ts">
import type { AccountGroupApiRow } from "@/api/account-group";
import type {
  PullTaskStationCandidate,
  PullTaskStationSupplementOptions
} from "@/api/pull-task";
import type { PullTaskStationSupplementForm } from "../composables/usePullTaskStationSupplement";

defineOptions({ name: "PullTaskStationSupplementDrawer" });

defineProps<{
  accountGroups: AccountGroupApiRow[];
  loading: boolean;
  saving: boolean;
  options: PullTaskStationSupplementOptions | null;
}>();

const emit = defineEmits<{
  (event: "account-group-change", accountGroupId: number): void;
  (event: "selection-mode-change", selectionMode: 1 | 2): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<PullTaskStationSupplementForm>("form", {
  required: true
});

function candidateLabel(candidate: PullTaskStationCandidate): string {
  return `${candidate.accountPhone}（账号 ${candidate.accountId}）`;
}

function handleSelectionModeChange(value: string | number | boolean): void {
  emit("selection-mode-change", Number(value) === 2 ? 2 : 1);
}
</script>

<template>
  <el-drawer
    v-model="visible"
    append-to-body
    destroy-on-close
    size="640px"
    title="补充站台"
  >
    <div v-loading="loading" class="station-supplement">
      <div v-if="options" class="count-grid">
        <el-statistic
          title="每次计划站台"
          :value="options.requiredStationCount"
        />
        <el-statistic title="当前缺口" :value="options.missingStationCount" />
      </div>

      <el-alert
        v-if="options && options.missingStationCount === 0"
        title="当前站台资源已经补足，请刷新群详情"
        type="success"
        :closable="false"
        show-icon
      />

      <el-form
        v-if="options"
        :model="form"
        class="selection-form"
        label-width="130px"
      >
        <el-form-item label="站台账号分组" required>
          <el-select
            v-model="form.accountGroupId"
            class="form-control"
            filterable
            @change="emit('account-group-change', $event)"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="补充数量" required>
          <el-input-number
            v-model="form.supplementCount"
            :min="1"
            :max="Math.max(options.missingStationCount, 1)"
          />
        </el-form-item>
        <el-form-item label="选择方式" required>
          <el-radio-group
            v-model="form.selectionMode"
            @change="handleSelectionModeChange"
          >
            <el-radio :value="1">自动选择</el-radio>
            <el-radio :value="2">手动选择</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <section v-if="options" class="selection-section">
        <h4>候选站台账号</h4>
        <el-checkbox-group
          v-if="form.selectionMode === 2"
          v-model="form.accountIds"
          class="candidate-grid"
        >
          <el-checkbox
            v-for="candidate in options.candidates"
            :key="candidate.accountId"
            :value="candidate.accountId"
          >
            {{ candidateLabel(candidate) }}
          </el-checkbox>
        </el-checkbox-group>
        <el-table v-else :data="options.candidates" size="small" border>
          <el-table-column prop="accountPhone" label="账号" />
          <el-table-column prop="accountId" label="账号 ID" width="140" />
        </el-table>
        <el-empty
          v-if="options.candidates.length === 0"
          description="当前分组没有额外可锁定的在线正常账号"
          :image-size="56"
        />
      </section>

      <el-alert
        v-if="options"
        class="execution-tip"
        title="确认后只锁定候选；仍由轮到的拉手先尝试双向好友，再随本次料子一起拉入群。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        :disabled="!options || options.missingStationCount === 0"
        @click="emit('submit')"
      >
        确认锁定
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.station-supplement {
  min-height: 220px;
}

.count-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.selection-section,
.selection-form,
.execution-tip {
  margin-top: 20px;
}

.selection-section h4 {
  margin: 0 0 10px;
}

.form-control {
  width: 100%;
}

.candidate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
}
</style>
