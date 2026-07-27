import { computed, onBeforeUnmount, ref } from "vue";
import {
  createPublicPromotionPairingSession,
  getPublicPromotionPairingSessionStatus,
  type PublicPromotionPairingStatus
} from "@/api/public-promotion-channel";
import {
  isTerminalPublicPromotionPairingStatus,
  normalizePublicPromotionPairingPhone,
  resolvePublicPromotionAttribution,
  validatePublicPromotionPairingPhone,
  type PublicPromotionPairingInput
} from "../domain/public-promotion-pairing";

const POLL_INTERVAL_MS = 1500;
const MAX_CONSECUTIVE_POLL_ERRORS = 3;

function readableError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/**
 * 所有公开推广模板共用的 WhatsApp 配对状态机。
 * 视觉弹窗仍由各模板维护，避免不同模板样式互相影响。
 */
export function usePublicPromotionPairing() {
  const status = ref<PublicPromotionPairingStatus | "IDLE">("IDLE");
  const pairingCode = ref("");
  const expiresAt = ref<number>();
  const accountId = ref<number>();
  const errorMessage = ref("");
  const lastInput = ref<PublicPromotionPairingInput>();

  let sessionToken = "";
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let requestVersion = 0;
  let consecutivePollErrors = 0;

  const isBusy = computed(
    () => status.value === "REQUESTING" || status.value === "FINALIZING"
  );

  function clearPollTimer(): void {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = undefined;
  }

  function resetState(): void {
    clearPollTimer();
    sessionToken = "";
    pairingCode.value = "";
    expiresAt.value = undefined;
    accountId.value = undefined;
    errorMessage.value = "";
    consecutivePollErrors = 0;
  }

  function schedulePoll(version: number): void {
    clearPollTimer();
    pollTimer = setTimeout(() => void poll(version), POLL_INTERVAL_MS);
  }

  async function poll(version: number): Promise<void> {
    if (version !== requestVersion || !sessionToken) return;
    try {
      const result = await getPublicPromotionPairingSessionStatus(sessionToken);
      if (version !== requestVersion) return;
      consecutivePollErrors = 0;
      status.value = result.status;
      expiresAt.value = result.expiresAt ?? undefined;
      accountId.value = result.accountId ?? undefined;
      errorMessage.value = result.errorMessage ?? "";
      pairingCode.value =
        result.status === "WAITING_CONFIRMATION"
          ? (result.pairingCode ?? "")
          : "";

      if (!isTerminalPublicPromotionPairingStatus(result.status)) {
        schedulePoll(version);
      }
    } catch (error) {
      if (version !== requestVersion) return;
      consecutivePollErrors += 1;
      if (consecutivePollErrors < MAX_CONSECUTIVE_POLL_ERRORS) {
        schedulePoll(version);
        return;
      }
      status.value = "FAILED";
      pairingCode.value = "";
      errorMessage.value = readableError(error, "配对状态查询失败，请重试");
    }
  }

  async function start(input: PublicPromotionPairingInput): Promise<void> {
    if (isBusy.value) return;
    const version = ++requestVersion;
    resetState();
    lastInput.value = { ...input };
    status.value = "REQUESTING";

    const normalizedPhone = normalizePublicPromotionPairingPhone(
      input.dialCode,
      input.phone
    );
    const validationMessage =
      validatePublicPromotionPairingPhone(normalizedPhone);
    if (validationMessage) {
      status.value = "FAILED";
      errorMessage.value = validationMessage;
      return;
    }

    try {
      const attribution =
        typeof document === "undefined" || typeof window === "undefined"
          ? {}
          : resolvePublicPromotionAttribution(
              document.cookie,
              window.location.href,
              Date.now()
            );
      const created = await createPublicPromotionPairingSession(
        input.channelCode,
        normalizedPhone,
        attribution
      );
      if (version !== requestVersion) return;
      if (!created.sessionToken) {
        throw new Error("后端未返回配对会话令牌");
      }
      sessionToken = created.sessionToken;
      status.value = created.status;
      expiresAt.value = created.expiresAt;
      await poll(version);
    } catch (error) {
      if (version !== requestVersion) return;
      status.value = "FAILED";
      errorMessage.value = readableError(error, "创建配对会话失败，请重试");
    }
  }

  async function retry(): Promise<void> {
    if (!lastInput.value) return;
    await start(lastInput.value);
  }

  function cancel(): void {
    requestVersion += 1;
    resetState();
    status.value = "IDLE";
  }

  onBeforeUnmount(cancel);

  return {
    status,
    pairingCode,
    expiresAt,
    accountId,
    errorMessage,
    isBusy,
    start,
    retry,
    cancel
  };
}
