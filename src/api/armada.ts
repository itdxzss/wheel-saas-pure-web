import { http } from "@/utils/http";
import type { AxiosRequestConfig } from "axios";
import type {
  PureHttpRequestConfig,
  RequestMethods
} from "@/utils/http/types.d";
import { removeToken } from "@/utils/auth";
import { isUnauthorizedBusinessCode } from "@/router/auth-access";

/** armada 统一响应信封。code=0 成功,非 0 业务错误(HTTP 仍 200)。 */
export interface ArmadaResp<T> {
  code: number;
  message: string;
  data: T;
}

/** 保留服务端稳定业务码，供必须按合同分支的交互（例如乐观锁冲突）使用。 */
export class ArmadaApiError extends Error {
  readonly businessCode: number;
  readonly code: number;
  readonly data: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "ArmadaApiError";
    this.businessCode = code;
    this.code = code;
    this.data = data;
  }
}

export function hasArmadaBusinessCode(
  error: unknown,
  expected: number
): boolean {
  return error instanceof ArmadaApiError && error.businessCode === expected;
}
/**
 * 调 armada 接口并按信封拆包:code===0 返回 data,否则抛 Error(message)。
 * 业务页/登录统一用它,避免每处手写 code 判定。
 */
export async function armadaRequest<T>(
  method: RequestMethods,
  url: string,
  opts?: AxiosRequestConfig,
  config?: PureHttpRequestConfig
): Promise<T> {
  const resp = await http.request<ArmadaResp<T>>(method, url, opts, config);
  if (!resp || resp.code !== 0) {
    if (isUnauthorizedBusinessCode(resp?.code)) {
      removeToken();
      if (window.location.hash !== "#/login") {
        window.location.replace(`${window.location.origin}/#/login`);
      }
    }
    throw new ArmadaApiError(
      resp?.code ?? -1,
      resp?.message ?? "请求失败",
      resp?.data
    );
  }
  return resp.data;
}
