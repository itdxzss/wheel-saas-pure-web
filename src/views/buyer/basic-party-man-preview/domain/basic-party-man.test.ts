import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error Node direct TypeScript tests require an explicit extension.
import { createBasicPartyManFlowState } from "./basic-party-man.ts";
// @ts-expect-error Node direct TypeScript tests require an explicit extension.
import { transitionBasicPartyManFlow } from "./basic-party-man.ts";

describe("basic party man flow", () => {
  it("requires login before opening protected content", () => {
    const requested = transitionBasicPartyManFlow(
      createBasicPartyManFlowState(),
      "REQUEST_ACCESS"
    );
    assert.equal(requested.accessVisible, true);

    const login = transitionBasicPartyManFlow(requested, "OPEN_LOGIN");
    assert.equal(login.accessVisible, false);
    assert.equal(login.loginVisible, true);
  });

  it("moves from successful pairing to profile and chat", () => {
    const matched = transitionBasicPartyManFlow(
      createBasicPartyManFlowState(),
      "PAIRING_SUCCEEDED"
    );
    assert.equal(matched.page, "matches");

    const profile = transitionBasicPartyManFlow(matched, {
      type: "OPEN_PROFILE",
      profileId: "lina"
    });
    assert.equal(profile.page, "profile");
    assert.equal(profile.selectedProfileId, "lina");
    assert.equal(
      transitionBasicPartyManFlow(profile, "OPEN_CHAT").page,
      "chat"
    );
  });
});
