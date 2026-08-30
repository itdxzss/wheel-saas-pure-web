import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createHyperlinkStrategyForm,
  strategyCreatePayload,
  strategyUpdatePayload,
  validateHyperlinkStrategyForm
} from "./strategy-form";

describe("hyperlink strategy form", () => {
  it("creates the competitor-aligned weak preset defaults", () => {
    const form = createHyperlinkStrategyForm([3, 7, 3]);
    assert.equal(form.taskMode, "instant");
    assert.equal(form.maxExecutingAccounts, 10);
    assert.equal(form.maxUseAccounts, 0);
    assert.equal(form.maxSendPerAccount, 0);
    assert.deepEqual(form.accountFilter.groupIds, [3, 7]);
  });

  it("enforces cycle interval, per-round account and concurrency rules", () => {
    const form = createHyperlinkStrategyForm();
    form.name = "周期";
    form.taskMode = "cycle";
    form.cycleIntervalMinutes = 29;
    form.maxUseAccounts = 0;
    assert.equal(
      validateHyperlinkStrategyForm(form),
      "周期策略的每轮最大账号数必须至少为 1"
    );
    form.maxUseAccounts = 5;
    assert.equal(
      validateHyperlinkStrategyForm(form),
      "最大执行账号数不能大于最大使用账号数"
    );
    form.maxExecutingAccounts = 5;
    assert.equal(
      validateHyperlinkStrategyForm(form),
      "周期策略的执行间隔不能小于 30 分钟"
    );
    form.cycleIntervalMinutes = 30;
    assert.equal(validateHyperlinkStrategyForm(form), "");
    form.maxExecutingAccounts = 0;
    assert.equal(validateHyperlinkStrategyForm(form), "");
  });

  it("normalizes non-cycle intervals and carries version only on update", () => {
    const form = createHyperlinkStrategyForm();
    form.name = " 即时稳健 ";
    form.cycleIntervalMinutes = 90;
    const created = strategyCreatePayload(form);
    assert.equal(created.name, "即时稳健");
    assert.equal(created.cycleIntervalMinutes, 0);
    assert.equal("version" in created, false);

    form.version = 4;
    assert.equal(strategyUpdatePayload(form).version, 4);
  });
});
