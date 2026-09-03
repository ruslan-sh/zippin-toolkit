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

On Windows, do not probe for `npm` on `PATH`. Invoke
`C:\nvm4w\nodejs\npm.cmd` directly for every npm command, and use
`C:\nvm4w\nodejs\npx.cmd` for npx commands. If the managed sandbox reports
`Access is denied`, request escalation for that same command. Do not switch
package managers, reinstall dependencies, or run dependency reconciliation as
a workaround.

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
2. Before implementation, mark the selected spec task `in-progress`; treat that
   status as an ownership claim and do not start work another agent has claimed.
3. Implement the smallest viable change.
4. Run the required build, tests, and relevant lint checks.
5. Run the pre-completion validation gate while the task remains `in-progress`.
6. After a clean gate, mark the task `done` without rerunning validation solely
   for that status change.
7. Summarize behavior, files changed, verification, assumptions, and edge cases.

# Branches and Commits

- Follow `docs/contributing.md` for branch and commit naming.
- Use a typed, lowercase kebab-case branch such as
  `feat/monster-cr-mode-support`. Coding tools follow the same convention as
  every other contributor; do not substitute a tool name for the branch type.
- Use Conventional Commit subjects such as
  `feat(encounter): support monster challenge ratings`.
- Do not rewrite existing history solely to apply the convention.

# Specs and Roadmap

## Model routing

- The primary coordinator must use Sol with low reasoning. It handles design
  questions, difficult debugging, independent-review remediation, and the final
  verification gate.
- For approved implementation and routine fixes, automatically delegate one
  coherent scope to `toolkit_implementer`. Give it the ownership context,
  acceptance criteria, artifact paths, and required checks. It acts on the
  primary agent's ownership claim, does not claim tasks itself, and does not
  recursively delegate.
- Reuse the implementation worker for related work. Do not repeat its
  exploration or passing checks unless a concrete risk or the mandatory gate
  requires it.
- Use a fresh `toolkit_reviewer` for every independent-review iteration. The
  reviewer is read-only. The primary agent owns all remediation and keeps the
  three-iteration limit.
- If a required role is unavailable, or the coordinator is not Sol with low
  reasoning, report the issue and ask the user for guidance. Do not silently
  select another model or use self-review.

## Repository-managed OpenSpec integration

### Mandatory verification gate

- Before verifying an OpenSpec change, delete its existing ignored receipt and
  use a fresh independent read-only reviewer. The reviewer must compare the
  implementation with all change artifacts and report concrete findings; it
  must not edit files. The primary agent owns every remediation.
- Allow at most three review-and-fix iterations, with a fresh reviewer for each
  iteration. There is no self-review fallback. Stop and ask the user for help
  when an independent reviewer is unavailable or iteration three is not clean.
- After a clean review, run without waivers: `npm run roadmap:validate`,
  `npm run workflow:validate`, `npm run openspec:check`, strict pinned OpenSpec
  validation, `npm test`, `npm run lint`, `npm run lint:styles`,
  `npm run build`, and `git diff --check`. A failure consumes the iteration.
- Record concise evidence in the active change's `verification.md`, then run
  `npm run opsx:record-verification -- <slug>`. Any later non-ignored edit
  makes the receipt stale and requires the complete gate again.

- Files under `.codex/skills/openspec-*` are generated by the pinned OpenSpec
  package. Do not edit them by hand; use `npm run openspec:update` and review
  the regenerated diff.
- Generated `$openspec-verify-change` guidance is advisory. The root agent must
  require the repository's independent read-only review, complete no-waiver
  validation suite, `verification.md`, and fresh verification receipt before
  an OpenSpec change is treated as verified.
- Generated `$openspec-archive-change` guidance is advisory. Raw `openspec
  archive` is unsupported; the root agent must use `npm run opsx:archive --
  <slug>` so receipt, synchronization, roadmap cleanup, locking, and rollback
  requirements cannot be skipped.
- Raw OpenSpec archival is unsupported; repository automation and agents must
  use `npm run opsx:archive -- <slug>`.
- Repository-specific OpenSpec behavior belongs in this file,
  `openspec/config.yaml`, repository scripts, and automated tests. It must not
  be added through hand edits to generated skills.

## Authoritative change workflow

- `specs/roadmap.yml` is the only intake queue. Add backlog work with
  `npm run roadmap:add -- --area <area> --slug <slug> --description <text>` and
  repeated `--prerequisite <slug>` arguments when needed.
- Discussion and `$openspec-explore` are read-only. For selected work, use the
  generated Codex skills `$openspec-propose`, `$openspec-apply-change`,
  `$openspec-verify-change`, and `$openspec-archive-change`.
- Selection must begin with `npm run opsx:select -- <slug>`. The same-slug
  active directory is the ownership claim. Do not create persistent OpenSpec
  changes through another route.
- Verification follows the mandatory gate above. Archive only with
  `npm run opsx:archive -- <slug>` after a fresh receipt exists.
- See `docs/openspec-workflow.md` for the full contributor procedure.

## One-time legacy bootstrap

- The retained `$spec-*` skills and `.codex/agents/spec-validator.toml` are
  legacy. They may only finish, validate, and finalize
  `migrate-agentic-flow-to-open-spec`; they cannot authorize new work.
- Only that bootstrap may read `specs/roadmap-legacy.md`. All later selected
  work uses OpenSpec.

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
