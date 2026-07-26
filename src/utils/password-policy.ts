/** 密码规则提示，供登录、创建用户和重置密码保持同一口径。 */
export const PASSWORD_RULE_MESSAGE =
  "密码须为8-18位，且由字母、数字、符号中的至少两类组成";

/**
 * 密码仅允许 8-18 位可见 ASCII 字符，且至少包含字母、数字、符号中的两类。
 * 排除空格及中文，避免前后端对不可见字符或字符长度产生不同解释。
 */
export const PASSWORD_PATTERN =
  /^(?![A-Za-z]+$)(?![0-9]+$)(?![^A-Za-z0-9]+$)[\x21-\x7E]{8,18}$/;

/** 判断密码是否符合系统统一规则。 */
export function isValidPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value);
}
