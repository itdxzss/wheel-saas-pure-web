# Disable Commitlint Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Husky from validating commit messages while preserving commitlint configuration, dependencies, and all pre-commit checks.

**Architecture:** Replace the repository's `commit-msg` hook body with an explicit successful no-op. No package or lockfile changes are needed because commitlint remains installed for possible future reuse.

**Tech Stack:** Git, Husky 9, POSIX shell, commitlint

---

### Task 1: Disable the commit-message hook

**Files:**

- Modify: `.husky/commit-msg`
- Verify unchanged: `.husky/pre-commit`
- Verify unchanged: `commitlint.config.js`
- Verify unchanged: `package.json`
- Verify unchanged: `pnpm-lock.yaml`

- [ ] **Step 1: Record the current failing behavior**

Create a temporary commit-message file containing a non-conventional message and run the current hook:

```bash
message_file="$(mktemp)"
printf '%s\n' '拉群营销 间隔调整' > "$message_file"
.husky/commit-msg "$message_file"
```

Expected: exit code `1`, including `type may not be empty` and `subject may not be empty`.

- [ ] **Step 2: Replace the hook with an explicit no-op**

Set `.husky/commit-msg` to:

```sh
#!/bin/sh

# Commit message linting is intentionally disabled.
exit 0
```

Keep the file executable.

- [ ] **Step 3: Verify arbitrary messages are accepted**

Run:

```bash
.husky/commit-msg "$message_file"
```

Expected: exit code `0` with no commitlint output.

- [ ] **Step 4: Verify the change is isolated**

Run:

```bash
git diff --check -- .husky/commit-msg
git diff -- .husky/commit-msg
git diff --exit-code HEAD -- .husky/pre-commit commitlint.config.js package.json pnpm-lock.yaml
```

Expected: `git diff --check` succeeds; only `.husky/commit-msg` has a diff; the unchanged-file command exits `0`.

- [ ] **Step 5: Commit only the hook change**

Run:

```bash
git add -- .husky/commit-msg
git commit --no-verify --only .husky/commit-msg -m "chore: disable commitlint hook"
```

Expected: one commit containing only `.husky/commit-msg`; the user's already staged business files remain staged.
