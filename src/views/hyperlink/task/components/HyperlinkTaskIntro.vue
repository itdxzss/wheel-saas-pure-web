<script setup lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import type { HyperlinkTaskCreateContext } from "@/api/hyperlink-task-list";
import Whatsapp from "~icons/ri/whatsapp-fill";

defineProps<{
  context: HyperlinkTaskCreateContext | null;
  loading: boolean;
  errorMessage: string;
}>();

defineEmits<{ (event: "retry"): void }>();
</script>

<template>
  <section class="intro-card">
    <div class="whatsapp-mark" aria-hidden="true">
      <component :is="useRenderIcon(Whatsapp)" />
    </div>
    <div class="intro-copy">
      <div class="intro-title">
        <h2>WhatsApp 超链群发</h2>
        <el-tag class="hyperlink-tag" effect="plain" round>Hyperlink</el-tag>
        <template v-if="context">
          <el-tag
            class="price-tag"
            :type="context.pricingMode === 'SUPER' ? 'danger' : 'success'"
            effect="plain"
            round
          >
            {{
              context.pricingMode === "SUPER" ? "超级模式" : "普通模式"
            }}单价： {{ context.referenceUnitPrice
            }}{{ context.currencyCode }}/条
          </el-tag>
        </template>
      </div>
      <p class="intro-description">
        一个任务 = 一个数据包 + 一组账号筛选条件 + 一条 WhatsApp
        消息模板；系统按「发送间隔 /
        并发账号」自动从筛选出的「有效号」中调度发送。
      </p>
      <p class="mode-description">
        支持三种模式：
        <b>即时</b><span>按计划快速发完整个数据包</span> <b>预发布</b
        ><span>到指定时间结束，期间符合筛选的新号自动加入</span> <b>周期</b
        ><span>定时循环发送，监测各国不同阶段的账号封控规律</span>
        <span>。运行中可随时</span><b>暂停</b><b>恢复</b><span>或</span
        ><b>停止</b><span>。</span>
      </p>
    </div>
    <div v-loading="loading" class="context-state">
      <el-button v-if="!context && errorMessage" link @click="$emit('retry')">
        价格加载失败，点击重试
      </el-button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.intro-card {
  position: relative;
  display: flex;
  gap: 18px;
  align-items: center;
  min-height: 110px;
  padding: 18px 22px;
  margin-bottom: 12px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(105deg, #17bf62 0%, #00a56a 48%, #07856d 100%);
  border-radius: 12px;
  box-shadow: 0 8px 22px rgb(0 145 91 / 14%);
}

.whatsapp-mark,
.intro-title,
.mode-description {
  display: flex;
  align-items: center;
}

.whatsapp-mark {
  flex: 0 0 64px;
  justify-content: center;
  width: 64px;
  height: 64px;
  color: #fff;
  background: rgb(255 255 255 / 15%);
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 12px;

  :deep(svg) {
    width: 38px;
    height: 38px;
  }
}

.intro-copy {
  min-width: 0;
}

.intro-title {
  flex-wrap: wrap;
  gap: 8px;

  h2 {
    margin: 0;
    font-size: 23px;
    line-height: 1.2;
    color: #fff;
  }
}

.hyperlink-tag,
.price-tag {
  font-weight: 600;
  color: #087758;
  background: rgb(255 255 255 / 92%);
  border-color: rgb(255 255 255 / 52%);
}

.price-tag {
  color: #086f62;
}

.intro-description,
.mode-description {
  margin: 7px 0 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.55;
  color: rgb(255 255 255 / 94%);
}

.mode-description {
  flex-wrap: wrap;
  gap: 3px 5px;
  margin-top: 2px;
}

.mode-description b {
  padding: 0 5px;
  color: #087758;
  background: rgb(255 255 255 / 92%);
  border-radius: 9px;
}

.context-state {
  position: absolute;
  top: 12px;
  right: 14px;
  min-width: 20px;
  min-height: 20px;

  :deep(.el-button) {
    color: #fff;
  }
}

@media (width <= 900px) {
  .intro-card {
    align-items: flex-start;
  }

  .whatsapp-mark {
    flex-basis: 50px;
    width: 50px;
    height: 50px;
  }
}
</style>
