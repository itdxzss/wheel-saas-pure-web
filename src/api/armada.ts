import { http } from "@/utils/http";
import type { AxiosRequestConfig } from "axios";
import type {
  PureHttpRequestConfig,
  RequestMethods
} from "@/utils/http/types.d";

/** armada 统一响应信封。code=0 成功,非 0 业务错误(HTTP 仍 200)。 */
export interface ArmadaResp<T> {
  code: number | string;
  message: string;
  data: T;
}

export class ArmadaBusinessError extends Error {
  readonly code: number | string;
  readonly data: unknown;

  constructor(message: string, code: number | string, data: unknown) {
    super(message);
    this.name = "ArmadaBusinessError";
    this.code = code;
    this.data = data;
  }
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
    if (!resp) throw new Error("请求失败");
    throw new ArmadaBusinessError(
      resp.message || "请求失败",
      resp.code,
      resp.data
    );
  }
  return resp.data;
}
