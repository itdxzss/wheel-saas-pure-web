<script setup lang="ts">
import { ref } from "vue";
import type { UploadFile, UploadInstance } from "element-plus";
import type { StandardPullTaskCreateForm } from "../composables/useStandardPullTaskCreate";

defineOptions({
  name: "PullTaskStandardGroupSettings"
});

const form = defineModel<StandardPullTaskCreateForm>("form", {
  required: true
});
defineProps<{
  groupAvatarFile: File | null;
}>();
const emit = defineEmits<{
  (event: "avatar-change", file: File): void;
  (event: "avatar-clear"): void;
}>();
const avatarUpload = ref<UploadInstance>();

function handleAvatarChange(uploadFile: UploadFile): void {
  if (uploadFile.raw) emit("avatar-change", uploadFile.raw);
}

function clearAvatar(): void {
  avatarUpload.value?.clearFiles();
  emit("avatar-clear");
}
</script>

<template>
  <el-card shadow="never" header="群信息设置">
    <el-form :model="form" label-position="top" class="group-settings-form">
      <section class="group-setting-block timing-block">
        <h3>设置顺序</h3>
        <el-form-item label="设置顺序">
          <el-radio-group v-model="form.groupSettingTiming">
            <el-radio-button value="BEFORE_PULL">拉人之前设置</el-radio-button>
            <el-radio-button value="AFTER_PULL">拉完人后设置</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </section>

      <section class="group-setting-block profile-block">
        <h3>基础资料</h3>
        <div class="group-setting-grid profile-grid">
          <el-form-item label="群名称（可选）">
            <el-input
              v-model="form.groupName"
              maxlength="128"
              placeholder="请输入群名称"
            />
          </el-form-item>
          <el-form-item label="料子文件名为群名">
            <el-switch v-model="form.useMaterialFileNameAsGroupName" />
          </el-form-item>
          <el-form-item label="群头像（可选）">
            <el-upload
              ref="avatarUpload"
              :auto-upload="false"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              :show-file-list="false"
              :on-change="handleAvatarChange"
            >
              <el-button>上传图片</el-button>
            </el-upload>
            <div v-if="groupAvatarFile" class="avatar-selection">
              <span class="avatar-file-name">
                {{ groupAvatarFile.name }}
              </span>
              <el-button link type="danger" @click="clearAvatar">
                清除
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="群描述（可选）" class="description-field">
            <el-input
              v-model="form.groupDescription"
              type="textarea"
              :rows="3"
              maxlength="1024"
              show-word-limit
              placeholder="请输入群描述"
            />
          </el-form-item>
        </div>
      </section>

      <section class="group-setting-block permission-block">
        <h3>权限控制</h3>
        <div class="group-setting-grid permission-grid">
          <el-form-item label="是否任务完成后自动关闭禁言">
            <el-radio-group v-model="form.autoCloseMuteAfterTask">
              <el-radio-button :value="true">是</el-radio-button>
              <el-radio-button :value="false">否</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="是否任务完成后自动关闭拉人权限">
            <el-radio-group v-model="form.autoCloseInviteAfterTask">
              <el-radio-button :value="true">是</el-radio-button>
              <el-radio-button :value="false">否</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="允许任何人编辑群组设置">
            <el-radio-group v-model="form.editPermission">
              <el-radio-button value="UNCHANGED">不操作</el-radio-button>
              <el-radio-button value="ALLOW">允许</el-radio-button>
              <el-radio-button value="DISALLOW">不允许</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="群禁言">
            <el-radio-group v-model="form.muteMode">
              <el-radio-button value="UNCHANGED">不操作</el-radio-button>
              <el-radio-button value="MUTE">禁言</el-radio-button>
              <el-radio-button value="UNMUTE">不禁言</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="获取群链接权限">
            <el-radio-group v-model="form.linkPermission">
              <el-radio-button value="ALL">所有人</el-radio-button>
              <el-radio-button value="ADMIN_ONLY">仅管理员</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="限时消息" class="timed-message-field">
            <el-radio-group v-model="form.disappearingMessage">
              <el-radio value="ONE_DAY">24小时</el-radio>
              <el-radio value="SEVEN_DAYS">7天</el-radio>
              <el-radio value="NINETY_DAYS">90天</el-radio>
              <el-radio value="OFF">关闭</el-radio>
              <el-radio value="UNCHANGED">默认使用群已有设置</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </section>
    </el-form>
  </el-card>
</template>

<style scoped>
.group-settings-form {
  display: grid;
  grid-template-columns: minmax(220px, 0.45fr) minmax(520px, 1.55fr);
  gap: 12px;
}

.group-setting-block {
  min-width: 0;
  padding: 12px 14px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.group-setting-block h3 {
  padding-bottom: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.permission-block {
  grid-column: 1 / -1;
}

.group-setting-grid {
  display: grid;
  gap: 0 12px;
}

.profile-grid,
.permission-grid {
  grid-template-columns: repeat(2, minmax(220px, 1fr));
}

.description-field,
.timed-message-field {
  grid-column: 1 / -1;
}

.group-settings-form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.avatar-selection {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-left: 10px;
}

.avatar-file-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (width <= 1200px) {
  .group-settings-form,
  .profile-grid,
  .permission-grid {
    grid-template-columns: 1fr;
  }

  .permission-block,
  .description-field,
  .timed-message-field {
    grid-column: 1;
  }
}
</style>
