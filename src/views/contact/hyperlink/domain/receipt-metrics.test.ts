import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  receiptCsv,
  metricRate,
  processedPercent,
  receiptLabel,
  receiptQuery,
  needsReceiptRefresh
} from "./receipt-metrics";
import type { ContactTaskMetrics, ContactTaskStats } from "@/api/contact-task";

export const metrics: ContactTaskMetrics = {
  scopeId: 1,
  plannedNum: 100,
  attemptedNum: 95,
  confirmedNum: 80,
  deliveredNum: 60,
  readNum: 25,
  failedNum: 10,
  unknownNum: 5,
  skippedNum: 5,
  processedNum: 100,
  pendingNum: 0,
  sendingNum: 0,
  inconsistentNum: 0
};

describe("contact receipt metrics", () => {
  it("separates completed processing from delivery and avoids zero denominator claims", () => {
    assert.equal(processedPercent(metrics), 100);
    assert.equal(
      metricRate(metrics.deliveredNum, metrics.confirmedNum),
      "75.00%"
    );
    assert.equal(metricRate(metrics.readNum, metrics.deliveredNum), "41.67%");
    assert.equal(metricRate(0, 0), "—");
    assert.equal(processedPercent(undefined), null);
    assert.equal(processedPercent({ ...metrics, plannedNum: 0 }), null);
    assert.equal(processedPercent({ ...metrics, inconsistentNum: 1 }), null);
  });
  it("exports the same receipt and account facts without inventing missing zeros", () => {
    const stats = {
      taskId: 1,
      runStatus: 2,
      metrics,
      accounts: {
        taskId: 1,
        selectedAccountNum: 2,
        preparingAccountNum: 0,
        readyAccountNum: 2,
        failedAccountNum: 1
      },
      reasons: []
    } as ContactTaskStats;
    const csv = receiptCsv(stats);
    assert.equal(csv.已处理条数, 100);
    assert.equal(csv.累计发送确认, 80);
    assert.equal(csv.送达率, "75.00%");
    assert.equal(csv.送达后已读率, "41.67%");
    assert.equal(csv.执行异常账号数, 1);
    assert.equal(receiptCsv().累计发送确认, "");
    assert.equal(receiptCsv().送达率, "—");
  });
  it("never turns an unknown result into a single check", () => {
    assert.equal(
      receiptLabel({ sendStatus: "UNKNOWN", deliveredAt: null, readAt: null }),
      "尚无确认回执"
    );
    assert.equal(
      receiptLabel({ sendStatus: "SUCCESS", deliveredAt: 100, readAt: 200 }),
      "✓✓ 已读"
    );
  });
  it("distinguishes cumulative and mutually exclusive receipt filters", () => {
    assert.deepEqual(receiptQuery("SINGLE_ONLY"), {
      receiptStatus: "SINGLE_ONLY"
    });
    assert.deepEqual(receiptQuery("DELIVERED"), { receiptStatus: "DELIVERED" });
    assert.deepEqual(receiptQuery("UNKNOWN"), { sendStatus: "UNKNOWN" });
    assert.deepEqual(receiptQuery("ALL"), {});
  });
  it("continues observing late receipts after completion", () => {
    const stats = { runStatus: 2, metrics } as ContactTaskStats;
    assert.equal(needsReceiptRefresh(stats), true);
    assert.equal(
      needsReceiptRefresh({
        ...stats,
        metrics: { ...metrics, unknownNum: 0, deliveredNum: 80, readNum: 80 }
      }),
      false
    );
    assert.equal(needsReceiptRefresh(undefined), false);
  });
});
