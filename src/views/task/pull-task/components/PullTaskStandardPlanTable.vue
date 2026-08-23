<script setup lang="ts">
import type {
  PullTaskCreationMode,
  PullTaskStandardDraft
} from "@/api/pull-task";

defineOptions({
  name: "PullTaskStandardPlanTable"
});

defineProps<{
  creationMode: PullTaskCreationMode;
  draft: PullTaskStandardDraft;
}>();

const emit = defineEmits<{
  (event: "remove-row", rowId: number): void;
}>();
</script>

<template>
  <el-card shadow="never" header="进群顺序展示">
    <el-alert
      v-if="draft.rows.length"
      :title="
        creationMode === 'RESOURCE_POOL'
          ? `已生成 ${draft.rows.length} 个 TXT 执行项，提交后按下列序号调度`
          : `已生成 ${draft.rows.length} 个群的执行计划，提交后按下列序号调度`
      "
      type="success"
      :closable="false"
      show-icon
      class="plan-tip"
    />
    <el-empty
      v-else
      :description="
        creationMode === 'NEW_GROUP'
          ? '上传 TXT 后生成待建群执行计划'
          : creationMode === 'RESOURCE_POOL'
            ? '上传 TXT 后生成执行计划，群组在运行时从资源池分配'
            : '粘贴链接并上传 TXT 后生成执行计划'
      "
    />
    <el-table
      v-if="draft.rows.length"
      :data="draft.rows"
      height="630"
      stripe
      border
    >
      <el-table-column prop="seq" label="序号" width="64" fixed />
      <el-table-column
        :label="
          creationMode === 'NEW_GROUP'
            ? '待建群'
            : creationMode === 'RESOURCE_POOL'
              ? '群组资源'
              : '群链接'
        "
        min-width="220"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <span v-if="creationMode === 'NEW_GROUP'">
            {{ row.sourceFileName.replace(/\.txt$/i, "") }}
          </span>
          <span v-else-if="creationMode === 'RESOURCE_POOL'">
            运行时动态分配
          </span>
          <span v-else>https://{{ row.normalizedLink }}</span>
        </template>
      </el-table-column>
      <el-table-column
        v-if="creationMode === 'PASTED_LINK'"
        prop="sourceLinkLineNo"
        label="链接行"
        width="78"
      />
      <el-table-column
        prop="sourceFileName"
        label="进群料子"
        min-width="150"
        show-overflow-tooltip
      />
      <el-table-column prop="validMemberCount" label="有效料子" width="88" />
      <el-table-column label="状态" width="88">
        <template #default>
          <el-tag type="info" effect="plain">待执行</el-tag>
        </template>
      </el-table-column>
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
