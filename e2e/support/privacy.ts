import type { Page } from "@playwright/test";

const loginFieldSelector = [
  'input[placeholder="用户名"]',
  'input[placeholder="密码"]',
  'input[placeholder="图片验证码"]',
  'input[type="password"]',
  'input[autocomplete="current-password"]',
  'input[autocomplete="new-password"]'
].join(", ");

/**
 * 清空登录 DOM 中的凭据。Playwright 失败报告会自动采集页面可访问性快照，
 * 所以异常路径也必须在测试结束前擦除输入值。
 */
export async function clearLoginFields(page: Page): Promise<void> {
  await page
    .locator(loginFieldSelector)
    .evaluateAll(inputs => {
      for (const input of inputs) {
        if (!(input instanceof HTMLInputElement)) continue;
        input.value = "";
        input.removeAttribute("value");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    })
    .catch(() => undefined);
}

/** 标记截图中可能含账号、凭据、代理或 WhatsApp 标识的数据。 */
export async function markSensitiveScreenshotContent(
  page: Page,
  sensitiveTexts: readonly string[] = []
): Promise<void> {
  const exactSensitiveTexts = sensitiveTexts
    .map(value => value.trim())
    .filter(Boolean);

  await page.evaluate(
    ({ exactSensitiveTexts }) => {
      const marker = "data-armada-e2e-mask";
      const sensitiveLabel =
        /手机号|手机号码|电话号码|账号|用户名|凭据|密码|密钥|令牌|资源|代理|IP地址|phone|mobile|account|username|credential|password|secret|token|authorization|resource|proxy|host|endpoint|\bip\b|jid/i;
      const sensitiveValue =
        /(?:\b(?:\d{1,3}\.){3}\d{1,3}\b|\+?\d(?:[\s().-]*\d){8,}|\b\d{5,}(?::\d+)?@(?:s\.whatsapp\.net|g\.us)\b|chat\.whatsapp\.com\/|Bearer\s+\S+)/i;
      const sensitiveTextSet = new Set(exactSensitiveTexts);
      const mark = (element: Element | null): void => {
        if (element instanceof HTMLElement)
          element.setAttribute(marker, "true");
      };

      document
        .querySelectorAll(
          '[data-sensitive], input[type="password"], input[autocomplete="current-password"], input[autocomplete="new-password"]'
        )
        .forEach(mark);

      // pure-admin 三种导航布局都会把当前用户放在这个退出登录触发器中。
      document
        .querySelectorAll(".el-dropdown-link.navbar-bg-hover")
        .forEach(mark);

      document.querySelectorAll(".el-table, table").forEach(table => {
        const headers = Array.from(table.querySelectorAll("thead th"));
        headers.forEach((header, index) => {
          if (!sensitiveLabel.test(header.textContent ?? "")) return;
          table.querySelectorAll("tbody tr").forEach(row => {
            mark(row.children.item(index));
          });
        });
      });

      document
        .querySelectorAll(
          "label, .el-form-item__label, .el-descriptions__label, dt"
        )
        .forEach(label => {
          if (!sensitiveLabel.test(label.textContent ?? "")) return;
          const field = label.closest(
            ".el-form-item, .el-descriptions__cell, .el-descriptions__row, dl"
          );
          if (!field) return;
          field
            .querySelectorAll(
              "input, textarea, .el-form-item__content, .el-descriptions__content, dd"
            )
            .forEach(mark);
        });

      document.querySelectorAll("body *").forEach(element => {
        if (element.children.length > 0) return;
        const text = element.textContent?.trim();
        if (text && (sensitiveValue.test(text) || sensitiveTextSet.has(text))) {
          mark(element);
        }
      });
    },
    { exactSensitiveTexts }
  );
}

export async function takeMaskedScreenshot(
  page: Page,
  path: string,
  sensitiveTexts: readonly string[] = []
): Promise<void> {
  await markSensitiveScreenshotContent(page, sensitiveTexts);
  await page.screenshot({
    path,
    fullPage: true,
    mask: [page.locator('[data-armada-e2e-mask="true"]')],
    maskColor: "#111827"
  });
}
