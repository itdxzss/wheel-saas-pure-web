import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import {
  deliverAccountExport,
  selectedExportIds
} from "./account-credential-export";
import type { AccountExportJob } from "@/api/account-export";

describe("账号凭据导出", () => {
  it("只使用明确勾选且全部离线的账号，拒绝空选和未知状态", () => {
    assert.deepEqual(
      selectedExportIds([
        { id: 3, login_state: 2 },
        { id: 1, login_state: 2 },
        { id: 3, login_state: 2 }
      ]),
      [1, 3]
    );
    for (const rows of [
      [],
      [{ id: 1 }],
      [{ id: 1, login_state: 1 as const }],
      [{ id: 1, login_state: 3 as const }],
      [{ id: undefined, login_state: 2 as const }]
    ]) {
      assert.throws(() => selectedExportIds(rows));
    }
  });

  const bytes = new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3, 4]);
  const job: AccountExportJob = {
    id: "job",
    status: "READY",
    accountCount: 2,
    filename: "accounts.zip",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    fileSize: bytes.length,
    createdAt: 0,
    expiresAt: Date.now() + 10000
  };

  it("收到完整文件并触发保存后才能移除，重新下载不重复移除", async () => {
    const events: string[] = [];
    const actions = {
      download: async () => {
        events.push("download");
        return new Blob([bytes]);
      },
      save: () => {
        events.push("save");
      },
      complete: async () => {
        events.push("complete");
        return { ...job, status: "COMPLETED" as const };
      }
    };
    await deliverAccountExport(job, actions);
    assert.deepEqual(events, ["download", "save", "complete"]);
    events.length = 0;
    await deliverAccountExport({ ...job, status: "COMPLETED" }, actions);
    assert.deepEqual(events, ["download", "save"]);
  });

  it("下载失败、截断、错误响应或保存失败时不调用移除", async () => {
    let completed = 0;
    const complete = async () => {
      completed++;
      return job;
    };
    for (const blob of [
      new Blob([bytes.slice(0, 5)]),
      new Blob(["bad json"])
    ]) {
      await assert.rejects(
        deliverAccountExport(job, {
          download: async () => blob,
          save: () => {},
          complete
        })
      );
    }
    await assert.rejects(
      deliverAccountExport(job, {
        download: async () => {
          throw Error("network");
        },
        save: () => {},
        complete
      })
    );
    await assert.rejects(
      deliverAccountExport(job, {
        download: async () => new Blob([bytes]),
        save: () => {
          throw Error("save");
        },
        complete
      })
    );
    assert.equal(completed, 0);
  });
});
