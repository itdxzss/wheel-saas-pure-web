import { defineFakeRoute } from "vite-plugin-fake-server/client";
import { resolveMockBuyerRuntime } from "./buyer-runtime";
import { summarizeChannelStats } from "../src/views/buyer/channel-stats/domain/stats-format";

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

interface MockChannelStatsDaily {
  channelId: number;
  countryCode: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  serviceRate: number;
  otherFee: number;
  uv: number;
  visitDurationSeconds: number;
  loginRequestCount: number;
  loginRequestUserCount: number;
  loginSuccessCount: number;
  loginSuccessUserCount: number;
  unbindCount: number;
  version: number;
}

const statsDates = [
  "2026-07-11",
  "2026-07-12",
  "2026-07-13",
  "2026-07-14",
  "2026-07-15",
  "2026-07-16",
  "2026-07-17"
];

const channelStatsDaily: MockChannelStatsDaily[] = channels.flatMap(channel =>
  channel.countries.flatMap((countryCode, countryIndex) =>
    statsDates.map((date, dateIndex) => {
      const base = channel.id * 10 + countryIndex * 3 + dateIndex + 1;
      return {
        channelId: channel.id,
        countryCode,
        date,
        spend: base * 8,
        impressions: base * 120,
        clicks: base * 12,
        serviceRate: 0.05,
        otherFee: base,
        uv: base * 30,
        visitDurationSeconds: base * 18,
        loginRequestCount: base * 16,
        loginRequestUserCount: base * 12,
        loginSuccessCount: base * 9,
        loginSuccessUserCount: base * 7,
        unbindCount: Math.floor(base / 3),
        version: 1
      };
    })
  )
);

function statsRatio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : undefined;
}

function withStatsDerived<T extends MockChannelStatsDaily>(row: T) {
  const serviceFee = row.spend * row.serviceRate;
  return {
    ...row,
    clickRate: statsRatio(row.clicks, row.impressions),
    serviceFee,
    totalFee: row.spend + serviceFee + row.otherFee,
    loginRequestRate: statsRatio(row.loginRequestUserCount, row.uv),
    loginSuccessRate: statsRatio(
      row.loginSuccessUserCount,
      row.loginRequestUserCount
    ),
    visitorConversionRate: statsRatio(row.loginSuccessUserCount, row.uv),
    unbindRate: statsRatio(row.unbindCount, row.loginSuccessUserCount),
    accountCost: statsRatio(row.spend, row.loginSuccessCount)
  };
}

function aggregateChannelStats(
  channel: (typeof channels)[number],
  countryCode: string,
  startDate: string,
  endDate: string
) {
  const details = channelStatsDaily.filter(
    row =>
      row.channelId === channel.id &&
      row.countryCode === countryCode &&
      row.date >= startDate &&
      row.date <= endDate
  );
  const total = summarizeChannelStats(details);
  const country = channelOptions.countries.find(
    item => item.code === countryCode
  );
  const template = templates.find(item => item.id === channel.templateId);
  return {
    ...total,
    channelId: channel.id,
    countryCode,
    channelName: channel.name,
    channelCode: channel.channelCode,
    countryName: country?.name ?? countryCode,
    templateId: channel.templateId,
    templateName: template?.name ?? ""
  };
}

function listChannelStats(query: Record<string, unknown>) {
  const startDate = String(query.startDate || statsDates[0]);
  const endDate = String(query.endDate || statsDates[statsDates.length - 1]);
  const rows = channels.flatMap(channel =>
    channel.countries.map(countryCode =>
      aggregateChannelStats(channel, countryCode, startDate, endDate)
    )
  );
  const filtered = rows.filter(row => {
    const channel = channels.find(item => item.id === row.channelId);
    return (
      (!query.channelId || row.channelId === Number(query.channelId)) &&
      (!query.channelName ||
        row.channelName.includes(String(query.channelName).trim())) &&
      (!query.templateId || row.templateId === Number(query.templateId)) &&
      (!query.countryCode || row.countryCode === query.countryCode) &&
      (!query.creatorId || channel?.creatorId === Number(query.creatorId)) &&
      (!query.parentUserId ||
        channel?.parentUserId === Number(query.parentUserId))
    );
  });
  const allowlist = new Set([
    "spend",
    "impressions",
    "clicks",
    "totalFee",
    "uv",
    "loginSuccessUserCount",
    "unbindRate",
    "accountCost"
  ]);
  const sortBy = String(query.sortBy || "");
  if (allowlist.has(sortBy)) {
    const direction = query.sortOrder === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const left = Number((a as Record<string, unknown>)[sortBy]) || 0;
      const right = Number((b as Record<string, unknown>)[sortBy]) || 0;
      return (left - right) * direction;
    });
  }
  return filtered;
}

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
    url: "/api/buyer/channel-stats/options",
    method: "get",
    response: () =>
      success({
        channels: channels.map(({ id, name }) => ({ id, name })),
        templates: channelOptions.templates,
        countries: channelOptions.countries.map(({ code, name }) => ({
          code,
          name
        })),
        creators: channelOptions.creators,
        parentUsers: channelOptions.parentUsers
      })
  },
  {
    url: "/api/buyer/channel-stats",
    method: "get",
    response: ({ query }) => success(listChannelStats(query))
  },
  {
    url: "/api/buyer/channel-stats/:channelId/daily",
    method: "get",
    response: ({ params, query }) =>
      success(
        channelStatsDaily
          .filter(
            row =>
              row.channelId === Number(params.channelId) &&
              row.countryCode === query.countryCode &&
              row.date >= String(query.startDate) &&
              row.date <= String(query.endDate)
          )
          .map(withStatsDerived)
      )
  },
  {
    url: "/api/buyer/channel-stats/:channelId/daily/:date",
    method: "put",
    response: ({ params, body }) => {
      const channelId = Number(params.channelId);
      const row = channelStatsDaily.find(
        item =>
          item.channelId === channelId &&
          item.countryCode === body.countryCode &&
          item.date === params.date
      );
      if (!row) return { code: 404, message: "日明细不存在", data: null };
      if (row.version !== Number(body.version)) {
        return {
          code: "VERSION_CONFLICT",
          message: "数据已被其他人更新",
          data: null
        };
      }
      Object.assign(row, {
        spend: Number(body.spend),
        impressions: Number(body.impressions),
        clicks: Number(body.clicks),
        serviceRate: Number(body.serviceRate),
        otherFee: Number(body.otherFee),
        version: row.version + 1
      });
      const channel = channels.find(item => item.id === channelId);
      return channel
        ? success({
            daily: withStatsDerived(row),
            summary: aggregateChannelStats(
              channel,
              row.countryCode,
              String(body.startDate),
              String(body.endDate)
            )
          })
        : { code: 404, message: "渠道不存在", data: null };
    }
  },
  {
    url: "/api/buyer/channel-stats/export",
    method: "get",
    response: ({ query }) => {
      const rows = listChannelStats(query);
      return [
        "渠道,国家,模板,消耗,展示,点击,UV",
        ...rows.map(row =>
          [
            row.channelName,
            row.countryName,
            row.templateName,
            row.spend,
            row.impressions,
            row.clicks,
            row.uv
          ].join(",")
        )
      ].join("\n");
    }
  },
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
