import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import { useMultiTagsStoreHook } from "./multiTags";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";
import {
  loginUser,
  logoutUser,
  type UserLoginRequest,
  type UserLoginResult
} from "@/api/auth";

interface LoginActionResult {
  success: boolean;
  data?: UserLoginResult;
  message?: string;
}

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    avatar: storageLocal().getItem<DataInfo<number>>(userKey)?.avatar ?? "",
    // 用户名
    username: storageLocal().getItem<DataInfo<number>>(userKey)?.username ?? "",
    // 昵称
    nickname: storageLocal().getItem<DataInfo<number>>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<DataInfo<number>>(userKey)?.permissions ?? [],
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 使用用户名、密码和一次性图片验证码登录。 */
    async loginByUsername(data: UserLoginRequest) {
      return new Promise<LoginActionResult>(resolve => {
        loginUser(data)
          .then(res => {
            setToken({
              accessToken: res.token,
              refreshToken: "",
              expires: new Date(res.absoluteExpiresAt),
              username: res.user.username,
              nickname: res.user.nickname ?? res.user.username,
              roles: res.user.roles,
              permissions: res.user.permissions
            });
            resolve({ success: true, data: res });
          })
          .catch((error: unknown) => {
            resolve({
              success: false,
              message: error instanceof Error ? error.message : "登录失败"
            });
          });
      });
    },
    /** 服务端退出后清理本地身份；接口失效时也必须完成本地清理。 */
    logOut() {
      const clear = () => {
        this.username = "";
        this.roles = [];
        this.permissions = [];
        removeToken();
        useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
        resetRouter();
        router.push("/login");
      };
      logoutUser().finally(clear);
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
