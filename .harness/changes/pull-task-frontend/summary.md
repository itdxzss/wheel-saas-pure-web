# Pull Task Frontend

## Scope
- Add the SaaS pull-task page under `/task/pull`.
- Keep the implementation inside `wheel-saas-pure-web` frontend only.
- Use existing pure-admin-thin / Element Plus controls and API wrappers.

## Source Alignment
- Old wheel route: `/task/pull`, `module_key=pull_task`, `perm_key=tenant:pull_task:view`.
- Armada phase-one requirement sheet: first slice focuses old-group-link pull tasks; auto/self-built group modes remain represented as frontend fields but are not faked.

## Files
- `mock/asyncRoutes.ts`
- `src/api/pull-task.ts`
- `src/views/task/pull-task/**`
- `scripts/verify-pull-task-menu.mjs`

## Verification
- `node scripts/verify-pull-task-menu.mjs`
- `npm run typecheck`
- targeted eslint/stylelint for new pull-task files
- `npm run build`
