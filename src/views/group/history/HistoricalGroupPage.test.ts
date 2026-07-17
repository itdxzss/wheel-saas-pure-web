import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockFailure,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { resetElementPlusMock } from "@/api/__tests__/element-plus-test-double";
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

const baselineRows = [
  {
    groupJid: "120363admin@g.us",
    subject: "管理员群",
    membershipState: "UNVERIFIED" as const,
    roleCategory: null,
    selfRole: null,
    speechState: null,
    memberSize: null,
    announceOnly: null,
    errorMessage: null
  },
  {
    groupJid: "120363left@g.us",
    subject: "历史退出群",
    membershipState: "UNVERIFIED" as const,
    roleCategory: null,
    selfRole: null,
    speechState: null,
    memberSize: null,
    announceOnly: null,
    errorMessage: null
  }
];

describe("historical group page state", () => {
  it("loads group then account then baseline, and refreshes only explicitly", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      {
        list: [{ id: 8, name: "历史群账号", accountCount: 1 }],
        total: 1
      },
      {
        list: [
          {
            id: 17,
            wsPhone: "8613800000017",
            accountGroupId: 8,
            groupName: "历史群账号"
          }
        ],
        total: 1
      },
      baselineRows,
      [
        {
          ...baselineRows[0],
          membershipState: "CURRENT_IN_GROUP",
          roleCategory: "ADMIN",
          selfRole: "OWNER",
          speechState: "ADMIN_CAN_SPEAK",
          memberSize: 18,
          announceOnly: true
        },
        {
          ...baselineRows[1],
          membershipState: "CURRENT_NOT_IN_GROUP"
        }
      ]
    ]);
    const page = useHistoricalGroupPage();

    await page.loadAccountGroups();
    await page.selectAccountGroup(8);
    assert.deepEqual((armadaCalls()[1].opts as { params: unknown }).params, {
      accountGroupId: 8,
      accountState: 2,
      loginState: 1,
      page: 1,
      pageSize: 500
    });
    await page.selectOperationAccount(17);

    assert.equal(page.rows.value.length, 2);
    assert.ok(
      page.rows.value.every(row => row.membershipState === "UNVERIFIED")
    );
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      ["/api/account-groups", "/api/accounts", "/api/historical-groups"]
    );

    await page.refreshHistoricalGroups();

    assert.deepEqual(
      page.sections.value.map(section => section.title),
      ["管理员群组", "已退出"]
    );
    assert.equal(page.sections.value[0].rows[0].groupJid, "120363admin@g.us");
    assert.equal(page.sections.value[1].rows[0].groupJid, "120363left@g.us");
    assert.equal(armadaCalls().at(-1)?.url, "/api/historical-groups/refresh");
  });

  it("keeps normal online accounts visible with readable states", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      {
        list: [
          {
            id: 17,
            wsPhone: "8613800000017",
            accountGroupId: 8,
            accountState: 2,
            loginState: 1
          }
        ],
        total: 1
      },
      baselineRows
    ]);
    const page = useHistoricalGroupPage();

    await page.selectAccountGroup(8);

    assert.deepEqual(page.accounts.value, [
      {
        id: 17,
        phone: "8613800000017",
        label: "8613800000017（ID 17｜正常｜在线）"
      }
    ]);

    await page.selectOperationAccount(17);

    assert.equal(armadaCalls().at(-1)?.url, "/api/historical-groups");
    assert.equal(page.rows.value.length, baselineRows.length);
  });

  it("loads every account page for the selected group", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      {
        list: [{ id: 17, wsPhone: "8613800000017" }],
        total: 501,
        page: 1,
        pageSize: 500,
        totalPages: 2
      },
      {
        list: [{ id: 18, wsPhone: "8613800000018" }],
        total: 501,
        page: 2,
        pageSize: 500,
        totalPages: 2
      }
    ]);
    const page = useHistoricalGroupPage();

    await page.selectAccountGroup(8);

    assert.deepEqual(
      armadaCalls().map(call => (call.opts as { params: unknown }).params),
      [
        {
          accountGroupId: 8,
          accountState: 2,
          loginState: 1,
          page: 1,
          pageSize: 500
        },
        {
          accountGroupId: 8,
          accountState: 2,
          loginState: 1,
          page: 2,
          pageSize: 500
        }
      ]
    );
    assert.deepEqual(
      page.accounts.value.map(account => account.id),
      [17, 18]
    );
  });

  it("stops account loading after clearing a group during the request", async () => {
    let resolveAccounts: (value: { list: []; total: number }) => void = () =>
      undefined;
    const pendingAccounts = new Promise<{ list: []; total: number }>(
      resolve => {
        resolveAccounts = resolve;
      }
    );
    resetElementPlusMock();
    resetArmadaMockQueue([pendingAccounts]);
    const page = useHistoricalGroupPage();

    const loading = page.selectAccountGroup(8);
    await page.selectAccountGroup(null);
    resolveAccounts({ list: [], total: 0 });
    await loading;

    assert.equal(page.accountsLoading.value, false);
  });

  it("stops baseline loading after clearing an account during the request", async () => {
    let resolveBaseline: (value: typeof baselineRows) => void = () => undefined;
    const pendingBaseline = new Promise<typeof baselineRows>(resolve => {
      resolveBaseline = resolve;
    });
    resetElementPlusMock();
    resetArmadaMockQueue([pendingBaseline]);
    const page = useHistoricalGroupPage();

    const loading = page.selectOperationAccount(17);
    await page.selectOperationAccount(null);
    resolveBaseline(baselineRows);
    await loading;

    assert.equal(page.baselineLoading.value, false);
  });

  it("clears the fixed account, rows and detail target when parent group changes", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      { list: [], total: 0 },
      { list: [{ id: 17, wsPhone: "8613800000017" }], total: 1 },
      baselineRows,
      { list: [], total: 0 }
    ]);
    const page = useHistoricalGroupPage();

    await page.loadAccountGroups();
    await page.selectAccountGroup(8);
    await page.selectOperationAccount(17);
    page.openGroup(page.rows.value[0]);
    await page.selectAccountGroup(9);

    assert.equal(page.selectedAccountId.value, null);
    assert.equal(page.rows.value.length, 0);
    assert.equal(page.activeGroup.value, null);
  });

  it("marks every baseline row FETCH_FAILED when explicit refresh fails", async () => {
    resetElementPlusMock();
    resetArmadaMockQueue([
      { list: [{ id: 17, wsPhone: "8613800000017" }], total: 1 },
      baselineRows
    ]);
    const page = useHistoricalGroupPage();
    await page.selectAccountGroup(8);
    await page.selectOperationAccount(17);
    resetArmadaMockFailure(new Error("protocol groups unavailable"));

    await page.refreshHistoricalGroups();

    assert.ok(
      page.rows.value.every(row => row.membershipState === "FETCH_FAILED")
    );
    assert.ok(
      page.rows.value.every(
        row => row.membershipState !== "CURRENT_NOT_IN_GROUP"
      )
    );
    assert.match(
      page.rows.value[0].errorMessage ?? "",
      /protocol groups unavailable/
    );
  });

  it("ignores a stale refresh response after the operation account changes", async () => {
    let resolveRefresh: (rows: typeof baselineRows) => void = () => undefined;
    const pendingRefresh = new Promise<typeof baselineRows>(resolve => {
      resolveRefresh = resolve;
    });
    const secondAccountRows = [
      {
        ...baselineRows[0],
        groupJid: "120363second@g.us",
        subject: "第二账号 baseline"
      }
    ];
    resetElementPlusMock();
    resetArmadaMockQueue([baselineRows, pendingRefresh, secondAccountRows]);
    const page = useHistoricalGroupPage();
    await page.selectOperationAccount(17);

    const staleRefresh = page.refreshHistoricalGroups();
    await page.selectOperationAccount(18);
    resolveRefresh(baselineRows);
    await staleRefresh;

    assert.equal(page.selectedAccountId.value, 18);
    assert.deepEqual(
      page.rows.value.map(row => row.groupJid),
      ["120363second@g.us"]
    );
  });

  it("opens a list row without eagerly loading detail members", async () => {
    resetArmadaMockQueue([baselineRows]);
    const page = useHistoricalGroupPage();
    await page.selectOperationAccount(17);
    const before = armadaCalls().length;

    page.openGroup(page.rows.value[0]);

    assert.equal(page.activeGroup.value?.groupJid, "120363admin@g.us");
    assert.equal(armadaCalls().length, before);

    page.closeGroup();

    assert.equal(page.activeGroup.value, null);
    assert.equal(armadaCalls().length, before);
  });
});

describe("historical group page template", () => {
  it("renders account-group first selection and explicit loading", () => {
    assert.match(selectorSource, /账号分组/);
    assert.match(selectorSource, /操作账号/);
    assert.match(selectorSource, /加载群列表/);
    assert.match(selectorSource, /:disabled="!selectedAccountId/);
    assert.match(pageSource, /HistoricalGroupAccountSelector/);
    assert.match(pageSource, /HistoricalGroupTable/);
  });

  it("shows full JIDs, errors and all membership and speech labels", () => {
    for (const label of [
      "在群",
      "已退出",
      "未校验",
      "获取失败",
      "正常发言",
      "管理员可发言",
      "禁止发言",
      "状态异常"
    ]) {
      assert.match(tableSource, new RegExp(label));
    }
    assert.match(tableSource, /row\.groupJid/);
    assert.match(tableSource, /row\.errorMessage/);
    assert.match(tableSource, /word-break:\s*break-all/);
    assert.doesNotMatch(tableSource, /mask|ellipsis/);
  });
});
