# Purpose

This file guides AI and human contributors making changes in this repository.
Prioritize minimal, focused diffs and preserve existing project boundaries
unless a task explicitly requires structural changes.

# Project Layout

- `app/src/`: Zippin's Toolkit landing page source and styles.
- `fantasy-calendar/`: Fantasy Calendar tool; see its scoped `AGENTS.md`.
- `specs/`: active repository-wide specifications, task trackers, and the
  follow-up roadmap.
- `webpack.*.js`, `tsconfig*.json`: shared build and TypeScript configuration.
- `dist/`: generated build output; do not edit it manually.

# Run and Validate

Core commands:

- `npm install`
- `npm run start`
- `npm run build`
- `npm test`
- `npm run lint`
- `npm run lint:styles`

Validation policy for substantive changes:

- Run `npm run build`.
- In WSL, if the build hangs after webpack finishes, use
  `npx webpack --config webpack.prod.js --stats errors-warnings` and note the
  successful webpack result.
- Run `npm test` for logic changes or behavior with unit coverage.
- Run `npm run lint` for JavaScript or TypeScript changes.
- Run `npm run lint:styles` for SCSS changes.
- Document any check that cannot run and the exact reason.

# Coding Guardrails

- Keep changes small and localized to the active task.
- Preserve naming, style, and module boundaries in touched projects.
- Keep shared dependencies and build orchestration at the repository root.
- Avoid new dependencies unless explicitly required.
- Do not refactor unrelated code in the same change.

# Change Workflow

1. Identify the affected project and shared integration points.
2. Implement the smallest viable change.
3. Run the required build, tests, and relevant lint checks.
4. Summarize behavior, files changed, verification, assumptions, and edge cases.

# Specs and Roadmap

- Record deferred feature ideas in `specs/roadmap.md` under the affected tool.
- Use a short kebab-case `h3` slug and a concise description that preserves
  enough context for a future `create-spec` run.
- Give every roadmap entry a status; use `in-progress` for an active spec and
  `planned` for deferred follow-up work.
- Keep work belonging to an active spec in that spec's task tracker rather than
  duplicating it in the roadmap.
- Remove a roadmap entry after its implemented spec is archived or when the
  work is intentionally dropped.

# Definition of Done

- The production build passes.
- Relevant tests and lint checks pass.
- Primary interactions in affected projects have no regressions.
- Generated output remains unedited and uncommitted.
- The change summary includes concrete verification evidence.

# Non-Goals and Cautions

- Do not modify shared build configuration unless the task requires it.
- Do not manually edit generated files in `dist/`.
- Do not broaden a tool-specific change into unrelated repository cleanup.
