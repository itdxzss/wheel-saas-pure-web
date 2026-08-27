import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildUserDataStorageKey } from "./user-data-storage-key";

describe("user data storage key", () => {
  it("partitions browser state by tenant and authenticated user", () => {
    assert.equal(
      buildUserDataStorageKey("armada:draft", { tenantId: 7, userId: 81 }),
      "armada:draft:tenant-7:user-81"
    );
    assert.notEqual(
      buildUserDataStorageKey("armada:draft", { tenantId: 7, userId: 81 }),
      buildUserDataStorageKey("armada:draft", { tenantId: 7, userId: 82 })
    );
  });

  it("fails closed when the current identity is incomplete or invalid", () => {
    assert.equal(buildUserDataStorageKey("armada:draft", null), null);
    assert.equal(
      buildUserDataStorageKey("armada:draft", { tenantId: 7, userId: 0 }),
      null
    );
    assert.equal(
      buildUserDataStorageKey("", { tenantId: 7, userId: 81 }),
      null
    );
  });
});
