import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { BuyerTemplateRow } from "@/api/buyer-template";
import { useBuyerTemplatePage } from "./useBuyerTemplatePage";

function row(overrides: Partial<BuyerTemplateRow> = {}): BuyerTemplateRow {
  return {
    id: 1,
    code: "landing-page",
    name: "落地页模板",
    previewUrl: "https://example.com/preview",
    subaccountVisible: true,
    supportedParams: ["phone"],
    remark: "原备注",
    createdAt: "2026-07-17 10:00:00",
    updatedAt: "2026-07-17 10:00:00",
    ...overrides
  };
}

function pageResult(list: BuyerTemplateRow[]) {
  return { list, page: 1, pageSize: 20, total: list.length, totalPages: 1 };
}

describe("buyer template page state", () => {
  it("rolls visibility back when saving fails", async () => {
    const target = row();
    const page = useBuyerTemplatePage({
      query: async () => pageResult([target]),
      updateVisibility: async () => {
        throw new Error("network failed");
      },
      updateRemark: async () => undefined
    });

    await assert.rejects(
      page.changeVisibility(target, false),
      /network failed/
    );
    assert.equal(target.subaccountVisible, true);
  });

  it("clears untrusted rows and keeps a persistent error when listing fails", async () => {
    const target = row();
    let fail = false;
    const page = useBuyerTemplatePage({
      query: async () => {
        if (fail) throw new Error("forbidden");
        return pageResult([target]);
      },
      updateVisibility: async () => undefined,
      updateRemark: async () => undefined
    });

    await page.refresh();
    fail = true;
    await assert.rejects(page.refresh(), /forbidden/);

    assert.deepEqual(page.rows.value, []);
    assert.equal(page.errorMessage.value, "模板列表加载失败");
  });

  it("rehydrates remarks and trims both text and empty values", async () => {
    const first = row({ id: 1, remark: "第一条" });
    const second = row({ id: 2, remark: "第二条" });
    const saved: Array<[number, string]> = [];
    const page = useBuyerTemplatePage({
      query: async () => pageResult([first, second]),
      updateVisibility: async () => undefined,
      updateRemark: async (id, remark) => {
        saved.push([id, remark]);
      }
    });

    page.openRemark(first);
    page.remarkDraft.value = "未保存";
    page.openRemark(second);
    assert.equal(page.remarkDraft.value, "第二条");

    page.remarkDraft.value = "  新备注  ";
    await page.saveRemark();
    assert.equal(second.remark, "新备注");

    page.openRemark(first);
    page.remarkDraft.value = "   ";
    await page.saveRemark();
    assert.equal(first.remark, "");
    assert.deepEqual(saved, [
      [2, "新备注"],
      [1, ""]
    ]);
  });

  it("rejects remarks longer than 500 characters without saving", async () => {
    let saved = false;
    const target = row();
    const page = useBuyerTemplatePage({
      query: async () => pageResult([target]),
      updateVisibility: async () => undefined,
      updateRemark: async () => {
        saved = true;
      }
    });

    page.openRemark(target);
    page.remarkDraft.value = "x".repeat(501);
    await assert.rejects(page.saveRemark(), /500/);
    assert.equal(saved, false);
    assert.equal(target.remark, "原备注");
  });
});
