import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  observationBatchLabel,
  observationTimeLines
} from "./execution-observation-display";
import type { PullTaskExecutionObservation } from "@/api/pull-task";

const observation: PullTaskExecutionObservation = {
  state: "WAIT_RESULT",
  label: "等待结果",
  detail: "本批已提交",
  nextStep: "等待回写",
  observedAt: 91_000,
  waitStartedAt: 1_000,
  nextCheckAt: null,
  nextDispatchAt: null,
  waveNo: 3,
  callSeq: 2,
  plannedCallCount: 5
};

describe("read-only execution observation display", () => {
  it("keeps wave and call progress separate from the business stage", () => {
    assert.equal(
      observationBatchLabel(observation),
      "第 3 轮 / 第 2 批（共 5 批）"
    );
    assert.equal(observationBatchLabel(null), "");
    assert.equal(
      observationBatchLabel({ ...observation, callSeq: null }),
      "第 3 轮"
    );
  });
  it("calculates waiting only at the server snapshot, without client-clock drift", () => {
    assert.deepEqual(observationTimeLines(observation), [
      "截至本次刷新，已等待 1 分 30 秒"
    ]);
    assert.deepEqual(
      observationTimeLines({
        ...observation,
        state: "WAIT_RESOURCE",
        waitStartedAt: null
      }),
      ["等待起点未记录"]
    );
    assert.deepEqual(
      observationTimeLines({
        ...observation,
        state: "FINISHED",
        waitStartedAt: null
      }),
      []
    );
  });
  it("does not invent elapsed time or future execution for missing and overdue facts", () => {
    assert.deepEqual(observationTimeLines(null), []);
    assert.deepEqual(
      observationTimeLines({ ...observation, waitStartedAt: 92_000 }),
      ["等待起点晚于取样时间，暂无法计算"]
    );
    assert.ok(
      observationTimeLines({ ...observation, nextCheckAt: 90_000 }).includes(
        "已到可调度检查时间"
      )
    );
  });
});
