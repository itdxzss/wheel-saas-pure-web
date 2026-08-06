import { armadaRequest } from "./armada";

export interface CaptchaResult {
  captchaId: string;
  imageBase64: string;
  expiresInSeconds: number;
}

export interface AuthUser {
  id: number;
  username: string;
  nickname?: string;
  roles: string[];
  permissions: string[];
}

/** Redis Bearer Token 登录结果。 */
export interface UserLoginResult {
  token: string;
  tokenType: "Bearer";
  idleTimeoutSeconds: number;
  absoluteExpiresAt: number;
  user: AuthUser;
  tenant: { id: number; code: string; name: string };
}

export interface UserLoginRequest {
  username: string;
  password: string;
  // 图片验证码暂时关闭；恢复时重新启用下列字段，并同步恢复登录页与后端校验。
  // captchaId: string;
  // captchaCode: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export const getCaptcha = () =>
  armadaRequest<CaptchaResult>("get", "/api/public/auth/captcha");

export const loginUser = (data: UserLoginRequest) =>
  armadaRequest<UserLoginResult>("post", "/api/public/auth/login", { data });

export const logoutUser = () => armadaRequest<void>("post", "/api/auth/logout");

export const changeOwnPassword = (data: PasswordChangeRequest) =>
  armadaRequest<void>("post", "/api/auth/change-password", { data });
