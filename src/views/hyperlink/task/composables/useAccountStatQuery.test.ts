import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computed, effectScope, ref } from "vue";
import type {
  HyperlinkAccountStatFilter,
  HyperlinkAccountStatQuery,
  HyperlinkTaskExportJob
} from "@/api/hyperlink-task-account-stats";
import { useAccountStatQuery } from "./useAccountStatQuery";

function flush(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe("useAccountStatQuery", () => {
  it("loads, filters, sorts, paginates, exports and exposes errors", async () => {
    const queries: HyperlinkAccountStatQuery[] = [];
    const exports: HyperlinkAccountStatFilter[] = [];
    let fail = false;
    let summaryRefreshes = 0;
    const scope = effectScope();
    const state = scope.run(() =>
      useAccountStatQuery(
        ref(42),
        ref(true),
        () => summaryRefreshes++,
        {
          list: async (_taskId, query) => {
            queries.push({ ...query });
            if (fail) throw new Error("统计接口异常");
            return {
              list: [
                {
                  bucketKey: 0,
                  accountId: null,
                  senderPhone: null,
                  senderCountryIso2: null,
                  accountType: null,
                  retentionDays: 0,
                  successNum: 1,
                  deliveredNum: 0,
                  failedNum: 1,
                  lastSendAt: 1000
                }
              ],
              page: query.page ?? 1,
              pageSize: query.pageSize ?? 20,
              total: 1,
              totalPages: 1
            };
          },
          createExport: async (_taskId, filter) => {
            exports.push({ ...filter });
            return {
              id: 9,
              exportType: "ACCOUNT_STATS",
              status: "PENDING",
              snapshotAt: 1,
              fileName: null,
              rowCount: 0,
              errorMessage: null,
              createdAt: 1,
              finishedAt: null,
              downloadReady: false
            } satisfies HyperlinkTaskExportJob;
          }
        },
        {
          exporting: computed(() => false),
          run: async create => {
            await create();
          }
        }
      )
    );
    assert.ok(state);
    await flush();
    assert.equal(state.rows.value[0].bucketKey, 0);
    assert.deepEqual(queries[0], {
      sortField: "successNum",
      sortOrder: "desc",
      page: 1,
      pageSize: 20
    });

    state.searchForm.timeRange = [1000, 2000];
    state.searchForm.senderCountryIso2 = "br";
    state.searchForm.successRateMin = 50;
    state.searchForm.successRateMax = 90;
    await state.search();
    assert.equal(queries.at(-1)?.senderCountryIso2, "BR");
    assert.equal(queries.at(-1)?.successRateMin, 50);

    await state.onSortChange({ prop: "failedNum", order: "ascending" });
    assert.equal(queries.at(-1)?.sortField, "failedNum");
    assert.equal(queries.at(-1)?.sortOrder, "asc");

    state.page.value = 2;
    state.pageSize.value = 50;
    await state.load();
    assert.equal(queries.at(-1)?.page, 2);
    assert.equal(queries.at(-1)?.pageSize, 50);

    await state.exportCurrent();
    assert.equal(exports[0].senderCountryIso2, "BR");
    assert.equal(exports[0].sortField, "failedNum");

    await state.refresh();
    assert.equal(summaryRefreshes, 1);

    fail = true;
    await state.load();
    assert.match(state.errorMessage.value, /统计接口异常/);
    assert.deepEqual(state.rows.value, []);
    scope.stop();
  });
});
