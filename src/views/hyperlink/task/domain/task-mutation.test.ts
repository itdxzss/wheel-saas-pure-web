import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HyperlinkTaskMutationReceipt } from "@/api/hyperlink-task-lifecycle";
import {
  HyperlinkTaskMutationCoordinator,
  isHyperlinkTaskStateConflict
} from "./task-mutation";

describe("hyperlink task mutation coordinator", () => {
  it("polls only PROCESSING receipts and stops at READY", async () => {
    const observed: HyperlinkTaskMutationReceipt[] = [];
    const delays: number[] = [];
    const coordinator = new HyperlinkTaskMutationCoordinator({
      getProvisionStatus: async () => receipt("READY", null),
      onReceipt: value => observed.push(value),
      wait: async milliseconds => {
        delays.push(milliseconds);
      }
    });

    const result = await coordinator.execute(async () =>
      receipt("PROCESSING", 1250)
    );

    assert.equal(result.kind, "COMPLETED");
    assert.deepEqual(delays, [1250]);
    assert.deepEqual(
      observed.map(value => value.provisionStatus),
      ["PROCESSING", "READY"]
    );
  });

  it("surfaces FAILED receipts without another poll", async () => {
    let polls = 0;
    const coordinator = new HyperlinkTaskMutationCoordinator({
      getProvisionStatus: async () => {
        polls += 1;
        return receipt("READY", null);
      }
    });

    const result = await coordinator.execute(async () =>
      receipt("FAILED", null, "准备失败")
    );

    assert.equal(result.kind, "FAILED");
    assert.equal(polls, 0);
  });

  it("coalesces duplicate clicks while the first mutation is pending", async () => {
    let release: (value: HyperlinkTaskMutationReceipt) => void = () =>
      undefined;
    const pending = new Promise<HyperlinkTaskMutationReceipt>(resolve => {
      release = resolve;
    });
    const coordinator = new HyperlinkTaskMutationCoordinator({
      getProvisionStatus: async () => receipt("READY", null)
    });

    const first = coordinator.execute(() => pending);
    const duplicate = await coordinator.execute(async () =>
      receipt("READY", null)
    );
    release(receipt("NOT_REQUIRED", null));

    assert.equal(duplicate.kind, "DUPLICATE");
    assert.equal((await first).kind, "COMPLETED");
  });

  it("returns a stable conflict result for envelope and HTTP-shaped 40910 errors", async () => {
    assert.equal(isHyperlinkTaskStateConflict({ code: 40910 }), true);
    assert.equal(
      isHyperlinkTaskStateConflict({
        code: "ERR_BAD_RESPONSE",
        response: { data: { code: 40910 } }
      }),
      true
    );
    const coordinator = new HyperlinkTaskMutationCoordinator({
      getProvisionStatus: async () => receipt("READY", null)
    });

    const result = await coordinator.execute(async () => {
      throw { code: 40910, message: "任务已被更新" };
    });

    assert.equal(result.kind, "CONFLICT");
  });

  it("cancels a pending preparation poll without applying a later receipt", async () => {
    let releaseWait: () => void = () => undefined;
    const wait = new Promise<void>(resolve => {
      releaseWait = resolve;
    });
    let polls = 0;
    const coordinator = new HyperlinkTaskMutationCoordinator({
      getProvisionStatus: async () => {
        polls += 1;
        return receipt("READY", null);
      },
      wait: async () => wait
    });

    const running = coordinator.execute(async () =>
      receipt("PROCESSING", 1000)
    );
    await Promise.resolve();
    coordinator.cancel();
    releaseWait();

    assert.equal((await running).kind, "CANCELLED");
    assert.equal(polls, 0);
  });
});

function receipt(
  provisionStatus: HyperlinkTaskMutationReceipt["provisionStatus"],
  pollAfterMs: number | null,
  failureReason: string | null = null
): HyperlinkTaskMutationReceipt {
  return {
    taskId: 11,
    provisionStatus,
    enabled: provisionStatus !== "NOT_REQUIRED",
    runStatus: 0,
    version: 3,
    pollAfterMs,
    failureCode: failureReason ? 50310 : null,
    failureReason
  };
}
