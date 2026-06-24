import { http } from "@/utils/http";
import type { AxiosRequestConfig } from "axios";
import type { RequestMethods } from "@/utils/http/types.d";

/** armada 统一响应信封。code=0 成功,非 0 业务错误(HTTP 仍 200)。 */
export interface ArmadaResp<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 调 armada 接口并按信封拆包:code===0 返回 data,否则抛 Error(message)。
 * 业务页/登录统一用它,避免每处手写 code 判定。
 */
export async function armadaRequest<T>(
  method: RequestMethods,
  url: string,
  opts?: AxiosRequestConfig
): Promise<T> {
  const resp = await http.request<ArmadaResp<T>>(method, url, opts);
  if (!resp || resp.code !== 0) {
    throw new Error(resp?.message ?? "请求失败");
  }
  return resp.data;
}
