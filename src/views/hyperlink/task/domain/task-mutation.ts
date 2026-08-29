import type { HyperlinkTaskMutationReceipt } from "@/api/hyperlink-task-lifecycle";

export const HYPERLINK_TASK_STATE_CONFLICT = 40910;
const DEFAULT_POLL_AFTER_MS = 1_000;

interface BusinessErrorLike {
  code?: unknown;
  response?: { data?: { code?: unknown } };
}

export function hyperlinkBusinessErrorCode(error: unknown): number | null {
  const candidate = error as BusinessErrorLike | undefined;
  if (typeof candidate?.code === "number") return candidate.code;
  const responseCode = candidate?.response?.data?.code;
  return typeof responseCode === "number" ? responseCode : null;
}

export function isHyperlinkTaskStateConflict(error: unknown): boolean {
  return hyperlinkBusinessErrorCode(error) === HYPERLINK_TASK_STATE_CONFLICT;
}

export type HyperlinkTaskMutationResult =
  | { kind: "COMPLETED"; receipt: HyperlinkTaskMutationReceipt }
  | { kind: "FAILED"; receipt: HyperlinkTaskMutationReceipt }
  | { kind: "CONFLICT"; error: unknown }
  | { kind: "DUPLICATE" }
  | { kind: "CANCELLED"; receipt: HyperlinkTaskMutationReceipt | null };

export interface HyperlinkTaskMutationCoordinatorOptions {
  getProvisionStatus: (taskId: number) => Promise<HyperlinkTaskMutationReceipt>;
  onReceipt?: (receipt: HyperlinkTaskMutationReceipt) => void;
  wait?: (milliseconds: number) => Promise<void>;
}

/** 单次提交、PROCESSING 回执轮询、重复点击和 40910 的无 UI 公共编排。 */
export class HyperlinkTaskMutationCoordinator {
  private generation = 0;
  private running = false;
  private readonly options: HyperlinkTaskMutationCoordinatorOptions;

  constructor(options: HyperlinkTaskMutationCoordinatorOptions) {
    this.options = options;
  }

  get isRunning(): boolean {
    return this.running;
  }

  cancel(): void {
    this.generation += 1;
    this.running = false;
  }

  async execute(
    mutation: () => Promise<HyperlinkTaskMutationReceipt>
  ): Promise<HyperlinkTaskMutationResult> {
    if (this.running) return { kind: "DUPLICATE" };
    this.running = true;
    const generation = ++this.generation;
    let receipt: HyperlinkTaskMutationReceipt | null = null;
    try {
      receipt = await mutation();
      this.options.onReceipt?.(receipt);
      while (receipt.provisionStatus === "PROCESSING") {
        await (this.options.wait ?? wait)(
          receipt.pollAfterMs ?? DEFAULT_POLL_AFTER_MS
        );
        if (generation !== this.generation) {
          return { kind: "CANCELLED", receipt };
        }
        receipt = await this.options.getProvisionStatus(receipt.taskId);
        this.options.onReceipt?.(receipt);
      }
      return receipt.provisionStatus === "FAILED"
        ? { kind: "FAILED", receipt }
        : { kind: "COMPLETED", receipt };
    } catch (error) {
      if (isHyperlinkTaskStateConflict(error)) {
        return { kind: "CONFLICT", error };
      }
      throw error;
    } finally {
      if (generation === this.generation) this.running = false;
    }
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, milliseconds)));
}
