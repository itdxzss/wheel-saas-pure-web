import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { resetElementPlusMock } from "@/api/__tests__/element-plus-test-double";
import type { HistoricalGroupItem } from "@/api/historical-group";
import { useHistoricalGroupPage } from "./composables/useHistoricalGroupPage";

const pageSource = readFileSync(
  new URL("./index.vue", import.meta.url),
  "utf8"
);
const selectorSource = readFileSync(
  new URL("./components/HistoricalGroupAccountSelector.vue", import.meta.url),
  "utf8"
);
const tableSource = readFileSync(
  new URL("./components/HistoricalGroupTable.vue", import.meta.url),
  "utf8"
);

const baselineRows: HistoricalGroupItem[] = [
  {
    groupJid: "120363admin@g.us",
    subject: "管理员群",
    accountPhones: ["8613800000017", "8613800000018"],
    inviteLink: "https://chat.whatsapp.com/CompleteInviteCode",
    countryIso2: "CN",
    countryName: "中国",
    countryFlag: "🇨🇳",
    groupCreatedAt: 1_722_470_400,
    membershipState: "UNVERIFIED",
    roleCategory: null,
    selfRole: null,
    speechState: null,
    memberSize: null,
    announceOnly: null,
    operable: false,
    disabledReason: "暂无在线管理员账号",
    errorMessage: null
  }
];

function pageResult(rows = baselineRows, page = 1) {
  return {
    list: rows,
    total: rows.length,
    page,
    pageSize: 20,
    totalPages: 1
  };
}

describe("historical group page state", () => {
  it("selects an account group and immediately loads its historical groups", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      { list: [{ id: 8, name: "历史群账号", accountCount: 5 }], total: 1 },
      pageResult()
    ]);
    const page = useHistoricalGroupPage();

    await page.loadAccountGroups();
    await page.selectAccountGroup(8);

    assert.equal(page.rows.value.length, 1);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/account-groups", "/api/historical-groups"]
    );
    assert.deepEqual(armadaCalls()[1].opts, {
      params: { accountGroupId: 8, page: 1, pageSize: 20 }
    });
    assert.equal(
      armadaCalls().some(call => call.url === "/api/accounts"),
      false
    );
  });

  it("refreshes the whole account group only after an explicit click", async () => {
    resetElementPlusMock();
    const refreshed = [{ ...baselineRows[0], selfRole: "OWNER" as const }];
    resetArmadaMockQueue([pageResult(), undefined, pageResult(refreshed)]);
    const page = useHistoricalGroupPage();
    await page.selectAccountGroup(8);

    await page.refreshHistoricalGroups();

    assert.equal(page.rows.value[0].selfRole, "OWNER");
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/historical-groups",
        "/api/historical-groups/refresh",
        "/api/historical-groups"
      ]
    );
    assert.deepEqual(armadaCalls()[1].opts, {
      data: { accountGroupId: 8 }
    });
  });

  it("changes pages with server-side pagination", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([pageResult(), pageResult([], 2)]);
    const state = useHistoricalGroupPage();
    await state.selectAccountGroup(8);

    await state.changePage(2);

    assert.equal(state.page.value, 2);
    assert.deepEqual(armadaCalls()[1].opts, {
      params: { accountGroupId: 8, page: 2, pageSize: 20 }
    });
  });

  it("keeps cached rows when refreshing WhatsApp fails", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([pageResult()]);
    const page = useHistoricalGroupPage();
    await page.selectAccountGroup(8);
    resetArmadaMockFailure(new Error("protocol groups unavailable"));

    await page.refreshHistoricalGroups();

    assert.deepEqual(page.rows.value, baselineRows);
  });

  it("ignores a stale page response after the selected group changes", async () => {
    let resolveOld: (value: ReturnType<typeof pageResult>) => void = () =>
      undefined;
    const oldPage = new Promise<ReturnType<typeof pageResult>>(resolve => {
      resolveOld = resolve;
    });
    const secondRows = [{ ...baselineRows[0], groupJid: "120363second@g.us" }];
    resetArmadaMockQueue([oldPage, pageResult(secondRows)]);
    const page = useHistoricalGroupPage();

    const staleLoad = page.selectAccountGroup(8);
    await page.selectAccountGroup(9);
    resolveOld(pageResult());
    await staleLoad;

    assert.equal(page.selectedAccountGroupId.value, 9);
    assert.equal(page.rows.value[0].groupJid, "120363second@g.us");
  });
});

describe("historical group page template", () => {
  it("contains only the account-group selector and explicit refresh", () => {
    assert.match(selectorSource, /账号分组/);
    assert.match(selectorSource, /加载群列表/);
    assert.doesNotMatch(selectorSource, /操作账号/);
    assert.match(selectorSource, /:disabled="!selectedAccountGroupId"/);
    assert.doesNotMatch(selectorSource, /baselineLoading/);
    assert.match(pageSource, /HistoricalGroupAccountSelector/);
    assert.match(pageSource, /el-pagination/);
  });

  it("renders the approved column order and linked-account tooltip", () => {
    const labels = [
      "群名称",
      "关联账号",
      "群链接",
      "国家",
      "群组创建时间",
      "当前关系",
      "自身角色",
      "发言状态",
      "群人数",
      "操作",
      "完整群 JID"
    ];
    let cursor = -1;
    for (const label of labels) {
      const position = tableSource.indexOf(`label="${label}"`);
      assert.ok(position > cursor, `${label} 应按约定顺序展示`);
      cursor = position;
    }
    assert.match(tableSource, /el-tooltip/);
    assert.match(tableSource, /row\.accountPhones/);
    assert.match(tableSource, /row\.inviteLink/);
    assert.match(tableSource, /row\.countryName/);
    assert.match(tableSource, /row\.groupCreatedAt/);
    assert.match(tableSource, /row\.operable/);
    assert.match(tableSource, /row\.groupJid/);
    assert.doesNotMatch(tableSource, /未校验/);
    assert.doesNotMatch(tableSource, /(?:\|\||\?\?|:) "-"/);
    assert.doesNotMatch(tableSource, />-</);
  });
});
