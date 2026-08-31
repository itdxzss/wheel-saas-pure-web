<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Database from "~icons/solar/database-bold-duotone";
import Warning from "~icons/ep/warning-filled";

defineOptions({ name: "DataPackageIntro" });
</script>

<template>
  <el-card shadow="never" class="data-package-intro">
    <div class="intro-layout">
      <component :is="useRenderIcon(Database)" class="database-icon" />
      <div class="intro-copy">
        <div>
          <b>数据包说明：</b>
          数据包是一组 <b>WhatsApp 收信手机号</b> 的集合，可作为
          <el-tag size="small" type="success" effect="light" round>
            超链任务
          </el-tag>
          的目标受众使用。请按
          <code>每行一个手机号（需要带国际区号 不包含+号）</code>
          的格式上传 TXT 文件，系统将 <b>自动去重</b>，重复号码不会被多次写入。
        </div>
        <div class="restriction-line">
          <component :is="useRenderIcon(Warning)" class="warning-icon" />
          <b class="warning-label">注意：</b>
          <b>马来西亚、新加坡、香港、中国、澳门、台湾</b>
          的数据包 <b>禁止上传（导入）号码</b>，对应行的“导入”按钮已禁用。
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.data-package-intro {
  background: var(--el-color-primary-light-9);
  border: 0;
}

.data-package-intro :deep(.el-card__body) {
  padding: 18px 20px;
}

.intro-layout {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.database-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-top: 2px;
  color: var(--el-color-primary);
}

.intro-copy {
  font-size: 14px;
  line-height: 1.9;
  color: var(--el-text-color-primary);
}

.intro-copy code {
  padding: 2px 7px;
  font-family: inherit;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
  border-radius: 4px;
}

.intro-copy :deep(.el-tag) {
  margin: 0 3px;
}

.restriction-line {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  align-items: center;
  margin-top: 4px;
}

.warning-icon,
.warning-label {
  color: var(--el-color-warning);
}

.warning-icon {
  width: 15px;
  height: 15px;
}
</style>
