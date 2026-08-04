<script setup lang="ts">
import type { PullTaskStandardDraft } from "@/api/pull-task";

defineOptions({
  name: "PullTaskStandardPlanTable"
});

defineProps<{
  draft: PullTaskStandardDraft;
}>();

const emit = defineEmits<{
  (event: "remove-row", rowId: number): void;
}>();
</script>

<template>
  <el-card shadow="never" header="冻结执行顺序">
    <el-alert
      v-if="draft.rows.length"
      :title="`已冻结 ${draft.rows.length} 个群，提交后按下列序号调度`"
      type="success"
      :closable="false"
      show-icon
      class="plan-tip"
    />
    <el-empty v-else description="粘贴链接并上传 TXT 后生成执行计划" />
    <el-table
      v-if="draft.rows.length"
      :data="draft.rows"
      height="630"
      stripe
      border
    >
      <el-table-column prop="seq" label="序号" width="64" fixed />
      <el-table-column label="群链接" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span>https://{{ row.normalizedLink }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="sourceLinkLineNo" label="链接行" width="78" />
      <el-table-column
        prop="sourceFileName"
        label="配对 TXT"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column prop="validMemberCount" label="有效料子" width="88" />
      <el-table-column label="异常" width="94">
        <template #default="{ row }">
          {{ row.invalidLineCount }}/{{ row.duplicateLineCount }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="76" fixed="right">
        <template #default="{ row }">
          <el-button link type="danger" @click="emit('remove-row', row.rowId)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.plan-tip {
  margin-bottom: 14px;
}
</style>
