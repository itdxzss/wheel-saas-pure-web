import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armadaCalls,
  resetArmadaMockQueue
} from "@/api/__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "@/api/__tests__/http-test-double";
import {
  elementPlusCalls,
  resetElementPlusMock
} from "@/api/__tests__/element-plus-test-double";
import type { GroupCreationMarketingTaskRow } from "@/api/group-creation-marketing";
import { useGroupCreationMarketingPage } from "./useGroupCreationMarketingPage";

describe("group creation marketing page state", () => {
  it("keeps upload order and marks extra files unmatched", async () => {
    const page = useGroupCreationMarketingPage();
    page.accountGroups.value = [
      {
        id: 8,
        name: "A组",
        totalAccounts: 1,
        onlineAccounts: 1,
        abnormalAccounts: 0,
        bannedAccounts: 0,
        updatedAt: "",
        systemBuiltin: false
      }
    ];
    page.accounts.value = [
      { accountId: 10, wsPhone: "8613000000000", status: "ONLINE" }
    ];

    await page.addMaterialFiles([
      new File(["8613900000000"], "a.txt"),
      new File(["8613911111111"], "b.txt")
    ]);

    assert.equal(page.matchRows.value[0].fileName, "a.txt");
    assert.equal(page.matchRows.value[0].accountId, 10);
    assert.equal(page.unmatchedFiles.value[0].fileName, "b.txt");
  });

  it("builds create block reason for required fields and interval", async () => {
    const page = useGroupCreationMarketingPage();

    assert.equal(page.createForm.sendIntervalSeconds, 30);
    assert.equal(page.createBlockReason.value, "请先填写任务名称");

    page.createForm.taskName = "建群营销";
    assert.equal(page.createBlockReason.value, "请选择账号分组");

    page.createForm.accountGroupId = 8;
    assert.equal(page.createBlockReason.value, "请选择营销模板");

    page.createForm.marketingTemplateId = 18;
    assert.equal(page.createBlockReason.value, "请上传料子文件");

    await page.addMaterialFiles([new File([""], "empty.txt")]);
    assert.equal(page.createBlockReason.value, "料子文件不能为空");

    page.removeMaterialFile(0);
    await page.addMaterialFiles([
      new File(["8613900000000"], "a.txt"),
      new File(["8613911111111"], "b.txt")
    ]);
    assert.equal(
      page.createBlockReason.value,
      "没有可执行的账号和料子文件匹配"
    );

    page.accounts.value = [
      { accountId: 10, wsPhone: "8613000000000", status: "在线" }
    ];
    page.createForm.sendIntervalSeconds = 0;
    assert.equal(page.createBlockReason.value, "发送间隔必须大于 0 秒");

    page.createForm.sendIntervalSeconds = 10;
    assert.equal(page.createBlockReason.value, "");
  });

  it("loads account group usable counts from group creation candidates", async () => {
    resetArmadaMockQueue([
      {
        list: [
          {
            id: 8,
            name: "A组",
            accountCount: 8,
            onlineCount: 5,
            restrictedCount: 2,
            bannedCount: 1,
            updatedAt: null,
            systemBuiltin: false
          },
          {
            id: 9,
            name: "B组",
            accountCount: 4,
            onlineCount: 4,
            restrictedCount: 0,
            bannedCount: 0,
            updatedAt: null,
            systemBuiltin: false
          }
        ],
        total: 2,
        page: 1,
        pageSize: 500
      },
      {
        list: [],
        total: 0,
        page: 1,
        pageSize: 500
      },
      [
        {
          accountId: 10,
          accountPhone: "8613000000010",
          protocolAccountId: "acc_10",
          accountState: 2,
          loginState: 1,
          riskStatus: 1,
          muteStatus: null
        }
      ],
      [
        {
          accountId: 20,
          accountPhone: "8613000000020",
          protocolAccountId: "acc_20",
          accountState: 2,
          loginState: 1,
          riskStatus: 1,
          muteStatus: null
        },
        {
          accountId: 21,
          accountPhone: "8613000000021",
          protocolAccountId: "acc_21",
          accountState: 2,
          loginState: 1,
          riskStatus: 1,
          muteStatus: null
        }
      ]
    ]);
    const page = useGroupCreationMarketingPage();

    await page.loadOptions();

    assert.equal(page.accountGroupUsableCounts.value[8], 1);
    assert.equal(page.accountGroupUsableCounts.value[9], 2);
    assert.deepEqual(
      armadaCalls().map(call => call.url),
      [
        "/api/account-groups",
        "/api/marketing-templates",
        "/api/group-creation-marketing-tasks/account-candidates",
        "/api/group-creation-marketing-tasks/account-candidates"
      ]
    );
  });

  it("exports selected task rows and resets exporting state", async () => {
    resetElementPlusMock();
    resetHttpMock(
      new Blob(["xlsx"], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      {
        "content-disposition":
          "attachment; filename*=UTF-8''group-creation-marketing.xlsx"
      }
    );
    const downloads: Array<{ href: string; filename: string }> = [];
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalDocument = globalThis.document;
    const link = {
      href: "",
      download: "",
      click: () => {
        downloads.push({ href: link.href, filename: link.download });
      },
      remove: () => undefined
    };
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: () => "blob:group-creation-export"
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: () => undefined
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        createElement: () => link,
        body: {
          appendChild: () => undefined
        }
      }
    });
    const page = useGroupCreationMarketingPage();

    try {
      page.onSelectionChange([
        { id: 9 } as GroupCreationMarketingTaskRow,
        { id: 8 } as GroupCreationMarketingTaskRow
      ]);

      await page.exportSelectedTasks();

      assert.equal(page.exporting.value, false);
      assert.deepEqual(downloads, [
        {
          href: "blob:group-creation-export",
          filename: "group-creation-marketing.xlsx"
        }
      ]);
      assert.deepEqual(httpCalls(), [
        {
          method: "post",
          url: "/api/group-creation-marketing-tasks/export",
          opts: { data: { ids: [9, 8] }, responseType: "blob" },
          configKeys: ["beforeResponseCallback"]
        }
      ]);
      assert.deepEqual(elementPlusCalls(), [
        { type: "success", text: "导出文件已生成" }
      ]);
    } finally {
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        value: originalCreateObjectURL
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        value: originalRevokeObjectURL
      });
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument
      });
    }
  });

  it("rejects export without selected tasks", async () => {
    resetElementPlusMock();
    resetHttpMock(new Blob([]));
    const page = useGroupCreationMarketingPage();

    await page.exportSelectedTasks();

    assert.deepEqual(httpCalls(), []);
    assert.deepEqual(elementPlusCalls(), [
      { type: "warning", text: "请先选择要导出的建群营销任务" }
    ]);
  });
});
