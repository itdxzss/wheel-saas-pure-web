import assert from "node:assert/strict";
import { test } from "node:test";
import type { GroupListRow } from "@/api/group";
import { buildGroupLinkExport } from "./group-link-export";

function row(overrides: Partial<GroupListRow> = {}): GroupListRow {
  return {
    id: 1,
    url: "old-link",
    groupClassification: "UNCLASSIFIED",
    ...overrides
  };
}

test("CSV preserves Chinese, emoji, quotes and newlines with exactly two columns", () => {
  assert.equal(
    buildGroupLinkExport(
      [
        row({
          groupName: '客户,"群"\n😀',
          inviteUrl: "https://chat.whatsapp.com/current"
        })
      ],
      "csv"
    ),
    '\uFEFF"群组名称","群组链接"\r\n"客户,""群""\n😀","https://chat.whatsapp.com/current"'
  );
});

test("TXT keeps one line per selected group and leaves missing links empty", () => {
  assert.equal(
    buildGroupLinkExport(
      [
        row({
          groupName: "运营\t名称\r\n😀",
          waSubject: "真实名称",
          inviteUrl: "https://chat.whatsapp.com/current"
        }),
        row({ id: 2, waSubject: "真实群名" }),
        row({ id: 3 })
      ],
      "txt"
    ),
    "群组名称\t群组链接\r\n运营 名称 😀\thttps://chat.whatsapp.com/current\r\n真实群名\t\r\n群组 3\t"
  );
});

test("CSV treats formula-like group names as text", () => {
  for (const name of ["=1+1", "+123", "-123", "@SUM(A1)", "\t=1+1"]) {
    assert.ok(
      buildGroupLinkExport([row({ groupName: name })], "csv").includes(
        `"'${name}"`
      )
    );
  }
});
