import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { armadaCalls, resetArmadaMock } from "./__tests__/armada-test-double";
import { httpCalls, resetHttpMock } from "./__tests__/http-test-double";
import {
  copyHyperlinkTemplate,
  createHyperlinkTemplate,
  deleteHyperlinkTemplate,
  downloadHyperlinkTemplateImage,
  getHyperlinkTemplate,
  listHyperlinkTemplateOptions,
  listHyperlinkTemplates,
  marketingTemplateFileContentUrl,
  updateHyperlinkTemplate,
  uploadHyperlinkTemplateImage,
  type HyperlinkTemplateUpdateRequest
} from "./hyperlink-template";

const completeUpdate: HyperlinkTemplateUpdateRequest = {
  version: 4,
  name: "卡片按钮模板",
  schemaVersion: 1,
  messageType: 4,
  title: "新品福利",
  content: null,
  linkDescription: null,
  promotionLink: null,
  buttons: [
    {
      type: "CTA_URL",
      displayText: "立即查看",
      targetValue: "https://example.com/promo",
      useShortLink: true,
      sort: 1
    }
  ],
  cardText: "限时活动",
  linkPreviewAssetId: null,
  bodyMainAssetId: 123,
  remark: null
};

describe("hyperlink template API", () => {
  it("maps list, detail and options to the frozen contract paths", async () => {
    resetArmadaMock({
      list: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0
    });
    await listHyperlinkTemplates({
      page: 1,
      pageSize: 20,
      name: "福利",
      messageType: 3,
      createdFrom: 1787846400000,
      createdTo: 1787932799999
    });
    await getHyperlinkTemplate(301);
    await listHyperlinkTemplateOptions({
      messageType: 3,
      keyword: "福利",
      limit: 50
    });

    assert.deepEqual(armadaCalls(), [
      {
        method: "get",
        url: "/api/hyperlink-templates",
        opts: {
          params: {
            page: 1,
            pageSize: 20,
            name: "福利",
            messageType: 3,
            createdFrom: 1787846400000,
            createdTo: 1787932799999
          }
        }
      },
      {
        method: "get",
        url: "/api/hyperlink-templates/301",
        opts: undefined
      },
      {
        method: "get",
        url: "/api/hyperlink-templates/options",
        opts: { params: { messageType: 3, keyword: "福利", limit: 50 } }
      }
    ]);
  });

  it("sends complete create and update objects without PATCH semantics", async () => {
    resetArmadaMock({ id: 301 });

    const { version: _version, ...createRequest } = completeUpdate;
    await createHyperlinkTemplate(createRequest);
    await updateHyperlinkTemplate(301, completeUpdate);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-templates",
        opts: { data: createRequest }
      },
      {
        method: "put",
        url: "/api/hyperlink-templates/301",
        opts: { data: completeUpdate }
      }
    ]);
  });

  it("copies and deletes one template through the contract endpoints", async () => {
    resetArmadaMock({ id: 302 });

    await copyHyperlinkTemplate(301);
    await deleteHyperlinkTemplate(302);

    assert.deepEqual(armadaCalls(), [
      {
        method: "post",
        url: "/api/hyperlink-templates/301/copy",
        opts: undefined
      },
      {
        method: "delete",
        url: "/api/hyperlink-templates/302",
        opts: undefined
      }
    ]);
  });

  it("uploads through the existing marketing image endpoint", async () => {
    resetArmadaMock({
      id: 99,
      originalFilename: "promo.jpg",
      contentType: "image/jpeg",
      sizeBytes: 3,
      url: "/api/marketing-template-files/99/content"
    });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "promo.jpg", {
      type: "image/jpeg"
    });

    const result = await uploadHyperlinkTemplateImage(file);

    assert.equal(result.id, 99);
    const [call] = armadaCalls();
    assert.equal(call.url, "/api/marketing-template-files");
    assert.ok(
      (call.opts as { data: FormData }).data.get("file") instanceof File
    );
    const headers = { "Content-Type": "application/json" };
    (
      call.config as {
        beforeRequestCallback: (config: { headers: typeof headers }) => void;
      }
    ).beforeRequestCallback({ headers });
    assert.deepEqual(headers, {});
  });

  it("downloads image content as a raw blob through the authorized client", async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
      type: "image/jpeg"
    });
    resetHttpMock(blob);

    const result = await downloadHyperlinkTemplateImage(88);

    assert.equal(result, blob);
    assert.equal(
      marketingTemplateFileContentUrl(88),
      "/api/marketing-template-files/88/content"
    );
    assert.deepEqual(httpCalls(), [
      {
        method: "get",
        url: "/api/marketing-template-files/88/content",
        opts: { responseType: "blob" }
      }
    ]);
  });
});
