import { reactive } from "vue";
import type { FormRules } from "element-plus";
import {
  isValidPassword,
  PASSWORD_RULE_MESSAGE
} from "@/utils/password-policy";

/** 登录校验 */
const loginRules = reactive<FormRules>({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [
    {
      validator: (rule, value, callback) => {
        if (value === "") {
          callback(new Error("请输入密码"));
        } else if (!isValidPassword(value)) {
          callback(new Error(PASSWORD_RULE_MESSAGE));
        } else {
          callback();
        }
      },
      trigger: "blur"
    }
  ]
  // 图片验证码暂时关闭；恢复时重新启用该规则，并同步恢复登录页与后端校验。
  // captchaCode: [
  //   { required: true, message: "请输入图片验证码", trigger: "blur" },
  //   { min: 4, max: 4, message: "验证码为4位", trigger: "blur" }
  // ]
});

export { loginRules };
