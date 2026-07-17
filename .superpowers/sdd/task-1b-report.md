# Task 1B Report: Buyer template management

## Status

Implemented the buyer template API, development fake endpoints, focused page state, preview/remark dialogs, and the template list page. No menu, channel, or statistics files were changed.

## Delivered behavior

- `GET /api/buyer/templates` lists template rows with the specified fields.
- Visibility and remark updates use the required PATCH endpoints and payloads.
- Visibility changes are optimistic and restore the previous row value when the request fails.
- Remark editing rehydrates from the selected row, trims on save, accepts an empty value, and rejects text longer than 500 characters.
- The page contains only the required table, refresh/column settings, preview, visibility, and remark controls.
- Visibility and remark controls use `tenant:buyer-template:visibility` and `tenant:buyer-template:remark`.
- Fake buyer data is isolated under `mock/buyer.ts`.

## TDD evidence

RED command:

```text
node --import ./src/api/__tests__/node-test-alias.mjs --test src/api/buyer-template.test.ts src/views/buyer/template/composables/useBuyerTemplatePage.test.ts src/views/buyer/template/BuyerTemplateIndex.test.ts
```

Initial result: 0 passed, 3 failed because `buyer-template.ts`, `useBuyerTemplatePage.ts`, and `index.vue` did not exist.

GREEN result: 7 passed, 0 failed.

## Verification

- Core Node tests: 7 passed, 0 failed.
- `pnpm typecheck`: passed (`tsc --noEmit && vue-tsc --noEmit --skipLibCheck`).
- `git diff --check`: passed.
- Vue file sizes: 204, 39, and 39 lines; all below 600 lines.
- An extra `pnpm build` attempt was blocked by the isolated worktree having no local `node_modules`; `vite-plugin-cdn-import` could not locate `vue/package.json`. Type checking and the focused tests both resolve through the parent installation and pass.

## Files

- `src/api/buyer-template.ts` and focused test
- `mock/buyer.ts`
- `src/views/buyer/template/index.vue`
- `src/views/buyer/template/components/BuyerTemplatePreviewDialog.vue`
- `src/views/buyer/template/components/BuyerTemplateRemarkDialog.vue`
- `src/views/buyer/template/composables/useBuyerTemplatePage.ts` and focused test
- `src/views/buyer/template/BuyerTemplateIndex.test.ts`
