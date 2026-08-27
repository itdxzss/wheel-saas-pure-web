import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(currentDir, "..");

const privateStorageFiles = [
  "views/account/index/composables/useAccountListPage.ts",
  "views/task/pull-task/composables/useCommonGroupCreate.ts",
  "views/task/pull-task/composables/useStandardPullTaskCreate.ts",
  "views/task/pull-task/create/usePullTaskGroupCandidates.ts"
];

describe("private browser state isolation", () => {
  it("persists the trusted login response identity used for cache partitioning", () => {
    const userStoreSource = fs.readFileSync(
      path.join(sourceRoot, "store/modules/user.ts"),
      "utf8"
    );
    const authSource = fs.readFileSync(
      path.join(sourceRoot, "utils/auth.ts"),
      "utf8"
    );

    assert.match(userStoreSource, /userId: res\.user\.id/);
    assert.match(userStoreSource, /tenantId: res\.tenant\.id/);
    assert.match(
      authSource,
      /storageLocal\(\)\.setItem\(userKey,[\s\S]*userId/
    );
    assert.match(
      authSource,
      /storageLocal\(\)\.setItem\(userKey,[\s\S]*tenantId/
    );
  });

  it("derives every private business cache key from the authenticated user", () => {
    for (const relativePath of privateStorageFiles) {
      const source = fs.readFileSync(
        path.join(sourceRoot, relativePath),
        "utf8"
      );
      assert.match(
        source,
        /currentUserDataStorageKey/,
        `${relativePath} must scope storage by tenant and user`
      );
    }
  });
});
