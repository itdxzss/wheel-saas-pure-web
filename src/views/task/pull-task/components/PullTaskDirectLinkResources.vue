<script setup lang="ts">
import type { UploadFile } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import type { ImmediatePullTaskCreateState } from "../composables/useImmediatePullTaskCreate";
import PullTaskDataPackagePicker from "./PullTaskDataPackagePicker.vue";

defineOptions({ name: "PullTaskDirectLinkResources" });
const props = defineProps<{
  state: ImmediatePullTaskCreateState;
  simpleNewGroup?: boolean;
}>();
function addFile(file: UploadFile): void {
  if (file.raw) props.state.addFiles([file.raw]);
}
</script>

<template>
  <el-card class="direct-card material-card" shadow="never">
    <template #header
      ><div class="section-heading">
        <strong>料子资源</strong
        ><el-tag type="info" effect="plain" size="small"
          >{{ state.files.length + state.packageIds.length }} / 50 份</el-tag
        >
      </div></template
    >
    <p class="material-hint">
      {{
        simpleNewGroup
          ? "每份 TXT 或数据包创建一个新群，创建时统一校验料子。"
          : "每份 TXT 或数据包对应一个群，创建时统一校验、匹配链接。"
      }}
    </p>
    <div class="material-actions">
      <el-upload
        drag
        multiple
        accept=".txt,text/plain"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="addFile"
        :disabled="state.creating"
        class="material-upload"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          拖拽或点击选择 TXT 文件（每个不超过 2MB）
        </div>
      </el-upload>
      <div class="package-source">
        <PullTaskDataPackagePicker
          :existing-ids="state.packageIds"
          :planning="state.creating"
          :resource-error="state.error"
          direct
          @plan="state.addPackages"
        />
        <span class="material-hint">从已有料子中选择</span>
      </div>
    </div>
    <el-table
      v-if="state.files.length"
      :data="state.files"
      row-key="name"
      border
      max-height="220"
    >
      <el-table-column type="index" label="顺序" width="70" />
      <el-table-column
        prop="name"
        label="TXT 文件"
        min-width="160"
        show-overflow-tooltip
      />
      <el-table-column label="操作" width="160">
        <template #default="{ row, $index }">
          <el-button
            link
            :disabled="state.creating || $index === 0"
            @click="state.moveFile(row.name, -1)"
            >上移</el-button
          >
          <el-button
            link
            :disabled="state.creating || $index === state.files.length - 1"
            @click="state.moveFile(row.name, 1)"
            >下移</el-button
          >
          <el-button
            link
            type="danger"
            :disabled="state.creating"
            @click="state.removeFile(row.name)"
            >移除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <div class="package-entry">
      <span
        >已选择 {{ state.files.length }} 份 TXT、{{
          state.packageIds.length
        }}
        个数据包</span
      >
    </div>
    <div class="package-entry">
      <el-tag
        v-for="id in state.packageIds"
        :key="id"
        :closable="!state.creating"
        @close="state.removePackage(id)"
        >数据包 #{{ id }}</el-tag
      >
    </div>
  </el-card>
</template>

<style scoped>
.section-heading,
.package-entry {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.section-heading {
  justify-content: space-between;
}

.material-hint {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.material-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 12px;
  margin-bottom: 12px;
}

.material-upload {
  min-width: 0;
}

.material-upload :deep(.el-upload-dragger) {
  padding: 16px 12px;
  background: var(--el-fill-color-extra-light);
  border-radius: 8px;
}

.upload-icon {
  margin-bottom: 6px;
  font-size: 26px;
  color: var(--el-color-primary);
}

.material-upload :deep(.el-upload__text) {
  font-size: 12px;
}

.package-source {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.package-source .material-hint {
  margin: 0;
}

.package-entry {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 760px) {
  .material-actions {
    grid-template-columns: 1fr;
  }

  .package-source {
    padding: 12px;
  }
}
</style>
