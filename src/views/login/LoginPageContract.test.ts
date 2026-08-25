import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("./index.vue", import.meta.url), "utf8");
const rules = readFileSync(new URL("./utils/rule.ts", import.meta.url), "utf8");
const activePage = page
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const activeRules = rules.replace(/^\s*\/\/.*$/gm, "");

describe("login page", () => {
  it("does not prefill a fixed username", () => {
    assert.match(page, /username:\s*""/);
    assert.doesNotMatch(page, /username:\s*["']admin["']/i);
  });

  it("temporarily logs in without loading or submitting a captcha", () => {
    assert.doesNotMatch(activePage, /getCaptcha\s*\(/);
    assert.doesNotMatch(activePage, /prop="captchaCode"/);
    assert.doesNotMatch(activePage, /captchaId:\s*ruleForm\.captchaId/);
    assert.doesNotMatch(activePage, /captchaCode:\s*ruleForm\.captchaCode/);
    assert.doesNotMatch(activeRules, /captchaCode/);

    assert.match(page, /图片验证码暂时关闭/);
    assert.match(rules, /图片验证码暂时关闭/);
    assert.match(page, /getCaptcha/);
    assert.match(page, /prop="captchaCode"/);
  });

  it("ends the login attempt when dynamic menu loading fails", () => {
    assert.match(activePage, /initRouter\(\)[\s\S]*?\.catch\(/);
    assert.match(activePage, /removeToken\(\)/);
    assert.match(activePage, /菜单加载失败/);
  });
});
