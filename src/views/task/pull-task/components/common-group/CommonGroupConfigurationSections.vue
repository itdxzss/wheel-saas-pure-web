<script setup lang="ts">
import { computed } from "vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { GroupFolderRow } from "@/api/group-folder";
import type {
  CommonGroupForm,
  CommonGroupFormErrors
} from "../../common-group/common-group-form";
import { commonGroupNamePreview } from "../../common-group/common-group-form";
import CommonGroupHelp from "./CommonGroupHelp.vue";

defineOptions({ name: "CommonGroupConfigurationSections" });

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  errors: CommonGroupFormErrors;
  groupFolders: GroupFolderRow[];
}>();

const form = defineModel<CommonGroupForm>("form", { required: true });
const previewNames = computed(() => commonGroupNamePreview(form.value));
const previewFolderName = computed(
  () =>
    props.groupFolders.find(folder => folder.id === form.value.groupFolderId)
      ?.name ?? "默认分组（自动）"
);
</script>

<template>
  <div class="section-grid">
    <el-card shadow="never" class="form-section">
      <template #header>
        <div class="section-title">
          <span class="section-number">3</span>
          <div>
            <strong>群组配置</strong>
            <p>配置创建策略、归属、名称与批次数量。</p>
          </div>
        </div>
      </template>

      <div class="field-columns">
        <el-form-item required>
          <template #label>
            建群速度
            <CommonGroupHelp content="普通模式按系统默认间隔依次执行建群。" />
          </template>
          <el-radio-group v-model="form.speed">
            <el-radio-button value="NORMAL">普通</el-radio-button>
            <el-radio-button value="FAST" disabled>快速</el-radio-button>
          </el-radio-group>
          <div class="field-help">
            普通模式按系统默认秒级间隔依次执行；快速模式暂未开放。
          </div>
        </el-form-item>
        <el-form-item>
          <template #label>
            群组分组
            <CommonGroupHelp content="未选择时，成功群组进入系统默认分组。" />
          </template>
          <el-select
            v-model="form.groupFolderId"
            clearable
            filterable
            placeholder="不选择则使用系统默认分组"
            class="full-width"
          >
            <el-option
              v-for="folder in groupFolders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
          <div class="field-help">未选择时，成功群组进入系统默认分组。</div>
        </el-form-item>
        <el-form-item :error="errors.groupName">
          <template #label>
            群名称
            <CommonGroupHelp
              content="未填写时由系统生成；填写后会在末尾追加连续编号。"
            />
          </template>
          <el-input
            v-model="form.groupName"
            clearable
            maxlength="60"
            show-word-limit
            placeholder="选填，例如：海外项目群"
          />
          <div class="field-help">选填；填写后会在群名称末尾追加连续编号。</div>
        </el-form-item>
        <el-form-item required :error="errors.groupCount">
          <template #label>
            建群数量
            <CommonGroupHelp
              content="本次任务拆分的群组执行项数量，可设置 1 至 20。"
            />
          </template>
          <el-input-number
            v-model="form.groupCount"
            :min="1"
            :max="20"
            :step="1"
            step-strictly
            class="full-width"
          />
          <div class="field-help">默认 1，本次最多创建 20 个群组。</div>
        </el-form-item>
        <el-form-item required :error="errors.startIndex">
          <template #label>
            开始编号
            <CommonGroupHelp
              content="创建多个群组时，名称末尾编号从此值开始逐个递增。"
            />
          </template>
          <el-input-number
            v-model="form.startIndex"
            :min="1"
            :step="1"
            step-strictly
            class="full-width"
          />
          <div class="field-help">默认 1，创建多个群组时逐个递增。</div>
        </el-form-item>
        <div class="name-preview">
          <div class="preview-header">
            <strong>群名称预览</strong>
            <span>归属：{{ previewFolderName }}</span>
          </div>
          <div class="preview-tags">
            <el-tag v-for="name in previewNames" :key="name" effect="plain">
              {{ name }}
            </el-tag>
            <span v-if="form.groupCount > 5" class="preview-more">
              另有 {{ form.groupCount - 5 }} 个
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="form-section">
      <template #header>
        <div class="section-title">
          <span class="section-number">4</span>
          <div>
            <strong>账号迁移</strong>
            <p>任务结束后可将账号迁移到指定账号分组。</p>
          </div>
        </div>
      </template>

      <div class="field-columns">
        <el-form-item label="成功账号迁移分组">
          <el-select
            v-model="form.successMoveGroupId"
            clearable
            filterable
            placeholder="不迁移"
            class="full-width"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
          <div class="field-help">选填，仅用于成功执行项。</div>
        </el-form-item>
        <el-form-item label="失败账号迁移分组">
          <el-select
            v-model="form.failureMoveGroupId"
            clearable
            filterable
            placeholder="不迁移"
            class="full-width"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
          <div class="field-help">选填，失败项保留原因并支持单独重试。</div>
        </el-form-item>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.form-section {
  border-color: var(--el-border-color-light);
}

.section-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.section-title strong {
  font-size: 16px;
}

.section-title p {
  margin: 3px 0 0;
  font-size: 13px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.section-number {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  font-weight: 600;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 8px;
}

.field-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.full-width {
  width: 100%;
}

.field-help {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.name-preview {
  grid-column: 1 / -1;
  padding: 14px 16px;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 6px;
}

.preview-header,
.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.preview-header {
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
}

.preview-header span,
.preview-more {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

@media (width <= 760px) {
  .field-columns {
    grid-template-columns: 1fr;
  }
}
</style>
