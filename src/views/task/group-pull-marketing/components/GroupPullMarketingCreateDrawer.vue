<script setup lang="ts">
import { computed } from "vue";
import type { UploadFile } from "element-plus";
import type { AccountGroupApiRow } from "@/api/account-group";
import type { MarketingTemplateRow } from "@/api/marketing-template";
import { requiresMarketerAdmin, speakPermissionOptions } from "../constants";
import type { GroupPullMarketingCreateForm } from "../composables/useGroupPullMarketingPage";

defineOptions({
  name: "GroupPullMarketingCreateDrawer"
});

const props = defineProps<{
  accountGroups: AccountGroupApiRow[];
  createBlockReason: string;
  marketingTemplates: MarketingTemplateRow[];
  materialFile: File | null;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (event: "clear-file"): void;
  (event: "file-select", file: File): void;
  (event: "submit"): void;
}>();

const visible = defineModel<boolean>({ required: true });
const form = defineModel<GroupPullMarketingCreateForm>("form", {
  required: true
});

const administratorRequired = computed(() =>
  requiresMarketerAdmin(
    form.value.speakPermission,
    form.value.builderExitEnabled
  )
);

function groupOptionLabel(group: AccountGroupApiRow): string {
  return `${group.name}（正常在线 ${group.onlineAccounts}）`;
}

function handleFileChange(uploadFile: UploadFile): void {
  if (uploadFile.raw) emit("file-select", uploadFile.raw);
}
</script>

<template>
  <el-drawer
    v-model="visible"
    title="新增拉群营销任务"
    size="760px"
    destroy-on-close
  >
    <el-form :model="form" label-position="top" class="create-form">
      <el-divider content-position="left">基础设置</el-divider>
      <div class="form-grid">
        <el-form-item label="任务名称" required class="span-two">
          <el-input
            v-model="form.taskName"
            clearable
            maxlength="128"
            show-word-limit
            placeholder="请输入任务名称"
          />
        </el-form-item>

        <el-form-item label="建群账号分组" required>
          <el-select
            v-model="form.builderGroupId"
            filterable
            placeholder="请选择建群账号分组"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="groupOptionLabel(group)"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="营销分组" required>
          <el-select
            v-model="form.marketingGroupId"
            filterable
            placeholder="请选择营销分组"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="groupOptionLabel(group)"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="建群成功转入分组">
          <el-select
            v-model="form.successGroupId"
            clearable
            filterable
            placeholder="可不配置"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="groupOptionLabel(group)"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="建群失败转入分组">
          <el-select
            v-model="form.failureGroupId"
            clearable
            filterable
            placeholder="可不配置"
          >
            <el-option
              v-for="group in accountGroups"
              :key="group.id"
              :label="groupOptionLabel(group)"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="单营销账号最大群组数" required>
          <el-input-number
            v-model="form.marketingAccountGroupLimit"
            :min="1"
            :step="1"
          />
        </el-form-item>

        <el-form-item label="营销模板" required>
          <el-select
            v-model="form.marketingTemplateId"
            filterable
            placeholder="请选择已有营销模板"
          >
            <el-option
              v-for="template in marketingTemplates"
              :key="template.id"
              :label="template.templateName"
              :value="template.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="营销轮次间隔（秒）" required>
          <el-input-number
            v-model="form.sendIntervalSeconds"
            :min="1"
            :step="1"
          />
        </el-form-item>

        <el-form-item label="群名前缀">
          <el-input
            v-model="form.groupNamePrefix"
            clearable
            maxlength="100"
            show-word-limit
            placeholder="为空时使用任务名称"
          />
        </el-form-item>

        <el-form-item label="加好友重试次数" required>
          <el-input-number
            v-model="form.friendRetryLimit"
            :min="0"
            :max="10"
            :step="1"
          />
          <span class="field-tip">不包含首次操作</span>
        </el-form-item>

        <el-form-item label="单群抽取数量" required>
          <el-input-number v-model="form.materialPerGroup" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="form.taskEndAt"
            type="datetime"
            value-format="x"
            placeholder="请选择结束时间"
          />
        </el-form-item>

        <el-form-item label="料子文件" required class="span-two">
          <div class="material-file-row">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".txt,.csv"
              :on-change="handleFileChange"
            >
              <el-button>选择文件</el-button>
            </el-upload>
            <span v-if="materialFile" class="selected-file">
              {{ materialFile.name }}
              <el-button link type="danger" @click="emit('clear-file')">
                移除
              </el-button>
            </span>
            <span v-else class="field-tip">
              仅支持一个 TXT 或 CSV，后选文件覆盖前一个
            </span>
          </div>
        </el-form-item>

        <el-form-item label="备注" class="span-two">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="512"
            show-word-limit
          />
        </el-form-item>
      </div>

      <el-divider content-position="left">群信息设置</el-divider>
      <div class="form-grid">
        <el-form-item label="群组发言权限" required>
          <el-radio-group v-model="form.speakPermission">
            <el-radio
              v-for="option in speakPermissionOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="建群账号退出群组" required>
          <el-switch
            v-model="form.builderExitEnabled"
            inline-prompt
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </div>

      <el-alert
        v-if="administratorRequired"
        type="info"
        show-icon
        :closable="false"
        title="当前配置要求营销账号成功设置为群管理员"
      />
    </el-form>

    <template #footer>
      <el-alert
        v-if="createBlockReason"
        class="footer-alert"
        :title="createBlockReason"
        type="warning"
        show-icon
        :closable="false"
      />
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="Boolean(createBlockReason)"
        @click="emit('submit')"
      >
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<style scoped>
.create-form {
  padding-right: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.span-two {
  grid-column: 1 / -1;
}

.form-grid :deep(.el-select),
.form-grid :deep(.el-date-editor),
.form-grid :deep(.el-input-number) {
  width: 100%;
}

.material-file-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.field-tip {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
}

.selected-file {
  color: var(--el-text-color-regular);
}

.footer-alert {
  display: inline-flex;
  width: auto;
  margin-right: 12px;
  vertical-align: middle;
}

@media (width <= 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .span-two {
    grid-column: auto;
  }
}
</style>
