<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import type { AccountGroupApiRow } from "@/api/account-group";
import {
  createControlPairingSession,
  getControlPairingSession,
  type ControlPairingStatus
} from "@/api/account-pairing";
import { apiErrorMessage } from "@/utils/api-error";

defineOptions({ name: "AccountPairingDialog" });

defineProps<{
  groups: AccountGroupApiRow[];
  groupLoading: boolean;
}>();

const emit = defineEmits<{
  (event: "success", accountId: number): void;
}>();

const visible = defineModel<boolean>({ default: false });
const formRef = ref<FormInstance>();
const form = reactive({
  phone: "",
  accountGroupId: undefined as number | undefined,
  remark: ""
});
const status = ref<ControlPairingStatus | "IDLE">("IDLE");
const pairingCode = ref("");
const expiresAt = ref<number>();
const accountId = ref<number>();
const errorMessage = ref("");
const submitting = ref(false);
let sessionId: number | undefined;
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let pollVersion = 0;
let consecutivePollErrors = 0;

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ERRORS = 3;
const active = computed(() =>
  ["REQUESTING", "WAITING_CONFIRMATION", "FINALIZING"].includes(status.value)
);
const formattedPairingCode = computed(() => {
  const code = pairingCode.value.replace(/\s/g, "");
  return code.length === 8 ? `${code.slice(0, 4)} ${code.slice(4)}` : code;
});
const expiryLabel = computed(() =>
  expiresAt.value ? new Date(expiresAt.value).toLocaleTimeString() : ""
);
const rules: FormRules = {
  phone: [
    { required: true, message: "请输入完整国际手机号", trigger: "blur" },
    {
      pattern: /^[1-9][0-9]{9,14}$/,
      message: "请输入 10～15 位数字，不要输入 +、空格或横线",
      trigger: "blur"
    }
  ],
  accountGroupId: [
    { required: true, message: "请选择账号分组", trigger: "change" }
  ]
};

function stopPolling(): void {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = undefined;
}

function isTerminal(value: ControlPairingStatus): boolean {
  return value === "SUCCEEDED" || value === "FAILED" || value === "EXPIRED";
}

function schedulePoll(version: number): void {
  stopPolling();
  pollTimer = setTimeout(() => void poll(version), POLL_INTERVAL_MS);
}

async function poll(version: number): Promise<void> {
  if (version !== pollVersion || !sessionId) return;
  try {
    const result = await getControlPairingSession(sessionId);
    if (version !== pollVersion) return;
    consecutivePollErrors = 0;
    status.value = result.status;
    pairingCode.value = result.pairingCode ?? "";
    expiresAt.value = result.expiresAt;
    errorMessage.value = result.errorMessage ?? "";
    accountId.value = result.accountId ?? undefined;
    if (result.status === "SUCCEEDED" && result.accountId) {
      ElMessage.success("认证码登录成功，账号已导入");
      emit("success", result.accountId);
    }
    if (visible.value && !isTerminal(result.status)) schedulePoll(version);
  } catch (error) {
    if (version !== pollVersion) return;
    consecutivePollErrors += 1;
    if (consecutivePollErrors < MAX_POLL_ERRORS) {
      schedulePoll(version);
      return;
    }
    status.value = "FAILED";
    errorMessage.value = apiErrorMessage(error, "配对状态查询失败，请重试");
  }
}

async function submit(): Promise<void> {
  if (!(await formRef.value?.validate().catch(() => false))) return;
  if (!form.accountGroupId || submitting.value) return;
  stopPolling();
  const version = ++pollVersion;
  submitting.value = true;
  status.value = "REQUESTING";
  pairingCode.value = "";
  errorMessage.value = "";
  accountId.value = undefined;
  try {
    const created = await createControlPairingSession({
      phone: form.phone.trim(),
      accountGroupId: form.accountGroupId,
      remark: form.remark.trim() || null
    });
    if (version !== pollVersion) return;
    sessionId = created.sessionId;
    status.value = created.status;
    expiresAt.value = created.expiresAt;
    if (visible.value) await poll(version);
  } catch (error) {
    if (version !== pollVersion) return;
    status.value = "FAILED";
    errorMessage.value = apiErrorMessage(error, "认证码登录请求失败，请重试");
  } finally {
    submitting.value = false;
  }
}

function retry(): void {
  stopPolling();
  pollVersion += 1;
  sessionId = undefined;
  status.value = "IDLE";
  pairingCode.value = "";
  errorMessage.value = "";
  accountId.value = undefined;
}

async function copyCode(): Promise<void> {
  if (!pairingCode.value) return;
  try {
    await navigator.clipboard.writeText(pairingCode.value);
    ElMessage.success("认证码已复制");
  } catch {
    ElMessage.error("复制失败，请手动输入认证码");
  }
}

watch(visible, opened => {
  if (!opened) {
    stopPolling();
    return;
  }
  if (sessionId && active.value) {
    const version = ++pollVersion;
    void poll(version);
  }
});

onBeforeUnmount(stopPolling);
</script>

<template>
  <el-dialog
    v-model="visible"
    title="认证码登录导号"
    width="560px"
    :close-on-click-modal="false"
    :destroy-on-close="false"
  >
    <el-form
      v-if="status === 'IDLE'"
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="92px"
    >
      <el-alert
        class="pairing-alert"
        title="主设备无需交给控台操作人员"
        description="主设备持有人只需在 WhatsApp 的关联设备中选择“使用手机号关联”，再输入控台生成的认证码。"
        type="info"
        show-icon
        :closable="false"
      />
      <el-form-item label="国际手机号" prop="phone">
        <el-input
          v-model="form.phone"
          maxlength="15"
          placeholder="例如 919876543210（不含 + 号）"
        />
      </el-form-item>
      <el-form-item label="账号分组" prop="accountGroupId">
        <el-select
          v-model="form.accountGroupId"
          filterable
          :loading="groupLoading"
          placeholder="请选择导入后的账号分组"
          class="pairing-full-width"
        >
          <el-option
            v-for="group in groups"
            :key="group.id"
            :label="group.name"
            :value="group.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          maxlength="255"
          show-word-limit
          placeholder="可选"
        />
      </el-form-item>
    </el-form>

    <div v-else class="pairing-state">
      <template v-if="status === 'REQUESTING'">
        <el-icon class="is-loading pairing-spinner" :size="38">
          <Loading />
        </el-icon>
        <h3>正在向 WhatsApp 申请认证码</h3>
        <p>通常几秒内完成，请保持弹窗打开。</p>
      </template>

      <template v-else-if="status === 'WAITING_CONFIRMATION'">
        <el-tag type="success" effect="plain">等待主设备确认</el-tag>
        <p class="pairing-hint">本功能固定认证码为 8888 8888</p>
        <button class="pairing-code" type="button" @click="copyCode">
          {{ formattedPairingCode }}
        </button>
        <p v-if="expiryLabel">有效期至 {{ expiryLabel }}</p>
        <ol>
          <li>主设备打开 WhatsApp → 设置 → 关联设备</li>
          <li>点击“关联设备”，再选择“使用手机号关联”</li>
          <li>输入上面的 8 位认证码并确认</li>
        </ol>
      </template>

      <template v-else-if="status === 'FINALIZING'">
        <el-icon class="is-loading pairing-spinner" :size="38">
          <Loading />
        </el-icon>
        <h3>主设备已确认，正在导入账号</h3>
        <p>正在保存凭据并绑定代理，请勿重复发起。</p>
      </template>

      <el-result
        v-else-if="status === 'SUCCEEDED'"
        icon="success"
        title="认证码登录成功"
        :sub-title="`账号 ID：${accountId ?? '-'}`"
      />

      <el-result
        v-else
        icon="error"
        :title="status === 'EXPIRED' ? '认证码已过期' : '认证码登录失败'"
        :sub-title="errorMessage || '请确认手机号和主设备操作后重试'"
      />
    </div>

    <template #footer>
      <template v-if="status === 'IDLE'">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">
          生成认证码
        </el-button>
      </template>
      <template v-else-if="status === 'FAILED' || status === 'EXPIRED'">
        <el-button @click="visible = false">关闭</el-button>
        <el-button type="primary" @click="retry">重新发起</el-button>
      </template>
      <el-button
        v-else-if="status === 'SUCCEEDED'"
        type="primary"
        @click="visible = false"
      >
        完成
      </el-button>
      <el-button v-else @click="visible = false">暂时关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.pairing-alert {
  margin-bottom: 20px;
}

.pairing-full-width {
  width: 100%;
}

.pairing-state {
  min-height: 260px;
  padding: 24px;
  text-align: center;
}

.pairing-state h3 {
  margin: 14px 0 8px;
  font-size: 18px;
}

.pairing-state p,
.pairing-state ol {
  color: var(--el-text-color-secondary);
}

.pairing-spinner {
  color: var(--el-color-primary);
}

.pairing-hint {
  margin: 18px 0 8px;
}

.pairing-code {
  padding: 12px 24px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 32px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: 4px;
  cursor: pointer;
  background: var(--el-color-primary-light-9);
  border: 1px dashed var(--el-color-primary);
  border-radius: 8px;
}

.pairing-state ol {
  display: inline-block;
  margin: 24px auto 0;
  text-align: left;
}

.pairing-state li + li {
  margin-top: 8px;
}
</style>
