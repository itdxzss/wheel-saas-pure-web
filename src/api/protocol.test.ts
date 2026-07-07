import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { restartProtocolProcesses } from "./protocol";

describe("protocol operation API", () => {
  it("posts protocol restart requests to armada", async () => {
    resetArmadaMock({
      success: true,
      command:
        "pm2 restart protocol-master protocol-worker-1 protocol-worker-2 protocol-worker-3 protocol-worker-4 --update-env",
      startedAt: 1783420000000,
      finishedAt: 1783420002000,
      elapsedMs: 2000,
      processes: [
        {
          processName: "protocol-master",
          readyUrl: "http://127.0.0.1:8080/readyz",
          ready: true,
          statusCode: 200,
          error: null,
          checkedAt: 1783420001000
        }
      ],
      message: "协议进程已重启"
    });

    const result = await restartProtocolProcesses();

    assert.equal(result.success, true);
    assert.equal(result.processes[0].processName, "protocol-master");
    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/protocol/restart",
        opts: undefined
      }
    ]);
  });
});
