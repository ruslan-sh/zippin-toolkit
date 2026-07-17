# Purpose

This file applies to changes inside `encounter-difficulty-calculator/`. Preserve
the calculator's existing party, encounter, persistence, and import/export
behavior while keeping implementation, tests, and documentation self-contained
within this project folder.

# Module Boundaries

- Keep threshold and difficulty calculations independent from DOM code.
- Keep party UI behavior in `src/party-ui.ts` and encounter UI behavior in
  `src/encounter-ui.ts`.
- Keep the source workspace schema in `src/workspace-state.ts` and storage,
  YAML, and import responsibilities in their existing modules.
- Keep shared theme changes in `../shared/` and avoid unrelated cross-tool
  refactors.

# Run and Validate

Run commands from the repository root:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run lint:styles`

Validation policy:

- Run `npm run build` for substantive calculator changes.
- In WSL, if the build hangs after webpack finishes, use
  `npx webpack --config webpack.prod.js --stats errors-warnings` and record the
  successful webpack result.
- Run `npm test` for calculator, workspace, persistence, YAML, or UI behavior
  changes.
- Run `npm run lint` for TypeScript changes.
- Run `npm run lint:styles` for SCSS changes.
- Document any check that cannot run and the exact reason.

# Coding Guardrails

- Keep changes small and localized to the requested calculator behavior.
- Preserve versioned workspace compatibility unless a specification explicitly
  requires a migration.
- Preserve validation, accessibility, and import rollback behavior when
  changing repeated controls or persistence flows.
- Do not add dependencies unless explicitly required.
- Do not edit generated files in the root `dist/` directory.
- Update `docs/calculator.md` when current behavior or architecture changes.

# Definition of Done

- The production build passes.
- Relevant tests and lint checks pass.
- Primary calculator interactions have no regressions.
- Calculator documentation reflects changed behavior where applicable.
- The change summary includes concrete verification evidence.
