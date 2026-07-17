import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { resolveMockBuyerRuntime } from "./buyer-runtime";

const templates = [
  {
    id: 1,
    code: "buyer_landing_default",
    name: "默认上量落地页",
    previewUrl: "https://picsum.photos/seed/buyer-template-1/720/960",
    subaccountVisible: true,
    supportedParams: ["channel_code", "phone", "invite_code"],
    remark: "默认模板",
    createdAt: "2026-07-01 10:00:00",
    updatedAt: "2026-07-16 18:30:00",
    runtimeVersion: "v1.4.0"
  },
  {
    id: 2,
    code: "buyer_landing_compact",
    name: "精简上量落地页",
    previewUrl: "https://picsum.photos/seed/buyer-template-2/720/960",
    subaccountVisible: false,
    supportedParams: ["channel_code", "invite_code"],
    remark: "",
    createdAt: "2026-07-05 09:20:00",
    updatedAt: "2026-07-15 11:10:00",
    runtimeVersion: "v1.2.1"
  }
];

const channelOptions = {
  countries: [
    { code: "US", name: "美国", dialCode: "+1" },
    { code: "GB", name: "英国", dialCode: "+44" },
    { code: "BR", name: "巴西", dialCode: "+55" }
  ],
  templates: templates.map(({ id, name }) => ({ id, name })),
  owners: [
    { id: 1, name: "运营一组" },
    { id: 2, name: "运营二组" }
  ],
  creators: [{ id: 1, name: "管理员" }],
  parentUsers: [{ id: 10, name: "总账户" }]
};

const channels = [
  {
    id: 1,
    name: "美国混合渠道",
    channelCode: "US001",
    ownerId: 1,
    targetCountry: "US",
    countryMode: "MIXED",
    countries: ["US", "GB", "BR"],
    templateId: 1,
    themeColor: "#409EFF",
    domain: "go.example.com",
    defaultDialCode: "+1",
    platform: "FACEBOOK",
    pixelId: "px-10001",
    accessTokenConfigured: true,
    eventLead: "Lead",
    eventInitiateCheckout: "InitiateCheckout",
    eventCompleteRegistration: "CompleteRegistration",
    openInApp: true,
    joinMarketing: true,
    status: "ENABLED",
    creatorId: 1,
    parentUserId: 10,
    domainStatus: "已生效",
    creatorName: "管理员",
    createdAt: "2026-07-17 10:00:00",
    occupied: true
  },
  {
    id: 2,
    name: "英国定向渠道",
    channelCode: "GB002",
    ownerId: 2,
    targetCountry: "GB",
    countryMode: "SPECIFIC",
    countries: ["GB"],
    templateId: 2,
    themeColor: "#67C23A",
    domain: "uk.example.com",
    defaultDialCode: "+44",
    platform: "TIKTOK",
    pixelId: "tt-20002",
    accessTokenConfigured: false,
    eventLead: "Lead",
    eventInitiateCheckout: "InitiateCheckout",
    eventCompleteRegistration: "CompleteRegistration",
    openInApp: false,
    joinMarketing: true,
    status: "ENABLED",
    creatorId: 1,
    parentUserId: 10,
    domainStatus: "已生效",
    creatorName: "管理员",
    createdAt: "2026-07-17 11:00:00",
    occupied: false
  }
];

function normalizeDomain(input: unknown) {
  return String(input ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

function channelConflict(
  domain: string,
  templateId: number,
  excludeChannelId?: number
) {
  return channels.find(
    item =>
      item.id !== excludeChannelId &&
      item.domain === domain &&
      item.templateId !== templateId
  );
}

function conflict() {
  return {
    code: "DOMAIN_TEMPLATE_CONFLICT",
    message: "该域名已经绑定其他模板",
    data: null
  };
}

function publicChannel(item: (typeof channels)[number]) {
  const template = templates.find(
    candidate => candidate.id === item.templateId
  );
  return {
    ...item,
    templateName: template?.name ?? "",
    promotionUrl: `https://${item.domain}/?channel_code=${item.channelCode}`,
    fissionUrl: `https://${item.domain}/invite?channel_code=${item.channelCode}`
  };
}

function channelDetail(item: (typeof channels)[number]) {
  const {
    channelCode: _channelCode,
    countries: _countries,
    creatorId: _creatorId,
    parentUserId: _parentUserId,
    domainStatus: _domainStatus,
    creatorName: _creatorName,
    createdAt: _createdAt,
    occupied: _occupied,
    ...detail
  } = item;
  return detail;
}

function success(data: unknown) {
  return { code: 0, message: "success", data };
}

export default defineFakeRoute([
  {
    url: "/api/buyer/templates",
    method: "get",
    response: () => success(templates)
  },
  {
    url: "/api/buyer/templates/:id/subaccount-visibility",
    method: "patch",
    response: ({ params, body }) => {
      const template = templates.find(item => item.id === Number(params.id));
      if (template)
        template.subaccountVisible = body.subaccountVisible === true;
      return success(null);
    }
  },
  {
    url: "/api/buyer/templates/:id/remark",
    method: "patch",
    response: ({ params, body }) => {
      const template = templates.find(item => item.id === Number(params.id));
      if (template) template.remark = String(body.remark ?? "").slice(0, 500);
      return success(null);
    }
  },
  {
    url: "/api/buyer/channels/options",
    method: "get",
    response: () => success(channelOptions)
  },
  {
    url: "/api/buyer/channels/domain-binding",
    method: "get",
    response: ({ query }) => {
      const domain = normalizeDomain(query.domain);
      const templateId = Number(query.templateId);
      const match = channels.find(
        item =>
          item.id !== Number(query.excludeChannelId) && item.domain === domain
      );
      return success({
        available: !match || match.templateId === templateId,
        templateId: match?.templateId
      });
    }
  },
  {
    url: "/api/buyer/channels",
    method: "get",
    response: ({ query }) => {
      const filtered = channels.filter(
        item =>
          (!query.targetCountry ||
            item.targetCountry === query.targetCountry) &&
          (!query.templateId || item.templateId === Number(query.templateId)) &&
          (!query.creatorId || item.creatorId === Number(query.creatorId)) &&
          (!query.parentUserId ||
            item.parentUserId === Number(query.parentUserId))
      );
      const page = Math.max(1, Number(query.page) || 1);
      const pageSize = Math.max(1, Number(query.page_size) || 30);
      return success({
        list: filtered
          .slice((page - 1) * pageSize, page * pageSize)
          .map(publicChannel),
        total: filtered.length
      });
    }
  },
  {
    url: "/api/buyer/channels/:id",
    method: "get",
    response: ({ params }) => {
      const item = channels.find(
        candidate => candidate.id === Number(params.id)
      );
      return item
        ? success(channelDetail(item))
        : { code: 404, message: "渠道不存在", data: null };
    }
  },
  {
    url: "/api/buyer/channels",
    method: "post",
    response: ({ body }) => {
      const domain = normalizeDomain(body.domain);
      const templateId = Number(body.templateId);
      if (channelConflict(domain, templateId)) return conflict();
      const id = Math.max(...channels.map(item => item.id)) + 1;
      const item = {
        ...channels[1],
        ...body,
        id,
        domain,
        templateId,
        channelCode: `CH${String(id).padStart(4, "0")}`,
        countries:
          body.countryMode === "MIXED"
            ? channelOptions.countries.map(item => item.code)
            : [body.targetCountry],
        accessTokenConfigured: Boolean(body.accessToken),
        creatorId: 1,
        parentUserId: 10,
        domainStatus: "发布成功",
        creatorName: "管理员",
        createdAt: new Date().toISOString(),
        occupied: false
      };
      Reflect.deleteProperty(item, "accessToken");
      channels.push(item);
      return success(channelDetail(item));
    }
  },
  {
    url: "/api/buyer/channels/:id",
    method: "put",
    response: ({ params, body }) => {
      const item = channels.find(
        candidate => candidate.id === Number(params.id)
      );
      if (!item) return { code: 404, message: "渠道不存在", data: null };
      const domain = normalizeDomain(body.domain);
      const templateId = Number(body.templateId);
      if (channelConflict(domain, templateId, item.id)) return conflict();
      const configured = body.accessToken ? true : item.accessTokenConfigured;
      Object.assign(item, body, {
        domain,
        templateId,
        accessTokenConfigured: configured,
        domainStatus: "发布成功"
      });
      Reflect.deleteProperty(item, "accessToken");
      return success(channelDetail(item));
    }
  },
  {
    url: "/api/buyer/channels/:id",
    method: "delete",
    response: ({ params }) => {
      const index = channels.findIndex(
        candidate => candidate.id === Number(params.id)
      );
      if (index < 0) return { code: 404, message: "渠道不存在", data: null };
      if (channels[index].occupied)
        return {
          code: "CHANNEL_OCCUPIED",
          message: "渠道仍被占用，无法删除",
          data: null
        };
      channels.splice(index, 1);
      return success(null);
    }
  },
  {
    url: "/api/buyer/channels/:id/detect",
    method: "post",
    response: ({ params }) =>
      channels.some(item => item.id === Number(params.id))
        ? success({
            success: true,
            summary: "域名、模板与事件发布状态正常（敏感凭证已脱敏）",
            checkedAt: new Date().toISOString()
          })
        : { code: 404, message: "渠道不存在", data: null }
  },
  {
    url: "/api/public/buyer/channel-runtime",
    method: "get",
    response: ({ query }) => {
      const runtime = resolveMockBuyerRuntime(
        channels,
        templates,
        String(query.host ?? ""),
        String(query.channelCode ?? "")
      );
      return runtime
        ? success(runtime)
        : { code: 404, message: "渠道不可用", data: null };
    }
  }
]);
