<script setup lang="ts">
import type { CommonGroupForm } from "../../common-group/common-group-form";
import CommonGroupHelp from "./CommonGroupHelp.vue";

defineOptions({ name: "CommonGroupPermissionSection" });

const form = defineModel<CommonGroupForm>("form", { required: true });
</script>

<template>
  <el-card shadow="never" class="form-section">
    <template #header>
      <div class="section-title">
        <span class="section-number">5</span>
        <div>
          <strong>群权限</strong>
          <p>配置新建群组的权限；选择“默认”时沿用系统策略。</p>
        </div>
      </div>
    </template>

    <div class="permission-grid">
      <el-form-item label="群禁言">
        <el-radio-group v-model="form.muteMode">
          <el-radio-button value="OPEN">开放</el-radio-button>
          <el-radio-button value="CLOSED">禁言</el-radio-button>
          <el-radio-button value="DEFAULT">默认</el-radio-button>
        </el-radio-group>
        <div class="field-help">控制新建群组是否允许普通成员发言。</div>
      </el-form-item>
      <el-form-item label="允许群编辑">
        <el-radio-group v-model="form.editPermission">
          <el-radio-button value="OPEN">允许</el-radio-button>
          <el-radio-button value="CLOSED">禁止</el-radio-button>
          <el-radio-button value="DEFAULT">默认</el-radio-button>
        </el-radio-group>
        <div class="field-help">控制普通成员是否允许编辑群组信息。</div>
      </el-form-item>
      <el-form-item label="开启审核">
        <el-radio-group v-model="form.approveMode">
          <el-radio-button value="OPEN">开启</el-radio-button>
          <el-radio-button value="CLOSED">关闭</el-radio-button>
          <el-radio-button value="DEFAULT">默认</el-radio-button>
        </el-radio-group>
        <div class="field-help">控制新成员加入群组时是否需要审核。</div>
      </el-form-item>
      <el-form-item label="限时时间">
        <el-select v-model="form.disappearingMessage" class="full-width">
          <el-option label="24 小时" value="ONE_DAY" />
          <el-option label="7 天" value="SEVEN_DAYS" />
          <el-option label="90 天" value="NINETY_DAYS" />
          <el-option label="关闭" value="OFF" />
          <el-option label="默认" value="DEFAULT" />
        </el-select>
        <div class="field-help">设置群消息自动消失时间。</div>
      </el-form-item>
      <el-form-item>
        <template #label>
          群链接权限
          <CommonGroupHelp content="控制普通成员是否可以获取群邀请链接。" />
        </template>
        <el-radio-group v-model="form.linkPermission">
          <el-radio value="ALL">所有人可获取</el-radio>
          <el-radio value="ADMIN_ONLY">仅管理员可获取</el-radio>
        </el-radio-group>
        <div class="field-help">控制普通成员是否可以获取群邀请链接。</div>
      </el-form-item>
    </div>
  </el-card>
</template>

<style scoped>
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

.permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
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

@media (width <= 1100px) {
  .permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
