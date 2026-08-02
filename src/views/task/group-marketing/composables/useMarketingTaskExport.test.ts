import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { effectScope, ref } from "vue";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type {
  MarketingTaskExportCountry,
  MarketingTaskExportFile,
  MarketingTaskExportJob
} from "@/api/marketing-task-export";
import type { MarketingTaskRow } from "@/api/marketing-task";
import {
  useMarketingTaskExport,
  type MarketingTaskExportDependencies
} from "./useMarketingTaskExport";

function row(id: number): MarketingTaskRow {
  return { id, taskName: `任务${id}`, status: 1 } as MarketingTaskRow;
}

function country(iso2: string): MarketingTaskExportCountry {
  return {
    iso2,
    nameZh: iso2,
    nameEn: iso2,
    phonePrefix: `+${iso2.length}`,
    flag: ""
  };
}

function dependencies(
  overrides: Partial<MarketingTaskExportDependencies> = {}
): MarketingTaskExportDependencies {
  return {
    listCountries: async () => [country("ID"), country("MY"), country("SG")],
    createExport: async () => ({
      id: 9001,
      exportMode: "COUNTRY_ENTRY",
      status: "PENDING",
      summaryRowCount: 0,
      detailRowCount: 0,
      snapshotAt: 1785200000000,
      downloadReady: false,
      createdAt: 1785200000000
    }),
    getExport: async () => ({
      id: 9001,
      exportMode: "COUNTRY_ENTRY",
      status: "SUCCESS",
      summaryRowCount: 0,
      detailRowCount: 1,
      snapshotAt: 1785200000000,
      downloadReady: true,
      createdAt: 1785200000000
    }),
    downloadExport: async () => ({
      filename: "营销任务数据.xlsx",
      blob: new Blob(["xlsx"])
    }),
    saveFile: () => undefined,
    ...overrides
  };
}

function installIntervalHarness(): {
  delays: number[];
  run: () => void;
  restore: () => void;
} {
  const originalSetInterval = globalThis.setInterval;
  const originalClearInterval = globalThis.clearInterval;
  const callbacks: Array<() => void> = [];
  const delays: number[] = [];
  const handle = 71 as unknown as ReturnType<typeof setInterval>;

  globalThis.setInterval = ((callback: () => void, delay?: number) => {
    callbacks.push(callback);
    delays.push(Number(delay));
    return handle;
  }) as typeof setInterval;
  globalThis.clearInterval = (() => undefined) as typeof clearInterval;

  return {
    delays,
    run: () => callbacks.at(-1)?.(),
    restore: () => {
      globalThis.setInterval = originalSetInterval;
      globalThis.clearInterval = originalClearInterval;
    }
  };
}

async function flushAsyncWork(): Promise<void> {
  await new Promise<void>(resolve => setImmediate(resolve));
}

describe("marketing task export workflow", () => {
  it("warns without opening the dialog when no task is selected", async () => {
    resetElementPlusMock();
    let countryRequests = 0;
    const scope = effectScope();
    const state = scope.run(() =>
      useMarketingTaskExport(
        ref<MarketingTaskRow[]>([]),
        dependencies({
          listCountries: async () => {
            countryRequests += 1;
            return [];
          }
        })
      )
    );
    assert.ok(state);

    await state.openExportDialog();

    assert.equal(state.exportDialogOpen.value, false);
    assert.equal(countryRequests, 0);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "请先选择需要导出的营销任务。" }
    ]);
    scope.stop();
  });

  it("opens the dialog and loads countries only after a valid selection", async () => {
    resetElementPlusMock();
    const scope = effectScope();
    const state = scope.run(() =>
      useMarketingTaskExport(ref([row(22)]), dependencies())
    );
    assert.ok(state);

    await state.openExportDialog();

    assert.equal(state.exportDialogOpen.value, true);
    assert.equal(state.selectedTaskCount.value, 1);
    assert.deepEqual(
      state.countries.value.map(item => item.iso2),
      ["ID", "MY", "SG"]
    );
    scope.stop();
  });

  it("creates one job, polls it and automatically downloads on success", async () => {
    resetElementPlusMock();
    const timers = installIntervalHarness();
    const requests: unknown[] = [];
    const saved: MarketingTaskExportFile[] = [];
    try {
      const scope = effectScope();
      const state = scope.run(() =>
        useMarketingTaskExport(
          ref([row(22), row(11)]),
          dependencies({
            createExport: async request => {
              requests.push(request);
              return {
                id: 9001,
                exportMode: "COUNTRY_ENTRY",
                status: "PENDING",
                summaryRowCount: 0,
                detailRowCount: 0,
                snapshotAt: 1785200000000,
                downloadReady: false,
                createdAt: 1785200000000
              };
            },
            getExport: async (): Promise<MarketingTaskExportJob> => ({
              id: 9001,
              exportMode: "COUNTRY_ENTRY",
              status: "SUCCESS",
              summaryRowCount: 0,
              detailRowCount: 2,
              snapshotAt: 1785200000000,
              downloadReady: true,
              createdAt: 1785200000000,
              finishedAt: 1785200010000
            }),
            saveFile: (filename, blob) => saved.push({ filename, blob })
          })
        )
      );
      assert.ok(state);
      await state.openExportDialog();

      await state.submitExport({
        mode: "COUNTRY_ENTRY",
        countryIso2s: ["MY", "ID", "MY"]
      });

      assert.deepEqual(requests, [
        {
          exportMode: "COUNTRY_ENTRY",
          taskIds: [11, 22],
          countryIso2s: ["ID", "MY"]
        }
      ]);
      assert.deepEqual(timers.delays, [3000]);
      assert.equal(state.exporting.value, true);

      timers.run();
      await flushAsyncWork();

      assert.equal(saved[0].filename, "营销任务数据.xlsx");
      assert.equal(state.exporting.value, false);
      assert.equal(
        elementPlusCalls().at(-1)?.text,
        "文件生成成功，已开始下载。"
      );
      scope.stop();
    } finally {
      timers.restore();
    }
  });

  it("uses the required no-data warning for an empty country export", async () => {
    resetElementPlusMock();
    const scope = effectScope();
    const state = scope.run(() =>
      useMarketingTaskExport(
        ref([row(11)]),
        dependencies({
          createExport: async () => ({
            id: 9002,
            exportMode: "COUNTRY_ENTRY",
            status: "FAILED",
            summaryRowCount: 0,
            detailRowCount: 0,
            snapshotAt: 1785200000000,
            downloadReady: false,
            createdAt: 1785200000000,
            errorMessage: "当前选择范围内暂无可导出数据"
          })
        })
      )
    );
    assert.ok(state);
    await state.openExportDialog();

    await state.submitExport({
      mode: "COUNTRY_ENTRY",
      countryIso2s: ["ID"]
    });

    assert.deepEqual(elementPlusCalls().at(-1), {
      type: "warning",
      text: "当前选择范围内暂无可导出数据。"
    });
    scope.stop();
  });

  it("does not start polling when the scope is disposed during job creation", async () => {
    resetElementPlusMock();
    const timers = installIntervalHarness();
    let resolveCreate!: (job: MarketingTaskExportJob) => void;
    const createPending = new Promise<MarketingTaskExportJob>(resolve => {
      resolveCreate = resolve;
    });
    try {
      const scope = effectScope();
      const state = scope.run(() =>
        useMarketingTaskExport(
          ref([row(11)]),
          dependencies({ createExport: async () => createPending })
        )
      );
      assert.ok(state);
      await state.openExportDialog();

      const submitting = state.submitExport({ mode: "FULL", countryIso2s: [] });
      scope.stop();
      resolveCreate({
        id: 9003,
        exportMode: "FULL",
        status: "PENDING",
        summaryRowCount: 0,
        detailRowCount: 0,
        snapshotAt: 1785200000000,
        downloadReady: false,
        createdAt: 1785200000000
      });
      await submitting;

      assert.deepEqual(timers.delays, []);
    } finally {
      timers.restore();
    }
  });

  it("does not show a country loading error after the scope is disposed", async () => {
    resetElementPlusMock();
    let rejectCountries!: (error: Error) => void;
    const countriesPending = new Promise<MarketingTaskExportCountry[]>(
      (_resolve, reject) => {
        rejectCountries = reject;
      }
    );
    const scope = effectScope();
    const state = scope.run(() =>
      useMarketingTaskExport(
        ref([row(11)]),
        dependencies({ listCountries: async () => countriesPending })
      )
    );
    assert.ok(state);

    const opening = state.openExportDialog();
    scope.stop();
    rejectCountries(new Error("network down"));
    await opening;

    assert.deepEqual(elementPlusCalls(), []);
  });

  it("does not show a creation error after the scope is disposed", async () => {
    resetElementPlusMock();
    let rejectCreate!: (error: Error) => void;
    const createPending = new Promise<MarketingTaskExportJob>(
      (_resolve, reject) => {
        rejectCreate = reject;
      }
    );
    const scope = effectScope();
    const state = scope.run(() =>
      useMarketingTaskExport(
        ref([row(11)]),
        dependencies({ createExport: async () => createPending })
      )
    );
    assert.ok(state);
    await state.openExportDialog();

    const submitting = state.submitExport({ mode: "FULL", countryIso2s: [] });
    scope.stop();
    rejectCreate(new Error("network down"));
    await submitting;

    assert.deepEqual(elementPlusCalls(), []);
  });

  it("stops tracking after three consecutive status query failures", async () => {
    resetElementPlusMock();
    const timers = installIntervalHarness();
    try {
      const scope = effectScope();
      const state = scope.run(() =>
        useMarketingTaskExport(
          ref([row(11)]),
          dependencies({
            getExport: async () => {
              throw new Error("network down");
            }
          })
        )
      );
      assert.ok(state);
      await state.openExportDialog();
      await state.submitExport({ mode: "FULL", countryIso2s: [] });

      for (let attempt = 0; attempt < 3; attempt += 1) {
        timers.run();
        await flushAsyncWork();
      }

      assert.equal(state.exporting.value, false);
      assert.equal(
        elementPlusCalls().at(-1)?.text,
        "导出状态连续查询失败，请重新发起导出。"
      );
      scope.stop();
    } finally {
      timers.restore();
    }
  });
});
