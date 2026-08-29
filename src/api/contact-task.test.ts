import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  actContactTask,
  contactTaskImageUrl,
  createContactTask,
  downloadContactTaskImage,
  getContactTask,
  listContactTaskAccountData,
  listContactTasks,
  updateContactTask,
  uploadContactTaskImage,
  type ContactTaskWriteRequest
} from "./contact-task";

const writeBody: ContactTaskWriteRequest = {
  name: "春节福利",
  messageType: 0,
  title: "限时领取",
  description: "一句话补充",
  promotionLink: "https://example.com/promo",
  content: "老朋友专享",
  previewImageFileId: 77,
  msgIntervalMinSec: 0.5,
  msgIntervalMaxSec: 1,
  concurrency: 10,
  maxSendsPerAccount: 50,
  retryMax: 3,
  startMode: "now",
  taskDelayMinutes: 0,
  isEnabled: 1,
  accountFilterJson: '{"country_iso2s":["CN"]}'
};

describe("contact task API", () => {
  it("maps list, detail and account data to the frozen contract paths", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });

    await listContactTasks({
      page: 1,
      pageSize: 20,
      name: "福利",
      runStatus: 1,
      createdAtStart: 1787846400000,
      createdAtEnd: 1787932799999
    });
    await getContactTask(301);
    await listContactTaskAccountData(301, {
      page: 2,
      pageSize: 50,
      sortBy: "sentNum",
      sortOrder: "desc"
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/contact-tasks",
        opts: {
          params: {
            page: 1,
            pageSize: 20,
            name: "福利",
            runStatus: 1,
            createdAtStart: 1787846400000,
            createdAtEnd: 1787932799999
          }
        }
      },
      { method: "get", url: "/api/contact-tasks/301", opts: undefined },
      {
        method: "get",
        url: "/api/contact-tasks/301/data",
        opts: {
          params: {
            page: 2,
            pageSize: 50,
            sortBy: "sentNum",
            sortOrder: "desc"
          }
        }
      }
    ]);
  });

  it("sends complete create and update bodies", async () => {
    resetArmadaMock({});

    await createContactTask(writeBody);
    await updateContactTask(301, writeBody);

    assert.deepEqual(armadaCalls(), [
      { method: "post", url: "/api/contact-tasks", opts: { data: writeBody } },
      {
        method: "put",
        url: "/api/contact-tasks/301",
        opts: { data: writeBody }
      }
    ]);
  });

  it("keeps the account filter a json string on the wire", async () => {
    resetArmadaMock({});

    await createContactTask(writeBody);

    const sent = armadaCalls()[0].opts as { data: ContactTaskWriteRequest };
    assert.equal(typeof sent.data.accountFilterJson, "string");
  });

  it("posts each lifecycle action to the single action endpoint", async () => {
    resetArmadaMock(null);

    await actContactTask(7, "start");
    await actContactTask(7, "pause");
    await actContactTask(7, "resume");
    await actContactTask(7, "stop");

    assert.deepEqual(
      armadaCalls().map(call => [call.method, call.url, call.opts]),
      [
        ["post", "/api/contact-tasks/7/action", { data: { action: "start" } }],
        ["post", "/api/contact-tasks/7/action", { data: { action: "pause" } }],
        ["post", "/api/contact-tasks/7/action", { data: { action: "resume" } }],
        ["post", "/api/contact-tasks/7/action", { data: { action: "stop" } }]
      ]
    );
  });

  it("has no delete endpoint because neither the api nor the competitor has one", async () => {
    const api = await import("./contact-task");

    assert.equal(
      Object.keys(api).some(name => name.toLowerCase().includes("delete")),
      false
    );
  });

  it("uploads the preview image through the shared template file endpoint", async () => {
    resetArmadaMock({
      id: 77,
      url: "/api/marketing-template-files/77/content"
    });

    await uploadContactTaskImage(
      new File(["x"], "a.jpg", { type: "image/jpeg" })
    );

    const call = armadaCalls()[0];
    assert.equal(call.method, "post");
    assert.equal(call.url, "/api/marketing-template-files");
    assert.ok((call.opts as { data: unknown }).data instanceof FormData);
  });

  it("drops the json content type so the browser sets the multipart boundary", async () => {
    resetArmadaMock({ id: 77 });

    await uploadContactTaskImage(
      new File(["x"], "a.jpg", { type: "image/jpeg" })
    );

    const config = armadaCalls()[0].config as {
      beforeRequestCallback: (c: { headers: Record<string, unknown> }) => void;
    };
    const headers: Record<string, unknown> = {
      "Content-Type": "application/json"
    };
    config.beforeRequestCallback({ headers });
    assert.equal("Content-Type" in headers, false);
  });

  it("exposes a stable image content url and blob download", async () => {
    resetHttpMock(new Blob());

    assert.equal(
      contactTaskImageUrl(77),
      "/api/marketing-template-files/77/content"
    );
    await downloadContactTaskImage(77);

    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/marketing-template-files/77/content",
        opts: { responseType: "blob" }
      }
    ]);
  });
});
