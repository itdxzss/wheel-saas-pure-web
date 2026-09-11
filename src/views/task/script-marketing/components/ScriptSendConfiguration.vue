<script setup lang="ts">
import type { ScriptDetail, ScriptStep } from "@/api/script-marketing";

const props = defineProps<{ detail: ScriptDetail }>();
function interval(step: ScriptStep, index: number): string {
  if (!props.detail.task.accountGroupId)
    return `发送间隔 ${props.detail.task.intervalSeconds} 秒，旧版结果后计时`;
  if (index === 0) return "首条不等待";
  const min = step.waitMinSeconds;
  const max = step.waitMaxSeconds;
  if (min === null || max === null) return "等待时间未配置";
  return `等待 ${min === max ? min : `${min}–${max}`} 秒后提交`;
}
</script>

<template>
  <div class="send-configuration">
    <p class="section-hint">
      共 {{ detail.steps.length }} 项，按顺序执行。{{
        detail.task.accountGroupId
          ? "各项等待从前一条消息提交时开始计时。"
          : "旧版任务按消息结果后计时。"
      }}
    </p>
    <el-collapse v-if="detail.steps.length" accordion>
      <el-collapse-item
        v-for="(step, index) in detail.steps"
        :key="`${detail.task.id}:${index}`"
        :name="index"
      >
        <template #title>
          <div class="step-heading">
            <span class="step-number">{{ index + 1 }}</span>
            <div class="step-summary">
              <div class="step-role">
                <strong>{{
                  step.roleKey || (step.role === "ADMIN" ? "管理员" : "推手")
                }}</strong>
                <span>{{
                  step.accountId
                    ? detail.accountPhones?.[step.accountId] || "手机号不可用"
                    : "按群分配账号"
                }}</span>
              </div>
              <div class="step-preview">
                {{
                  step.message.templateName ||
                  step.message.content ||
                  (step.message.imageFileId ? "图片消息" : "查看消息内容")
                }}
              </div>
            </div>
            <span class="step-wait">{{ interval(step, index) }}</span>
          </div>
        </template>
        <div class="step-content">
          <div class="message-text">{{ step.message.content }}</div>
          <div v-if="step.message.bodyText" class="message-text">
            {{ step.message.bodyText }}
          </div>
          <p v-if="step.message.imageFileId">
            图片素材 #{{ step.message.imageFileId }}
          </p>
          <p v-if="step.message.promotionLink" class="message-text">
            {{ step.message.promotionLink }}
          </p>
          <el-space
            v-if="step.message.buttons?.length || step.message.mentionAll"
            wrap
          >
            <el-tag v-if="step.message.mentionAll" type="info" effect="plain"
              >提及全体成员</el-tag
            >
            <el-tag
              v-for="button in step.message.buttons"
              :key="button.type + button.text + button.param"
              effect="plain"
              >{{ button.text }}</el-tag
            >
          </el-space>
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-empty v-else description="暂无发送配置" :image-size="64" />
  </div>
</template>

<style scoped>
.section-hint {
  margin: 0 0 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.send-configuration :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 88px;
  line-height: 1.5;
}

.step-heading {
  display: flex;
  flex: 1;
  gap: 14px;
  align-items: center;
  min-width: 0;
  padding: 14px 12px 14px 0;
  text-align: left;
}

.step-number {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.step-summary {
  flex: 1;
  min-width: 0;
}

.step-role {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.step-role strong {
  font-size: 14px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.step-role span,
.step-wait {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.step-wait {
  max-width: 180px;
}

.step-preview {
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.step-content {
  padding: 16px;
  margin: 0 0 4px 44px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.message-text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

@media (width <= 600px) {
  .step-heading {
    flex-wrap: wrap;
    gap: 8px;
  }

  .step-summary {
    flex-basis: calc(100% - 38px);
  }

  .step-wait {
    max-width: none;
    margin-left: 38px;
  }

  .step-content {
    margin-left: 0;
  }
}
</style>
