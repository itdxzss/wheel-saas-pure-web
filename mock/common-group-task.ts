import { defineFakeRoute } from "vite-plugin-fake-server/client";

const routes =
  process.env.NODE_ENV === "production"
    ? []
    : [
        {
          url: "/api/common-group-tasks",
          method: "post" as const,
          response: ({ body }) => {
            if (!body?.managerGroupId || !body?.groupCount) {
              return {
                code: 400,
                message: "普群任务参数不完整",
                data: null
              };
            }
            return {
              code: 0,
              message: "ok",
              data: {
                taskId: `CG-${Date.now()}`,
                createdAt: Date.now()
              }
            };
          }
        }
      ];

export default defineFakeRoute(routes);
