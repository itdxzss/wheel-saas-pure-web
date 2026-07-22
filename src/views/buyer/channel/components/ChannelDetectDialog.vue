<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BuyerChannelRow, ChannelDetectResult } from "@/api/buyer-channel";

const props = defineProps<{
  modelValue: boolean;
  channel: BuyerChannelRow | null;
  loading: boolean;
  result: ChannelDetectResult | null;
  errorMessage: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "probe", testEventCode?: string): void;
}>();

const testEventCode = ref("");

const isFacebook = computed(() => props.channel?.platform === "FACEBOOK");

watch(
  () => [props.modelValue, props.channel?.id],
  ([visible]) => {
    if (visible) {
      testEventCode.value = "";
    }
  }
);

function formatProbeTime(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("zh-CN", { hour12: false });
}

function submit(): void {
  const value = testEventCode.value.trim();
  emit("probe", value || undefined);
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="渠道 CAPI 探测"
    width="min(620px, calc(100vw - 24px))"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-alert
      v-if="channel"
      class="probe-channel"
      :title="`${channel.name} · ${channel.channelCode}`"
      :description="`推广平台：${channel.platform}`"
      type="info"
      show-icon
      :closable="false"
    />

    <el-form v-if="isFacebook" label-position="top" @submit.prevent>
      <el-form-item label="Meta Test Event Code">
        <el-input
          v-model="testEventCode"
          :disabled="loading"
          maxlength="128"
          clearable
          placeholder="请输入 Meta Events Manager 生成的测试事件码"
          @keyup.enter="submit"
        />
      </el-form-item>
      <el-text type="info">
        Facebook 配置完整、需要真实调用 Meta
        时测试事件码必填；配置不完整时可留空查看诊断。Pixel ID 与 Access Token
        由后端读取，前端不会展示或回传 Token。
      </el-text>
    </el-form>
    <el-alert
      v-else
      title="当前后端仅支持 Facebook CAPI 真实探测"
      description="仍可发起请求并查看后端返回的不支持原因。"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-alert
      v-if="errorMessage"
      class="probe-error"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <template v-if="result">
      <el-result
        :icon="result.success ? 'success' : 'error'"
        :title="result.success ? '探测通过' : '探测未通过'"
        :sub-title="
          result.success
            ? '测试事件已成功发送并完成状态更新'
            : result.errorMessage || '后端返回探测失败'
        "
      />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="状态">
          <el-tag :type="result.success ? 'success' : 'danger'">
            {{ result.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Pixel / Tracking ID">
          {{ result.trackingId || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="Access Token">
          {{ result.accessTokenConfigured ? "已配置" : "未配置" }}
        </el-descriptions-item>
        <el-descriptions-item label="测试事件">
          {{ result.eventName || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="事件 ID">
          {{ result.eventId || "-" }}
        </el-descriptions-item>
        <el-descriptions-item v-if="result.errorCode" label="错误码">
          {{ result.errorCode }}
        </el-descriptions-item>
        <el-descriptions-item label="探测时间">
          {{ formatProbeTime(result.probedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </template>

    <template #footer>
      <el-button :disabled="loading" @click="$emit('update:modelValue', false)">
        关闭
      </el-button>
      <el-button type="primary" :loading="loading" @click="submit">
        {{ result ? "重新探测" : "开始探测" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.probe-channel,
.probe-error,
.el-form,
.el-result {
  margin-bottom: 18px;
}

.el-form {
  margin-top: 18px;
}
</style>
