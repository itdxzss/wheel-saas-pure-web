import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyAccountStatSearchForm,
  normalizedAccountStatSort,
  toAccountStatFilter,
  validateAccountStatSearch
} from "./account-stats";

describe("account stats query domain", () => {
  it("builds the time, country, success-rate and sort contract", () => {
    const filter = toAccountStatFilter(
      {
        timeRange: [1000, 2000],
        senderCountryIso2: " br ",
        successRateMin: 60.5,
        successRateMax: 95
      },
      "deliveredNum",
      "asc"
    );

    assert.deepEqual(filter, {
      startAt: 1000,
      endAt: 2000,
      senderCountryIso2: "BR",
      successRateMin: 60.5,
      successRateMax: 95,
      sortField: "deliveredNum",
      sortOrder: "asc"
    });
  });

  it("rejects invalid success rates and reversed ranges", () => {
    const form = emptyAccountStatSearchForm();
    form.successRateMin = 90;
    form.successRateMax = 80;
    assert.match(validateAccountStatSearch(form) ?? "", /最小值不能大于最大值/);
    form.successRateMax = 101;
    assert.match(validateAccountStatSearch(form) ?? "", /0 到 100/);
    form.successRateMin = 10;
    form.successRateMax = 20;
    form.timeRange = [3000, 2000];
    assert.match(
      validateAccountStatSearch(form) ?? "",
      /开始时间必须早于结束时间/
    );
  });

  it("restores competitor-compatible default sorting when sorting is cleared", () => {
    assert.deepEqual(normalizedAccountStatSort(null, null), {
      sortField: "successNum",
      sortOrder: "desc"
    });
    assert.deepEqual(normalizedAccountStatSort("failedNum", "ascending"), {
      sortField: "failedNum",
      sortOrder: "asc"
    });
  });
});
