import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createImageObjectUrlController } from "./image-object-url";

describe("hyperlink image object URL lifecycle", () => {
  it("revokes the previous URL on replacement and the current URL on cleanup", () => {
    const revoked: string[] = [];
    let nextId = 1;
    const controller = createImageObjectUrlController({
      createObjectURL: () => `blob:test-${nextId++}`,
      revokeObjectURL: url => revoked.push(url)
    });

    assert.equal(controller.replace(new Blob(["first"])), "blob:test-1");
    assert.equal(controller.replace(new Blob(["second"])), "blob:test-2");
    assert.deepEqual(revoked, ["blob:test-1"]);

    controller.clear();
    controller.clear();
    assert.deepEqual(revoked, ["blob:test-1", "blob:test-2"]);
    assert.equal(controller.current(), "");
  });
});
