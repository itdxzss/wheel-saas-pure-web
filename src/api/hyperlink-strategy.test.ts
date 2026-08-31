import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  countHyperlinkStrategyAccounts,
  createHyperlinkStrategy,
  deleteHyperlinkStrategy,
  getHyperlinkStrategy,
  getHyperlinkStrategyAccountContext,
  listHyperlinkStrategies,
  listHyperlinkStrategyOptionRows,
  updateHyperlinkStrategy,
  type HyperlinkStrategyPayload
} from "./hyperlink-strategy";
import { createEmptyAccountFilter } from "../views/hyperlink/task/domain/editor-rules";

const payload: HyperlinkStrategyPayload = {
  name: "菲律宾稳健",
  taskMode: "cycle",
  accountFilter: createEmptyAccountFilter([10, 20]),
  maxExecutingAccounts: 10,
  maxUseAccounts: 20,
  maxSendPerAccount: 100,
  cycleIntervalMinutes: 60,
  enabled: true
};

describe("hyperlink strategy API", () => {
  it("serializes camelCase list filters without legacy names", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });

    await listHyperlinkStrategies({
      page: 1,
      pageSize: 20,
      name: " 稳健 ",
      taskMode: "cycle",
      enabled: false
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-strategies",
        opts: {
          params: {
            page: 1,
            pageSize: 20,
            name: "稳健",
            taskMode: "cycle",
            enabled: false
          }
        }
      }
    ]);
  });

  it("maps CRUD and versioned update endpoints", async () => {
    resetArmadaMock({ id: 8 });

    await getHyperlinkStrategy(8);
    await createHyperlinkStrategy(payload);
    await updateHyperlinkStrategy(8, { ...payload, version: 3 });
    await deleteHyperlinkStrategy(8);

    assert.deepEqual(armadaCalls(), [
      { method: "get", url: "/api/hyperlink-strategies/8", opts: undefined },
      {
        method: "post",
        url: "/api/hyperlink-strategies",
        opts: { data: payload }
      },
      {
        method: "put",
        url: "/api/hyperlink-strategies/8",
        opts: { data: { ...payload, version: 3 } }
      },
      { method: "delete", url: "/api/hyperlink-strategies/8", opts: undefined }
    ]);
  });

  it("uses lightweight options and wallet-free account endpoints", async () => {
    resetArmadaMock([]);
    await listHyperlinkStrategyOptionRows(" 周期 ");
    await getHyperlinkStrategyAccountContext();
    const controller = new AbortController();
    await countHyperlinkStrategyAccounts(
      payload.accountFilter,
      controller.signal
    );

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-strategies/options",
        opts: { params: { keyword: "周期", limit: 50 } }
      },
      {
        method: "get",
        url: "/api/hyperlink-strategies/account-context",
        opts: undefined
      },
      {
        method: "post",
        url: "/api/hyperlink-strategies/account-match-count",
        opts: {
          data: payload.accountFilter,
          signal: controller.signal
        }
      }
    ]);
  });
});
