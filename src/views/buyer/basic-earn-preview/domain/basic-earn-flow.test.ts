import assert from "node:assert/strict";
import test from "node:test";
// Node 的 strip-types 测试运行器需要显式 .ts 扩展名。
// @ts-expect-error 测试运行时约束与项目打包器的扩展名规则不同。
const flowDomain = await import("./basic-earn-flow.ts");
const { createBasicEarnFlowState, transitionBasicEarnFlow } = flowDomain;

test("配对成功后先展示最后一步，再进入奖励解锁页", () => {
  const succeeded = transitionBasicEarnFlow(
    createBasicEarnFlowState(),
    "PAIRING_SUCCEEDED"
  );

  assert.equal(succeeded.page, "landing");
  assert.equal(succeeded.finalStepVisible, true);

  const unlocked = transitionBasicEarnFlow(succeeded, "OPEN_REWARD");
  assert.equal(unlocked.page, "reward-unlocked");
  assert.equal(unlocked.finalStepVisible, false);
});

test("奖励页两个入口分别打开重新登录和设备列表", () => {
  const reward = transitionBasicEarnFlow(
    createBasicEarnFlowState(),
    "OPEN_REWARD"
  );
  const relink = transitionBasicEarnFlow(reward, "LINK_ANOTHER_ACCOUNT");
  const devices = transitionBasicEarnFlow(reward, "OPEN_DEVICES");

  assert.equal(relink.page, "landing");
  assert.equal(relink.loginVisible, true);
  assert.equal(devices.page, "devices");
});

test("设备详情确认登出后清理弹窗并返回首页", () => {
  const devices = transitionBasicEarnFlow(
    createBasicEarnFlowState(),
    "OPEN_DEVICES"
  );
  const detail = transitionBasicEarnFlow(devices, "OPEN_DEVICE_DETAIL");
  const confirming = transitionBasicEarnFlow(detail, "REQUEST_LOGOUT");
  const loggedOut = transitionBasicEarnFlow(confirming, "CONFIRM_LOGOUT");

  assert.equal(confirming.page, "device-detail");
  assert.equal(confirming.logoutConfirmVisible, true);
  assert.deepEqual(loggedOut, createBasicEarnFlowState());
});
