<script setup lang="ts">
import type { HyperlinkTaskCreateContext } from "@/api/hyperlink-task-list";

defineProps<{
  context: HyperlinkTaskCreateContext | null;
  loading: boolean;
  errorMessage: string;
}>();

defineEmits<{ (event: "retry"): void }>();
</script>

<template>
  <el-card class="intro-card" shadow="never">
    <div class="intro-heading">
      <div>
        <div class="intro-title">
          <h2>WhatsApp 超链群发</h2>
          <el-tag type="primary" effect="dark" round>Hyperlink</el-tag>
          <el-tag
            v-if="context"
            :type="context.pricingMode === 'SUPER' ? 'danger' : 'success'"
            effect="light"
            round
          >
            {{ context.pricingMode === "SUPER" ? "超级模式" : "普通模式" }}
          </el-tag>
        </div>
        <p class="intro-description">
          一个任务 = 一个数据包 + 一组账号筛选 + 一条 WhatsApp 消息
        </p>
      </div>
      <div v-loading="loading" class="price-panel">
        <template v-if="context">
          <span>当前参考单价</span>
          <strong>
            {{ context.currencyCode }} {{ context.referenceUnitPrice }}
          </strong>
          <el-tag size="small" effect="plain">{{ context.priceCode }}</el-tag>
        </template>
        <el-button
          v-else-if="errorMessage"
          link
          type="danger"
          @click="$emit('retry')"
        >
          价格加载失败，点击重试
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="context?.pricingMode === 'SUPER'"
      class="super-alert"
      type="warning"
      :closable="false"
      show-icon
      title="超级模式已开启：任务使用加速价码与更高优先级，最终费用以服务端报价为准。"
    />

    <div class="mode-grid">
      <div class="mode-item">
        <strong>即时模式</strong>
        <span>一次性发送当前冻结的数据包受众。</span>
      </div>
      <div class="mode-item">
        <strong>预发布模式</strong>
        <span>计划结束前允许符合条件的新账号加入执行。</span>
      </div>
      <div class="mode-item">
        <strong>周期模式</strong>
        <span>按固定周期选择账号，持续处理剩余受众。</span>
      </div>
      <div class="mode-item country-price">
        <strong>国家价格</strong>
        <span>创建或启动报价按目标国家分别返回；不以参考价替代国家报价。</span>
      </div>
    </div>
    <p class="lifecycle-tip">运行中任务可暂停、恢复或停止；停止后不可恢复。</p>
  </el-card>
</template>

<style scoped lang="scss">
.intro-card {
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-light);
}

.intro-heading,
.intro-title,
.mode-grid,
.price-panel {
  display: flex;
  align-items: center;
}

.intro-heading {
  gap: 20px;
  justify-content: space-between;
}

.intro-title {
  gap: 10px;

  h2 {
    margin: 0;
    font-size: 22px;
  }
}

.intro-description,
.lifecycle-tip {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
}

.price-panel {
  gap: 8px;
  justify-content: flex-end;
  min-width: 250px;
  min-height: 54px;

  strong {
    font-size: 20px;
    color: var(--el-color-primary);
  }
}

.super-alert {
  margin-top: 14px;
}

.mode-grid {
  gap: 10px;
  align-items: stretch;
  margin-top: 16px;
}

.mode-item {
  flex: 1;
  min-width: 0;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  strong,
  span {
    display: block;
  }

  span {
    margin-top: 5px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

.country-price {
  background: var(--el-color-primary-light-9);
}

@media (width <= 900px) {
  .intro-heading,
  .mode-grid {
    flex-direction: column;
    align-items: stretch;
  }

  .price-panel {
    justify-content: flex-start;
  }
}
</style>
