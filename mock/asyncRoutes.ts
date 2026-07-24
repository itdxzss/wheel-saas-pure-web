// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */
const permissionRouter = {
  path: "/permission",
  meta: {
    title: "权限管理",
    icon: "ep:lollipop",
    rank: 10
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "页面权限",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "按钮权限",
        roles: ["admin", "common"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "路由返回按钮权限",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "登录接口返回按钮权限"
          }
        }
      ]
    }
  ]
};

const accountRouter = {
  path: "/account",
  meta: {
    title: "账号管理",
    icon: "ep:user",
    rank: 2,
    module_key: "account"
  },
  children: [
    {
      path: "/account/index",
      component: "account/index/index",
      name: "AccountIndex",
      meta: {
        title: "账号列表",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account:view"
      }
    },
    {
      path: "/account/group/index",
      component: "account/group/index",
      name: "AccountGroup",
      meta: {
        title: "账号分组",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account-group:view"
      }
    },
    {
      path: "/account/import",
      component: "account/import/index",
      name: "AccountImport",
      meta: {
        title: "账号导入",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "account",
        perm_key: "tenant:account:edit"
      }
    }
  ]
};

const groupRouter = {
  path: "/group",
  meta: {
    title: "群组管理",
    icon: "ep:chat-dot-round",
    rank: 3,
    module_key: "group_management"
  },
  children: [
    {
      path: "/task/group-link/imports",
      component: "group/imports/index",
      name: "TaskGroupLinkImports",
      meta: {
        title: "导入链接",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "group_link",
        perm_key: "tenant:group_link:view"
      }
    },
    {
      path: "/group/list",
      component: "group/list/index",
      name: "GroupList",
      meta: {
        title: "群组列表",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "ws_group",
        perm_key: "tenant:group_link:view"
      }
    },
    {
      path: "/group/history",
      component: "group/history/index",
      name: "HistoricalGroupManagement",
      meta: {
        title: "历史群管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "historical_group",
        perm_key: "tenant:historical_group:view"
      }
    }
  ]
};

const taskRouter = {
  path: "/task",
  meta: {
    title: "任务中心",
    icon: "ep:list",
    rank: 4,
    module_key: "pull_task"
  },
  children: [
    {
      path: "/task/pull",
      component: "task/pull-task/index",
      name: "TaskPull",
      meta: {
        title: "拉群任务",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "pull_task",
        perm_key: "tenant:pull_task:view"
      }
    },
    {
      path: "/task/join",
      component: "task/join-task/index",
      name: "TaskJoin",
      meta: {
        title: "进群任务",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "join_task",
        perm_key: "tenant:join_task:view"
      }
    },
    {
      path: "/task/group-marketing",
      component: "task/group-marketing/index",
      name: "TaskGroupMarketing",
      meta: {
        title: "营销任务",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "marketing_task",
        perm_key: "tenant:marketing_task:view"
      }
    },
    {
      path: "/task/group-pull-marketing",
      component: "task/group-pull-marketing/index",
      name: "TaskGroupPullMarketing",
      meta: {
        title: "拉群营销",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "group_pull_marketing",
        perm_key: "tenant:group_pull_marketing:view"
      }
    },
    {
      path: "/task/group-pull-marketing/:id",
      component: "task/group-pull-marketing/detail/index",
      name: "TaskGroupPullMarketingDetail",
      meta: {
        title: "拉群营销明细",
        showLink: false,
        activePath: "/task/group-pull-marketing",
        roles: ["admin", "common"],
        module_key: "group_pull_marketing",
        perm_key: "tenant:group_pull_marketing:view"
      }
    },
    {
      path: "/task/group-creation-marketing",
      component: "task/group-creation-marketing/index",
      name: "TaskGroupCreationMarketing",
      meta: {
        title: "建群营销",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "group_creation_marketing",
        perm_key: "tenant:group_creation_marketing:view"
      }
    }
  ]
};

const materialRouter = {
  path: "/material",
  meta: {
    title: "素材管理",
    icon: "ep:collection",
    rank: 5,
    module_key: "material_management"
  },
  children: [
    {
      path: "/task/marketing",
      component: "material/marketing-template/index",
      name: "TaskMarketingTemplate",
      meta: {
        title: "营销模版",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "marketing_template",
        perm_key: "tenant:marketing_template:view"
      }
    }
  ]
};

const resourceRouter = {
  path: "/resource",
  meta: {
    title: "资源管理",
    icon: "ep:connection",
    rank: 6,
    module_key: "resource_management"
  },
  children: [
    {
      path: "/resource/ip",
      component: "resource/ip/index",
      name: "ResourceIp",
      meta: {
        title: "IP 管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "resource_ip",
        perm_key: "tenant:resource:ips:list"
      }
    },
    {
      path: "/resource/ip-stats",
      component: "resource/ip-stats/index",
      name: "ResourceIpStats",
      meta: {
        title: "IP 数据统计",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "resource_ip_stats",
        perm_key: "tenant:resource:ip-stats:list"
      }
    }
  ]
};

const systemRouter = {
  path: "/system",
  meta: {
    title: "系统管理",
    icon: "ep:setting",
    rank: 8,
    module_key: "system_management"
  },
  children: [
    {
      path: "/system/user",
      component: "system/user/index",
      name: "SystemUser",
      meta: {
        title: "用户管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "system_management",
        perm_key: "tenant:system-user:view"
      }
    },
    {
      path: "/system/role",
      component: "system/role/index",
      name: "SystemRole",
      meta: {
        title: "角色管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "system_management",
        perm_key: "tenant:system-role:view"
      }
    },
    {
      path: "/system/menu",
      component: "system/menu/index",
      name: "SystemMenu",
      meta: {
        title: "菜单管理",
        roles: ["admin", "common"],
        showParent: true,
        module_key: "system_management",
        perm_key: "tenant:system-menu:view"
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        success: true,
        data: [
          accountRouter,
          groupRouter,
          taskRouter,
          materialRouter,
          resourceRouter,
          systemRouter,
          permissionRouter
        ]
      };
    }
  }
]);
