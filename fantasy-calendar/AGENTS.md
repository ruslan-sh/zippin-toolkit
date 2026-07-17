# Purpose

This file applies to changes inside `fantasy-calendar/`. Preserve Fantasy
Calendar behavior and keep implementation, tests, and documentation
self-contained within this project folder.

# Module Boundaries

- Keep date and calendar calculations in `src/ts/calendar.ts`.
- Keep moon-specific calculations in `src/ts/moon.ts`.
- Keep UI behavior in `src/ts/render.ts` and presentation in `src/scss/`.
- Keep URL parsing and serialization in `src/ts/url-utils.ts`.
- Avoid unrelated refactors across these boundaries.

# Run and Validate

Run commands from the repository root:

- `npm run build`
- `npm test`
- `npm run lint`
- `npm run lint:styles`

Validation policy:

- Run `npm run build` for substantive calendar changes.
- In WSL, if the build hangs after webpack finishes, use
  `npx webpack --config webpack.prod.js --stats errors-warnings` and record the
  successful webpack result.
- Run `npm test` for calendar, moon, URL, or rendering behavior changes.
- Run `npm run lint` for TypeScript changes.
- Run `npm run lint:styles` for SCSS changes.
- Document any check that cannot run and the exact reason.

# Coding Guardrails

- Keep changes small and localized to the requested calendar behavior.
- Preserve existing naming, style, and module boundaries.
- Do not add dependencies unless explicitly required.
- Do not change shared webpack configuration unless calendar integration
  requires it.
- Do not edit generated files in the root `dist/` directory.
- Update `docs/` when current calendar behavior or architecture changes.

# Definition of Done

- The production build passes.
- Relevant tests and lint checks pass.
- Primary calendar interactions have no regressions.
- Calendar documentation reflects changed behavior where applicable.
- The change summary includes concrete verification evidence.
