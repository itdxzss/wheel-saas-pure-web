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
  captchaId: string;
  captchaCode: string;
}

export const getCaptcha = () =>
  armadaRequest<CaptchaResult>("get", "/api/public/auth/captcha");

export const loginUser = (data: UserLoginRequest) =>
  armadaRequest<UserLoginResult>("post", "/api/public/auth/login", { data });

export const logoutUser = () => armadaRequest<void>("post", "/api/auth/logout");
