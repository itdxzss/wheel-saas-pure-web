<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { HyperlinkTaskListItem } from "@/api/hyperlink-task-list";
import {
  actOnHyperlinkTask,
  quoteHyperlinkTask,
  type HyperlinkTaskQuote
} from "@/api/hyperlink-task-lifecycle";
import { apiErrorMessage } from "@/utils/api-error";
import { useTaskMutation } from "../composables/useTaskMutation";

defineOptions({ name: "HyperlinkTaskStartReviewDialog" });

const props = defineProps<{ task: HyperlinkTaskListItem | null }>();
const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (event: "submitted"): void }>();
const mutation = useTaskMutation();
const quote = ref<HyperlinkTaskQuote | null>(null);
const quoteLoading = ref(false);
const errorMessage = ref("");
const seconds = ref(7);
let timer: ReturnType<typeof setInterval> | undefined;

const quoteExpired = computed(
  () => Boolean(quote.value) && (quote.value?.expiresAt ?? 0) <= Date.now()
);
const confirmDisabled = computed(
  () =>
    quoteLoading.value ||
    mutation.submitting.value ||
    !quote.value ||
    seconds.value > 0
);

function stopTimer(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}

function startTimer(): void {
  stopTimer();
  seconds.value = 7;
  timer = setInterval(() => {
    seconds.value = Math.max(0, seconds.value - 1);
    if (seconds.value === 0) stopTimer();
  }, 1000);
}

async function loadQuote(): Promise<void> {
  const task = props.task;
  if (!task) return;
  quoteLoading.value = true;
  quote.value = null;
  errorMessage.value = "";
  stopTimer();
  try {
    quote.value = await quoteHyperlinkTask({
      purpose: "START",
      taskId: task.id,
      dataPackageId: null,
      taskMode: null,
      maxExecutingAccounts: null
    });
    startTimer();
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "启动报价加载失败");
  } finally {
    quoteLoading.value = false;
  }
}

async function confirmStart(): Promise<void> {
  const task = props.task;
  const currentQuote = quote.value;
  if (!task || !currentQuote) return;
  if (quoteExpired.value) {
    ElMessage.warning("报价已过期，请核对更新后的报价");
    await loadQuote();
    return;
  }
  try {
    const result = await mutation.mutate(() =>
      actOnHyperlinkTask(task.id, {
        action: "START",
        version: task.version,
        quoteToken: currentQuote.quoteToken
      })
    );
    if (result.kind === "CONFLICT") {
      errorMessage.value = "任务状态已变化，请关闭弹框刷新列表后重试。";
      return;
    }
    if (result.kind === "FAILED") {
      errorMessage.value = result.receipt.failureReason || "任务准备失败";
      return;
    }
    if (result.kind !== "COMPLETED") return;
    visible.value = false;
    ElMessage.success("任务已启动");
    emit("submitted");
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, "任务启动失败");
  }
}

watch(
  [visible, () => props.task?.id],
  ([opened]) => {
    if (opened) void loadQuote();
    else {
      stopTimer();
      mutation.cancel();
      quote.value = null;
      errorMessage.value = "";
    }
  },
  { immediate: true }
);
onBeforeUnmount(stopTimer);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="启动任务 · 最后核对"
    width="560px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <el-alert
      type="warning"
      show-icon
      :closable="false"
      title="确认报价和发送范围无误后再启动，启动后任务将按策略入队。"
    />
    <el-alert
      v-if="errorMessage"
      class="review-alert"
      type="error"
      show-icon
      :closable="false"
      :title="errorMessage"
    >
      <el-button link type="primary" @click="loadQuote">重新报价</el-button>
    </el-alert>
    <el-skeleton v-if="quoteLoading" :rows="5" animated class="review-body" />
    <template v-else-if="quote">
      <div class="balance-row">
        <div>
          <small>可用余额</small><b>{{ quote.availableBalance }}</b>
        </div>
        <span>→</span>
        <div>
          <small>预计冻结</small><b>{{ quote.estimatedAmount }}</b>
        </div>
        <span>{{ quote.currencyCode }}</span>
      </div>
      <el-descriptions :column="1" border class="review-body">
        <el-descriptions-item label="任务名称">{{
          task?.taskName
        }}</el-descriptions-item>
        <el-descriptions-item label="数据包">{{
          quote.dataPackageName
        }}</el-descriptions-item>
        <el-descriptions-item label="预计收信人">{{
          quote.recipientCount
        }}</el-descriptions-item>
        <el-descriptions-item label="计价模式">{{
          quote.pricingMode === "SUPER" ? "超级模式" : "普通模式"
        }}</el-descriptions-item>
      </el-descriptions>
      <el-table
        v-if="quote.pricingBreakdown.length > 1"
        :data="quote.pricingBreakdown"
        size="small"
        class="review-body"
      >
        <el-table-column prop="recipientCountryIso2" label="国家" />
        <el-table-column prop="recipientCount" label="人数" />
        <el-table-column prop="unitPrice" label="单价" />
        <el-table-column prop="amount" label="金额" />
      </el-table>
      <el-alert
        v-if="quoteExpired"
        class="review-alert"
        type="error"
        :closable="false"
        title="报价已过期，点击确认后会刷新报价并重新倒计时。"
      />
    </template>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="mutation.submitting.value || mutation.provisioning.value"
        :disabled="confirmDisabled"
        @click="confirmStart"
      >
        {{ seconds > 0 ? `请阅读 ${seconds}s…` : "确认启动" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.review-alert,
.review-body {
  margin-top: 14px;
}

.balance-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  margin-top: 14px;
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
</style>
