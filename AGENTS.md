# Purpose

This file guides AI and human contributors making changes in this repository.
Prioritize minimal, focused diffs and preserve existing project boundaries
unless a task explicitly requires structural changes.

# Project Layout

- `app/src/`: Zippin's Toolkit landing page source and styles.
- `encounter-difficulty-calculator/`: Encounter Difficulty Calculator; see its
  scoped `AGENTS.md`.
- `fantasy-calendar/`: Fantasy Calendar tool; see its scoped `AGENTS.md`.
- `shared/`: shared theme source used by the landing page and tools.
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

# Branches and Commits

- Follow `docs/contributing.md` for branch and commit naming.
- Use a typed, lowercase kebab-case branch such as
  `feat/monster-cr-mode-support`. Coding tools follow the same convention as
  every other contributor; do not substitute a tool name for the branch type.
- Use Conventional Commit subjects such as
  `feat(encounter): support monster challenge ratings`.
- Do not rewrite existing history solely to apply the convention.

# Specs and Roadmap

- Record deferred feature ideas in `specs/roadmap.md` under the affected tool.
- Use a short kebab-case `h3` slug and a concise description that preserves
  enough context for a future `spec-create` run.
- Give every roadmap entry a `Status` and `Prerequisite` field. Use
  `in-progress` for an active spec and `planned` for deferred follow-up work.
  Set `Prerequisite: none` when the item is unblocked; otherwise list the
  prerequisite roadmap slugs.
- Do not create a spec or task tracker for a roadmap item while any listed
  prerequisite remains. A prerequisite is satisfied when its implemented spec
  is archived and its slug is removed from the dependent entry.
- Keep work belonging to an active spec in that spec's task tracker rather than
  duplicating it in the roadmap.
- Remove a roadmap entry after its implemented spec is archived or when the
  work is intentionally dropped. When removing an implemented entry, also
  remove its slug from every dependent entry and set `Prerequisite: none` when
  the final prerequisite is removed.

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
