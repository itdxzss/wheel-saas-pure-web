import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import {
  countHyperlinkTaskAccounts,
  createHyperlinkTask,
  getHyperlinkTask,
  getHyperlinkTaskCreateContext,
  getHyperlinkTaskProvisionStatus,
  listHyperlinkResourceAssets,
  quoteHyperlinkTask,
  updateHyperlinkTask
} from "./hyperlink-task";
import { createEmptyHyperlinkTaskForm } from "@/views/hyperlink/task/domain/editor-rules";

describe("hyperlink task H2/H3 API", () => {
  it("uses the frozen task paths and camelCase wire", async () => {
    resetArmadaMock({});
    const form = createEmptyHyperlinkTaskForm();
    const signal = new AbortController().signal;
    await getHyperlinkTaskCreateContext();
    await getHyperlinkTask(42);
    await countHyperlinkTaskAccounts(form.accountFilter, signal);
    await quoteHyperlinkTask({
      purpose: "CREATE",
      taskId: null,
      dataPackageId: 9,
      taskMode: "instant",
      maxExecutingAccounts: 10,
      maxUseAccounts: 0
    });
    await createHyperlinkTask(form);
    await updateHyperlinkTask(42, { ...form, version: 3 });
    await getHyperlinkTaskProvisionStatus(42);

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url]),
      [
        ["get", "/api/hyperlink-tasks/create-context"],
        ["get", "/api/hyperlink-tasks/42"],
        ["post", "/api/hyperlink-tasks/account-match-count"],
        ["post", "/api/hyperlink-tasks/quote"],
        ["post", "/api/hyperlink-tasks"],
        ["put", "/api/hyperlink-tasks/42"],
        ["get", "/api/hyperlink-tasks/42/provision-status"]
      ]
    );
    assert.equal(
      (armadaCalls()[2].opts as { signal: AbortSignal }).signal,
      signal
    );
  });

  it("uses the shared resource asset endpoints without embedding URLs in DTOs", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });
    await listHyperlinkResourceAssets({ page: 1, keyword: " banner " });
    assert.equal(armadaCalls()[0].url, "/api/resource-assets");
    assert.deepEqual(armadaCalls()[0].opts, {
      params: {
        page: 1,
        pageSize: 20,
        keyword: "banner",
        contentType: "image/jpeg"
      }
    });
  });
});
