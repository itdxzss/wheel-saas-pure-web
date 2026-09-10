<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ScriptQualification } from "@/api/script-marketing";

const props = defineProps<{
  report: ScriptQualification;
  loading?: boolean;
  joinLabel?: string;
}>();
const emit = defineEmits<{ check: []; join: [] }>();
const onlyProblems = ref(!props.report.ready);
const page = ref(1);
const failed = computed(() =>
  props.report.groups.filter(group => !group.ready)
);
const filtered = computed(() =>
  onlyProblems.value ? failed.value : props.report.groups
);
const rows = computed(() =>
  filtered.value.slice((page.value - 1) * 20, page.value * 20)
);
watch(
  () => props.report,
  () => {
    page.value = 1;
    onlyProblems.value = !props.report.ready;
  }
);
watch(onlyProblems, () => {
  page.value = 1;
});
</script>

<template>
  <div v-loading="loading" class="qualification">
    <el-alert
      :type="report.ready ? 'success' : 'warning'"
      :closable="false"
      show-icon
      :title="
        report.ready
          ? `所选 ${report.groups.length} 个群均满足条件，可以启动任务`
          : failed.length
            ? `暂时无法启动任务：${failed.length} 个群需要处理`
            : '暂时无法启动任务：推手分组不满足条件'
      "
    />
    <p>
      已检查 {{ report.groups.length }} 个群，{{
        report.groups.length - failed.length
      }}
      个满足条件。 每群需要 {{ report.requiredPromoters }} 个不同推手；分组共
      {{ report.accountCount }} 个账号。
    </p>
    <el-alert
      v-if="report.poolReason"
      :title="report.poolReason"
      type="warning"
      :closable="false"
    />
    <el-space class="actions" wrap>
      <el-button :loading="loading" @click="emit('check')">重新检查</el-button>
      <el-button @click="emit('join')">{{
        joinLabel || "去进群任务"
      }}</el-button>
      <el-checkbox v-model="onlyProblems">只看不达标群</el-checkbox>
    </el-space>
    <el-table
      :data="rows"
      row-key="groupLinkId"
      border
      empty-text="当前没有不达标群"
    >
      <el-table-column label="群名称" min-width="160"
        ><template #default="{ row }">
          {{ row.groupName || "未命名群" }}<br /><el-text
            size="small"
            type="info"
            >{{ row.groupJid }}</el-text
          >
        </template></el-table-column
      >
      <el-table-column prop="required" label="所需推手" width="90" />
      <el-table-column prop="available" label="已确认可用" width="100" />
      <el-table-column label="缺口" width="90"
        ><template #default="{ row }">
          <el-text :type="row.shortage ? 'danger' : 'success'">{{
            row.shortage ? `缺 ${row.shortage} 个` : "已满足"
          }}</el-text>
        </template></el-table-column
      >
      <el-table-column label="原因与处理建议" min-width="260"
        ><template #default="{ row }">
          <p v-for="reason in row.reasons" :key="reason">{{ reason }}</p>
          <el-text v-if="row.ready" type="success">符合条件</el-text>
        </template></el-table-column
      >
    </el-table>
    <el-pagination
      v-model:current-page="page"
      :page-size="20"
      :total="filtered.length"
      layout="total, prev, pager, next"
    />
    <p>
      <el-text type="info"
        >任务配置和勾选群会保留。完成进群或恢复账号后重新检查；检查通过不会自动启动，启动时还会再次复核。</el-text
      >
    </p>
  </div>
</template>

<style scoped>
.qualification {
  margin: 16px 0;
}

.actions {
  margin: 12px 0;
}

p {
  margin: 6px 0;
}
</style>
