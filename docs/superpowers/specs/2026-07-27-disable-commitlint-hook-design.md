# Disable Commitlint Git Hook

## Goal

Allow commits with arbitrary messages while retaining the project's commitlint dependencies and configuration for possible future reuse.

## Design

- Keep `commitlint.config.js` and all `@commitlint/*` development dependencies unchanged.
- Keep Husky and `.husky/pre-commit` unchanged so staged-file checks continue to run.
- Turn `.husky/commit-msg` into a no-op by removing the deprecated Husky bootstrap and the `commitlint` command, leaving a short comment that documents why the hook is intentionally disabled.

## Verification

- Confirm `.husky/commit-msg` exits successfully when invoked with a non-conventional commit message file.
- Confirm no `commitlint` command remains in the hook.
- Confirm package manifests and the pre-commit hook remain unchanged.

