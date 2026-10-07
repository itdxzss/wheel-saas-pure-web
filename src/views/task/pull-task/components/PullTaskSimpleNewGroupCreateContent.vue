<script setup lang="ts">
import type { UploadFile, UploadInstance } from "element-plus";
import { ref } from "vue";
import { formatAccountGroupLabel } from "@/utils/account-group-label";
import type {
  SimpleNewGroupPullTaskCreateState,
  SimpleNewGroupPullTaskForm
} from "../composables/useSimpleNewGroupPullTaskCreate";
import PullTaskImmediateCreateContent from "./PullTaskImmediateCreateContent.vue";

const props = defineProps<{ state: SimpleNewGroupPullTaskCreateState }>();
const form = defineModel<SimpleNewGroupPullTaskForm>("form", {
  required: true
});
const avatarUpload = ref<UploadInstance>();
const groupFields = [
  { key: "creatorGroupId", label: "建群人分组", required: true },
  { key: "managerGroupId", label: "管理分组", required: true },
  {
    key: "managerFinishGroupId",
    label: "任务完成的管理移至分组",
    required: false
  }
] as const;
function changeAvatar(file: UploadFile): void {
  if (file.raw) props.state.setAvatar(file.raw);
}
function clearAvatar(): void {
  avatarUpload.value?.clearFiles();
  props.state.clearAvatar();
}
</script>

<template>
  <PullTaskImmediateCreateContent
    v-model:form="form"
    :state="state"
    simple-new-group
  >
    <template #target>
      <el-card shadow="never" header="新群资料">
        <el-form-item label="群名称" required>
          <el-input
            v-model="form.groupName"
            maxlength="100"
            show-word-limit
            placeholder="请输入群名称"
          />
          <p class="field-help">
            每份料子创建一个新群，群名按“名称-序号”生成。
          </p>
        </el-form-item>
        <el-form-item label="群头像（可选）">
          <el-upload
            ref="avatarUpload"
            :auto-upload="false"
            :show-file-list="false"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            :on-change="changeAvatar"
          >
            <el-button>上传图片</el-button>
          </el-upload>
          <span v-if="state.avatar.file" class="avatar-selection">
            {{ state.avatar.file.name }}
            <el-button link type="danger" @click="clearAvatar">清除</el-button>
          </span>
          <p class="field-help">JPG、JPEG、PNG，大小不超过 500KB。</p>
        </el-form-item>
        <el-form-item label="群公告（可选）">
          <el-input
            v-model="form.groupDescription"
            type="textarea"
            :rows="3"
            maxlength="1024"
            show-word-limit
            placeholder="请输入群公告"
          />
        </el-form-item>
        <el-alert
          title="群资料及加人权限设置成功、管理员接管后，拉手踩链接进群拉人。"
          type="info"
          :closable="false"
          show-icon
        />
      </el-card>
    </template>
    <template #interval>
      <div class="range-inputs">
        <el-input-number
          v-model="form.pullIntervalSeconds"
          :min="0"
          :precision="0"
          controls-position="right"
          aria-label="拉人间隔下限"
        />
        <span>至</span>
        <el-input-number
          v-model="form.pullIntervalMaxSeconds"
          :min="form.pullIntervalSeconds"
          :precision="0"
          controls-position="right"
          aria-label="拉人间隔上限"
        />
      </div>
    </template>
    <template #accounts>
      <div class="account-grid">
        <el-form-item
          v-for="field in groupFields"
          :key="field.key"
          :label="field.label"
          :required="field.required"
        >
          <el-select
            v-model="form[field.key]"
            clearable
            filterable
            class="full-width"
            placeholder="请选择账号分组"
          >
            <el-option
              v-for="group in state.accountGroups"
              :key="group.id"
              :value="group.id"
              :label="formatAccountGroupLabel(group)"
            />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="管理员接管后注销建群账号">
        <el-switch
          v-model="form.creatorDeleteAfterTakeover"
          data-testid="simple-new-group-creator-delete"
        />
        <p class="field-help">
          开启后，群设置完成且管理号已确认成为管理员，再永久注销建群账号；确认创建者信息清理完成后继续拉人。注销不可撤销。
        </p>
        <p class="field-help">
          仅支持 Android
          主设备建群账号，需配置接管管理分组；任务启动后不可修改。
        </p>
      </el-form-item>
    </template>
  </PullTaskImmediateCreateContent>
</template>

<style scoped>
.account-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
}

.full-width {
  width: 100%;
}

.field-help {
  width: 100%;
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.avatar-selection {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-left: 10px;
}

.range-inputs {
  display: flex;
  gap: 6px;
  align-items: center;
  width: 100%;
  max-width: 250px;
}

.range-inputs :deep(.el-input-number) {
  flex: 1;
  width: 0;
  min-width: 0;
}

@media (width <= 760px) {
  .account-grid {
    grid-template-columns: 1fr;
  }
}
</style>
