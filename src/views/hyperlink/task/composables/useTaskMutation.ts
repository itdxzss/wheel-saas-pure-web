import {
  getHyperlinkTaskProvisionStatus,
  type HyperlinkTaskMutationReceipt
} from "@/api/hyperlink-task-lifecycle";
import {
  HyperlinkTaskMutationCoordinator,
  type HyperlinkTaskMutationResult
} from "@/views/hyperlink/task/domain/task-mutation";
import { onScopeDispose, ref } from "vue";

/** H1/H2 可复用的 H3 提交状态，不包含页面、抽屉或表单决策。 */
export function useTaskMutation() {
  const receipt = ref<HyperlinkTaskMutationReceipt | null>(null);
  const submitting = ref(false);
  const provisioning = ref(false);
  const conflict = ref<unknown>(null);
  const failureReason = ref<string | null>(null);
  const coordinator = new HyperlinkTaskMutationCoordinator({
    getProvisionStatus: getHyperlinkTaskProvisionStatus,
    onReceipt: next => {
      receipt.value = next;
      provisioning.value = next.provisionStatus === "PROCESSING";
      failureReason.value =
        next.provisionStatus === "FAILED" ? next.failureReason : null;
    }
  });

  async function mutate(
    operation: () => Promise<HyperlinkTaskMutationReceipt>
  ): Promise<HyperlinkTaskMutationResult> {
    conflict.value = null;
    failureReason.value = null;
    const wasRunning = coordinator.isRunning;
    if (!wasRunning) submitting.value = true;
    try {
      const result = await coordinator.execute(operation);
      if (result.kind === "CONFLICT") conflict.value = result.error;
      return result;
    } finally {
      if (!wasRunning) {
        submitting.value = false;
        provisioning.value = false;
      }
    }
  }

  function cancel(): void {
    coordinator.cancel();
    submitting.value = false;
    provisioning.value = false;
  }

  onScopeDispose(cancel);

  return {
    receipt,
    submitting,
    provisioning,
    conflict,
    failureReason,
    mutate,
    cancel
  };
}
