import { defineFakeRoute } from "vite-plugin-fake-server/client";

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
      if (template) template.subaccountVisible = body.subaccountVisible === true;
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
  }
]);
