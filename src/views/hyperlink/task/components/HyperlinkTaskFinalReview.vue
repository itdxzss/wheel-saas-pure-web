<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import type {
  HyperlinkAccountMatchCount,
  HyperlinkTaskCreateContext,
  HyperlinkTaskQuote
} from "@/api/hyperlink-task";
import type { DataPackageListItem } from "@/api/hyperlink-data-package";
import type { HyperlinkTaskForm } from "../domain/editor-rules";

const visible = defineModel<boolean>({ required: true });
const props = defineProps<{
  form: HyperlinkTaskForm;
  quote: HyperlinkTaskQuote | null;
  createContext: HyperlinkTaskCreateContext | null;
  dataPackage: DataPackageListItem | undefined;
  match: HyperlinkAccountMatchCount | null;
  loading: boolean;
}>();
const emit = defineEmits<{
  (event: "confirm"): void;
}>();

const seconds = ref(7);
let timer: ReturnType<typeof setInterval> | undefined;
const messageTypeLabel = computed(() => {
  const labels = { 1: "单图文", 2: "双图文", 3: "普通按钮", 4: "卡片按钮" };
  return labels[props.form.messageType];
});
const targetLink = computed(() =>
  props.form.messageType === 1 || props.form.messageType === 2
    ? props.form.messageContent.promotionLink
    : props.form.messageContent.buttons[0]?.url
);
const trackingEnabled = computed(
  () => props.form.messageContent.buttons[0]?.useShortLink ?? false
);
const quoteExpired = computed(() => {
  void seconds.value;
  return Boolean(props.quote && props.quote.expiresAt <= Date.now());
});
const currentBalance = computed(
  () =>
    props.quote?.availableBalance ?? props.createContext?.availableBalance ?? 0
);

function stopTimer(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}

function startTimer(): void {
  stopTimer();
  seconds.value = 7;
  timer = setInterval(() => {
    seconds.value -= 1;
    if (seconds.value <= 0) stopTimer();
  }, 1000);
}

watch([visible, () => props.quote?.quoteToken], ([opened]) => {
  if (opened) startTimer();
  else stopTimer();
});
onBeforeUnmount(stopTimer);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="最后核对"
    width="520px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-alert
      type="warning"
      show-icon
      :closable="false"
      title="确认关键信息无误后再提交，启用任务后即可能开始发送。"
    />
    <div class="balance-row">
      <div>
        <small>当前余额</small
        ><b
          >{{ currentBalance }}
          {{ quote?.currencyCode ?? createContext?.currencyCode }}</b
        >
      </div>
      <span>→</span>
      <div>
        <small>预计冻结</small
        ><b>{{
          form.enabled ? (quote?.estimatedAmount ?? "-") : "0（仅保存）"
        }}</b>
      </div>
    </div>
    <el-tag v-if="quote?.pricingMode === 'SUPER'" type="warning"
      >超级模式</el-tag
    >
    <el-descriptions :column="1" border class="review-items">
      <el-descriptions-item label="任务名">{{
        form.taskName
      }}</el-descriptions-item>
      <el-descriptions-item label="受众数据包">
        {{ quote?.dataPackageName ?? dataPackage?.name ?? "未选择（仅保存）" }}
        <span v-if="dataPackage">
          · 未使用 {{ dataPackage.metrics.unusedCount }} 条</span
        >
      </el-descriptions-item>
      <el-descriptions-item label="消息类型">{{
        messageTypeLabel
      }}</el-descriptions-item>
      <el-descriptions-item label="匹配账号"
        >{{ match?.availableAccountCount ?? 0 }} 个</el-descriptions-item
      >
      <el-descriptions-item label="执行账号">
        {{ quote?.configuredMaxExecutingAccounts ?? form.maxExecutingAccounts }}
        <template v-if="quote?.configuredMaxExecutingAccounts === 0">
          （均分）→ 当前解析 {{ quote.effectiveMaxExecutingAccounts }} 个
        </template>
      </el-descriptions-item>
      <el-descriptions-item label="推广链接"
        ><span class="link-text">{{
          targetLink || "-"
        }}</span></el-descriptions-item
      >
      <el-descriptions-item label="深度追踪">{{
        trackingEnabled ? "已开启" : "未开启"
      }}</el-descriptions-item>
    </el-descriptions>
    <el-table
      v-if="quote && quote.pricingBreakdown.length > 1"
      :data="quote.pricingBreakdown"
      size="small"
      class="breakdown"
    >
      <el-table-column prop="recipientCountryIso2" label="国家" />
      <el-table-column prop="recipientCount" label="人数" />
      <el-table-column prop="unitPrice" label="单价" />
      <el-table-column prop="amount" label="金额" />
    </el-table>
    <el-alert
      v-if="quoteExpired"
      type="error"
      :closable="false"
      title="报价已过期，点击确认后将在当前弹框刷新报价并重新倒计时。"
    />
    <template #footer>
      <el-button @click="visible = false">返回修改</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="seconds > 0"
        @click="emit('confirm')"
      >
        {{
          seconds > 0
            ? `请阅读 ${seconds}s…`
            : quoteExpired
              ? "刷新报价"
              : "确认无误提交"
        }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.balance-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 16px;
  margin: 14px 0;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.balance-row > div {
  display: grid;
  gap: 4px;
}

.balance-row small {
  color: var(--el-text-color-secondary);
}

.review-items,
.breakdown {
  margin-top: 14px;
}

.link-text {
  word-break: break-all;
}
</style>
