import assert from "node:assert/strict";
import test from "node:test";
import {
  canPrepareDeviceReplacement,
  registrationActualCost,
  registrationFailureLabel,
  registrationStateLabel,
  registrationTagType
} from "./registration-display";

test("设备注册超时属于已结束任务，可保存下一笔许可", () => {
  assert.equal(
    canPrepareDeviceReplacement("UNKNOWN", "REGISTRATION_TIMEOUT"),
    true
  );
  assert.equal(canPrepareDeviceReplacement("FAILED", "ANY_FAILURE"), true);
  assert.equal(canPrepareDeviceReplacement("CANCELLED", null), true);
  assert.equal(
    canPrepareDeviceReplacement("UNKNOWN", "PURCHASE_RESULT_UNKNOWN"),
    false
  );
  assert.equal(canPrepareDeviceReplacement("WAITING_CODE", null), false);
});

test("取消中与已确认取消有明确区分，未知原因仍保留", () => {
  assert.equal(registrationStateLabel("CANCELLING"), "等待取消订单");
  assert.equal(registrationTagType("CANCELLING"), "warning");
  assert.equal(
    registrationFailureLabel("PURCHASE_PRICE_MISMATCH_CANCELLED"),
    "成交价不符，购号订单已取消"
  );
  assert.equal(registrationFailureLabel("FUTURE_ERROR"), "FUTURE_ERROR");
});

test("Grizzly 实际金额按 USD 展示并保留原始精度", () => {
  assert.equal(
    registrationActualCost("0.150000000000"),
    "0.150000000000 美元（USD）"
  );
  assert.equal(registrationActualCost(0), "0 美元（USD）");
  assert.equal(registrationActualCost(null), "未返回");
});
