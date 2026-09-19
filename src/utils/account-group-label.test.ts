import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAccountGroupLabel,
  resolveAccountGroupLabel,
  resolveAccountGroupNamesLabel
} from "./account-group-label";

const groups = [
  { id: 1, name: "拉手", totalAccounts: 20, onlineAccounts: 8 },
  { id: 2, name: "空组", totalAccounts: 0, onlineAccounts: 0 }
];

describe("account group count labels", () => {
  it("distinguishes a confirmed zero from missing or invalid counts", () => {
    assert.equal(formatAccountGroupLabel(groups[1]), "空组（总 0 / 在线 0）");
    assert.equal(
      formatAccountGroupLabel({ name: "未知" }),
      "未知（总 — / 在线 —）"
    );
    assert.equal(
      formatAccountGroupLabel({
        name: "未知",
        totalAccounts: -1,
        onlineAccounts: NaN
      }),
      "未知（总 — / 在线 —）"
    );
  });

  it("resolves by stable ID after a rename and never rebinds a deleted ID by name", () => {
    assert.equal(
      resolveAccountGroupLabel(groups, 1, "旧名称"),
      "拉手（总 20 / 在线 8）"
    );
    assert.equal(
      resolveAccountGroupLabel(groups, 99, "拉手"),
      "拉手（总 — / 在线 —）"
    );
  });

  it("only resolves name-only snapshots when the match is unique", () => {
    assert.equal(
      resolveAccountGroupLabel(groups, null, "拉手"),
      "拉手（总 20 / 在线 8）"
    );
    assert.equal(
      resolveAccountGroupLabel(
        [...groups, { ...groups[0], id: 3 }],
        null,
        "拉手"
      ),
      "拉手（总 — / 在线 —）"
    );
    assert.equal(resolveAccountGroupLabel(groups, null, "-"), "-");
  });

  it("resolves legacy multi-group snapshots without corrupting slash-containing names", () => {
    assert.equal(
      resolveAccountGroupNamesLabel(groups, "拉手/空组"),
      "拉手（总 20 / 在线 8）、空组（总 0 / 在线 0）"
    );
    const slashGroup = {
      id: 3,
      name: "拉手/空组",
      totalAccounts: 10,
      onlineAccounts: 2
    };
    assert.equal(
      resolveAccountGroupNamesLabel([slashGroup], slashGroup.name),
      "拉手/空组（总 10 / 在线 2）"
    );
    assert.equal(
      resolveAccountGroupNamesLabel([...groups, slashGroup], slashGroup.name),
      "拉手/空组（数量暂不可用）"
    );
    assert.equal(
      resolveAccountGroupNamesLabel(groups, "已删除/空组"),
      "已删除/空组（数量暂不可用）"
    );
  });
});
