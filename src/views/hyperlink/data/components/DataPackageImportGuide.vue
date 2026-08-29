<script setup lang="ts">
import type { DataPackageListItem } from "@/api/hyperlink-data-package";
import CircleCheckFilled from "~icons/ep/circle-check-filled";
import CircleCloseFilled from "~icons/ep/circle-close-filled";
import Download from "~icons/ep/download";
import WarningFilled from "~icons/ep/warning-filled";
import Database from "~icons/solar/database-bold-duotone";

defineOptions({ name: "DataPackageImportGuide" });

defineProps<{
  dataPackage: DataPackageListItem | null;
  formattedMaxRows: string;
}>();

defineEmits<{ (event: "download-template"): void }>();

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
</script>

<template>
  <div v-if="dataPackage" class="package-summary">
    <div class="package-summary__identity">
      <span class="package-summary__icon"><Database /></span>
      <span class="package-summary__copy">
        <strong class="package-summary__name" :title="dataPackage.name">
          {{ dataPackage.name }}
        </strong>
        <span class="package-summary__meta">
          ID #{{ dataPackage.id }} · 当前
          {{ formatCount(dataPackage.metrics.totalCount) }} 条
        </span>
      </span>
    </div>
    <el-button type="primary" plain round @click="$emit('download-template')">
      <el-icon><Download /></el-icon>
      下载模板
    </el-button>
  </div>

  <section class="format-guide">
    <div class="format-guide__title">
      <el-icon><WarningFilled /></el-icon>
      <strong>文件格式要求</strong>
    </div>
    <div class="format-guide__description">
      每行<strong>一个完整手机号</strong>，<strong>仅允许 0-9 数字</strong
      >；不允许 <code>+</code> 前缀（<code>+86138...</code> ❌）、不允许
      <code>#</code>
      开头的注释行，也不允许空格、<code>-</code>、<code>(</code>、<code>)</code>
      等任何非数字字符。<strong>不符合规范的行将被直接跳过。</strong>
      单次最多导入
      <strong>{{ formattedMaxRows }}</strong> 条，超出请拆分文件分批上传。
      <span class="format-guide__forbidden">
        <strong>
          禁止上传马来西亚（60）、新加坡（65）、中国（86）、中国香港（852）、中国澳门（853）、中国台湾（886）的号码
        </strong>
        ，命中将阻止本次上传。
      </span>
    </div>
    <div class="format-examples">
      <div class="format-example">
        <div class="format-example__label is-valid">
          <el-icon><CircleCheckFilled /></el-icon>
          正确
        </div>
        <div class="format-example__line is-valid">66812345678</div>
        <div class="format-example__line is-valid">5511987654321</div>
      </div>
      <div class="format-example">
        <div class="format-example__label is-invalid">
          <el-icon><CircleCloseFilled /></el-icon>
          错误
        </div>
        <div class="format-example__line is-invalid">+66812345678</div>
        <div class="format-example__line is-invalid">66 812-345-678</div>
        <div class="format-example__line is-invalid"># 这是注释</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.package-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    var(--el-fill-color-blank)
  );
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 10px;
}

.package-summary__identity {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.package-summary__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
  border-radius: 9px;
}

.package-summary__icon :deep(svg) {
  width: 21px;
  height: 21px;
}

.package-summary__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.package-summary__name,
.package-summary__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-summary__name {
  color: var(--el-text-color-primary);
}

.package-summary__meta {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.format-guide {
  padding: 13px 15px;
  margin-bottom: 18px;
  background: linear-gradient(
    135deg,
    var(--el-color-danger-light-9),
    color-mix(in srgb, var(--el-color-danger-light-9) 35%, transparent)
  );
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 9px;
}

.format-guide__title {
  display: flex;
  gap: 7px;
  align-items: center;
  color: var(--el-color-danger);
}

.format-guide__description {
  margin-top: 7px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--el-text-color-regular);
}

.format-guide__description strong {
  font-weight: 600;
  color: var(--el-color-danger);
}

.format-guide__description code {
  padding: 1px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-8);
  border-radius: 4px;
}

.format-guide__forbidden {
  display: block;
  margin-top: 4px;
}

.format-examples {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-top: 10px;
}

.format-example {
  overflow: hidden;
  background: color-mix(in srgb, var(--el-bg-color) 78%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
}

.format-example__label {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
}

.format-example__label.is-valid {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

.format-example__label.is-invalid {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.format-example__line {
  padding: 5px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.format-example__line.is-valid {
  color: var(--el-color-success);
}

.format-example__line.is-invalid {
  color: var(--el-color-danger);
  text-decoration: line-through;
  text-decoration-color: var(--el-color-danger-light-3);
}

@media (width <= 720px) {
  .package-summary {
    align-items: flex-start;
  }

  .format-examples {
    grid-template-columns: 1fr;
  }
}
</style>
