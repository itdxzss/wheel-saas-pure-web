import assert from "node:assert/strict";
import test from "node:test";
import {
  adminStageLabel,
  approvalProgressLabel,
  cleanupStageLabel,
  joinStepStatus
} from "./admin-stage";

test("待审核显示真实处理阶段，正常进群和终态不显示处理中", () => {
  const row = { status: "PENDING", isAdmin: false, approvalStatus: "CLOSE" };
  assert.equal(approvalProgressLabel(row), "正在关闭审核");
  assert.equal(adminStageLabel(row, true), "等待进群成功");
  assert.equal(
    approvalProgressLabel({ ...row, approvalStatus: "VERIFY" }),
    "正在确认进群结果"
  );
  assert.equal(
    approvalProgressLabel({ ...row, approvalStatus: "" }),
    undefined
  );
  assert.equal(approvalProgressLabel({ ...row, status: "FAILED" }), undefined);
  assert.equal(approvalProgressLabel({ ...row, status: "SUCCESS" }), undefined);
});

test("设置失败保留进群成功，但步骤必须失败", () => {
  const row = {
    status: "SUCCESS",
    isAdmin: false,
    adminStatus: "FAILED",
    stepStatus: "FAILED"
  };
  assert.equal(adminStageLabel(row, true), "失败");
  assert.equal(joinStepStatus(row, true), "FAILED");
});

test("等待设置结果不能把入群成功当成整步成功", () => {
  const row = { status: "SUCCESS", isAdmin: false, adminStatus: "SUBMITTED" };
  assert.equal(adminStageLabel(row, true), "设置中");
  assert.equal(joinStepStatus(row, true), "PENDING");
  assert.equal(joinStepStatus(row, false), "SUCCESS");
});

test("未开启、进群失败与等待进群分别展示", () => {
  assert.equal(
    adminStageLabel({ status: "FAILED", isAdmin: false }, true),
    "未执行"
  );
  assert.equal(
    adminStageLabel({ status: "PENDING", isAdmin: false }, true),
    "等待进群成功"
  );
  assert.equal(
    adminStageLabel({ status: "SUCCESS", isAdmin: false }, false),
    "未开启"
  );
});

test("提权成功后清理尚未完成或失败，不能展示整步成功", () => {
  const row = {
    status: "SUCCESS",
    isAdmin: true,
    adminStatus: "SUCCESS",
    cleanupStatus: "REMOVING",
    stepStatus: "PENDING"
  };
  assert.equal(adminStageLabel(row, true), "成功");
  assert.equal(cleanupStageLabel(row), "正在踢出管理员");
  assert.equal(joinStepStatus(row, true), "PENDING");
  assert.equal(
    cleanupStageLabel({ ...row, cleanupStatus: "FAILED" }),
    "失败，后续已停止"
  );
  assert.equal(
    joinStepStatus({ ...row, stepStatus: "FAILED" }, true),
    "FAILED"
  );
  assert.equal(cleanupStageLabel({ ...row, adminStatus: "FAILED" }), "未执行");
});
