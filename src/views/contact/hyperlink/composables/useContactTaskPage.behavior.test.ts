import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { createSSRApp } from "vue";
import { renderToString } from "vue/server-renderer";
import { ElMessageBox } from "../../../../api/__tests__/element-plus-test-double";
import {
  armadaCalls,
  resetArmadaMock,
  resetArmadaMockQueue,
  resetArmadaMockFailure
} from "../../../../api/__tests__/armada-test-double";
import { useContactTaskPage } from "./useContactTaskPage";
import { canDeleteTask } from "../domain/task-status";
import {
  messageCalls,
  resetMessageMock
} from "../../../../api/__tests__/message-test-double";
import type { ContactTaskListItem } from "../../../../api/contact-task";

async function setupPage() {
  let page: ReturnType<typeof useContactTaskPage>;
  await renderToString(
    createSSRApp({
      setup() {
        page = useContactTaskPage();
        return () => null;
      }
    })
  );
  return page;
}
const row = (id: number, runStatus = 0) =>
  ({ id, runStatus, name: `任务 ${id}` }) as ContactTaskListItem;
const result = (list: ContactTaskListItem[], total = list.length) => ({
  list,
  total
});
afterEach(() => mock.restoreAll());

describe("contact task batch deletion behavior", () => {
  it("allows only not-started, completed and stopped tasks", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 99].map(canDeleteTask), [
      true,
      false,
      true,
      false,
      true,
      false
    ]);
  });

  it("selects only deletable rows and sends no request for an empty selection", async () => {
    const page = await setupPage();
    resetArmadaMock(null);
    await page.deleteSelected();
    assert.equal(armadaCalls().length, 0);
    page.onSelectionChange([row(1), row(2, 1), row(3, 2), row(4, 3)]);
    assert.deepEqual(
      page.selectedRows.value.map(r => r.id),
      [1, 3]
    );
  });

  it("canceling confirmation leaves selection intact and never deletes", async () => {
    const page = await setupPage();
    resetArmadaMock(null);
    page.onSelectionChange([row(1)]);
    mock.method(ElMessageBox, "confirm", () => Promise.reject("cancel"));
    await page.deleteSelected();
    assert.equal(armadaCalls().length, 0);
    assert.equal(page.selectedRows.value.length, 1);
    assert.equal(page.deleting.value, false);
  });

  it("freezes confirmed IDs, prevents double submission and reloads after deletion", async () => {
    const page = await setupPage();
    page.onSelectionChange([row(1), row(3, 2)]);
    let confirm: () => void;
    mock.method(
      ElMessageBox,
      "confirm",
      () =>
        new Promise<void>(resolve => {
          confirm = resolve;
        })
    );
    resetArmadaMockQueue([2, result([row(7)])]);
    const first = page.deleteSelected();
    await page.deleteSelected();
    assert.equal(armadaCalls().length, 0);
    confirm();
    await first;
    assert.deepEqual(armadaCalls()[0].opts, { data: { ids: [1, 3] } });
    assert.equal(armadaCalls().filter(c => c.method === "post").length, 1);
    assert.equal(page.selectedRows.value.length, 0);
    assert.equal(page.rows.value[0].id, 7);
    assert.equal(page.deleting.value, false);
  });

  it("returns to the last valid page when deletion empties the current page", async () => {
    const page = await setupPage();
    page.page.value = 3;
    page.onSelectionChange([row(41)]);
    resetArmadaMockQueue([1, result([], 40), result([row(21)], 40)]);
    await page.deleteSelected();
    assert.equal(page.page.value, 2);
    assert.equal(page.rows.value[0].id, 21);
    assert.equal(armadaCalls().length, 3);
  });

  it("keeps rows and selection on server rejection and clears the busy flag", async () => {
    const page = await setupPage();
    page.rows.value = [row(1)];
    page.onSelectionChange(page.rows.value);
    resetArmadaMockFailure(new Error("任务已开始，请先停止"));
    resetMessageMock();
    await page.deleteSelected();
    assert.equal(page.rows.value.length, 1);
    assert.equal(page.selectedRows.value.length, 1);
    assert.equal(page.deleting.value, false);
    assert.equal(armadaCalls().length, 1);
    assert.equal(messageCalls()[0].text, "任务已开始，请先停止");
  });

  it("clears both logical selection and table checkboxes on every reload", async () => {
    const page = await setupPage();
    let cleared = 0;
    page.tableRef.value = {
      clearSelection: () => {
        cleared++;
      }
    } as typeof page.tableRef.value;
    page.onSelectionChange([row(1)]);
    resetArmadaMock(result([row(2)]));
    await page.load();
    assert.equal(cleared, 1);
    assert.equal(page.selectedRows.value.length, 0);
  });
  it("ignores a late response from the previously selected page", async () => {
    const page = await setupPage();
    let finishOld: (value: ReturnType<typeof result>) => void;
    const oldResponse = new Promise(resolve => {
      finishOld = resolve;
    });
    resetArmadaMockQueue([oldResponse, result([row(21)], 40)]);
    const oldLoad = page.load();
    page.page.value = 2;
    await page.load();
    finishOld(result([row(1)], 40));
    await oldLoad;
    assert.equal(page.rows.value[0].id, 21);
    assert.equal(page.page.value, 2);
    assert.equal(page.loading.value, false);
  });
});
