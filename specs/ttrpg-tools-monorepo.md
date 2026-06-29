# Zippin Toolkit Monorepo

## Summary

Restructure the repository to host multiple TTRPG tools. Add a small landing
app at the GitHub Pages root and move Fantasy Calendar into its own project
folder, available at a stable subpath. Keep one root Node toolchain and shared
commands for all projects.

## Goals

- Make `app/` the repository and GitHub Pages entry point.
- Move all Fantasy Calendar implementation, tests, documentation, and planning
  history into `fantasy-calendar/`.
- Keep dependencies and build/test/lint orchestration at the repository root.
- Build and serve every project through shared root commands.
- Preserve Fantasy Calendar behavior and direct date links at its new path.
- Establish a layout where more tools can be added without restructuring again.

## Non-Goals

- Adding another tool beyond the landing app and Fantasy Calendar.
- Changing Fantasy Calendar behavior, design, or known constraints.
- Introducing separate package dependencies or package manifests per tool.
- Extracting shared UI components or runtime libraries prematurely.
- Preserving the calendar at the old GitHub Pages root; that URL becomes the
  landing app.

## Current Behavior

The repository builds one Fantasy Calendar application from root-level `src/`
and `tests/` directories into `dist/`. GitHub Pages publishes that directory,
so the calendar currently occupies the deployment root.

## Target Structure

The intended high-level structure is:

```text
app/
  src/
fantasy-calendar/
  src/
  tests/
  docs/
  specs/archive/
  TODO
specs/
package.json
package-lock.json
webpack.*.js
tsconfig*.json
eslint.config.js
```

- `app/` contains the landing page source and styles.
- `fantasy-calendar/` contains all calendar-specific source, tests,
  documentation, archived specs, and its TODO file. Existing relative links
  must be updated after the move.
- Active repository-wide specs, shared tool configuration, dependencies,
  workflow configuration, license, contributor guidance, and root README stay
  at the repository root.
- The existing unused `src/css/` content moves with the calendar rather than
  being cleaned up as part of this migration.

## Root Tooling

Keep one root `package.json` and lockfile. Update the package identity and
metadata from a calendar-only project to the TTRPG toolkit where applicable.

Root commands must provide the common workflow:

- `npm run start` serves the landing app and Fantasy Calendar together.
- `npm run build` creates one deployable artifact containing both apps.
- `npm test` runs the relocated Fantasy Calendar tests and is extensible to
  tests for future tools.
- Existing lint commands cover files in both project directories.

Shared webpack and TypeScript configuration may be adapted at the root. The
implementation can use a multi-configuration build or a small shared config
factory, but project output must remain isolated and adding a tool must not
require copying dependencies.

## Landing App

Create a framework-free TypeScript/SCSS landing page consistent with the
existing toolchain. It must include:

- a clear `Zippin Toolkit` title and short description;
- a visible, accessible `Fantasy Calendar` link or card;
- a relative link to `fantasy-calendar/`, so navigation works locally and
  under the GitHub Pages repository base path.

The landing page is intentionally minimal; a general navigation framework or
shared design system is not required.

## Build and Deployment

`npm run build` must produce this public structure:

```text
dist/
  index.html
  fantasy-calendar/
    index.html
```

Each page must load only its own generated JavaScript and CSS assets. Asset
paths must work under the GitHub Pages project URL rather than assuming the
site is hosted at the domain root.

The existing Pages workflow continues to publish `dist/`. Its deployed routes
become:

- `/zippin-toolkit/` — landing app;
- `/zippin-toolkit/fantasy-calendar/` — Fantasy Calendar.

Direct calendar selections must continue to work as:

```text
/zippin-toolkit/fantasy-calendar/#1504/Hammer/1
```

Reading and writing the date must preserve the calendar pathname and existing
hash encoding behavior. A direct request for the calendar subpath must return
its page without first visiting the landing app.

## Documentation Migration

- Rewrite the root README to describe the toolkit layout, shared commands,
  deployment routes, and available tools.
- Move calendar-specific design documents under `fantasy-calendar/docs/` and
  update their source/test paths.
- Move existing calendar-specific archived specs under
  `fantasy-calendar/specs/archive/` while preserving their archival history.
- Update contributor guidance and all repository links that reference old
  root-level calendar paths.

## Acceptance Criteria

- The root page renders the Zippin Toolkit landing app and links to Fantasy
  Calendar.
- Fantasy Calendar is rendered at `fantasy-calendar/` in development and in
  the production artifact.
- A direct calendar URL, including a `#year/month/day` hash, loads the calendar
  with the selected date and retains the nested pathname on subsequent changes.
- Calendar source, tests, docs, archived specs, and TODO content live under
  `fantasy-calendar/`; no calendar implementation remains in root `src/` or
  `tests/` directories.
- Dependencies remain centralized in the root package and lockfile.
- Root start, build, test, and lint commands target the new directory layout.
- The production artifact contains both entry pages with valid, isolated asset
  references.
- The Pages workflow deploys the combined artifact from `dist/`.
- Existing Fantasy Calendar tests continue to pass without behavioral changes.
- Generated files in `dist/` are not committed or edited by hand.

## Validation Plan

- Run `npm run build` and verify both expected HTML files exist in `dist/`.
- Run `npm test` and confirm all existing calendar tests pass from their new
  location.
- Run ESLint against both projects and Stylelint against all relocated/new
  SCSS files.
- Serve the production or development build and verify:
  - the root landing page loads;
  - its Fantasy Calendar link opens the nested page;
  - direct navigation to the nested page works;
  - a calendar hash selects the correct date;
  - changing the selected date keeps the nested calendar pathname.
- Inspect generated HTML to confirm each page references only its own assets
  with GitHub Pages-compatible paths.

## Risks

- Webpack output cleanup or duplicate asset names could remove or overwrite one
  app's files. The build must treat `dist/` as one coordinated artifact and use
  isolated names or directories.
- Root-relative asset or navigation URLs may work locally but fail beneath the
  GitHub Pages repository path. Prefer generated or relative URLs and validate
  against `/zippin-toolkit/` semantics.
- Moving files can leave stale documentation, test includes, lint globs, or
  workflow assumptions. Repository-wide path searches are part of migration
  verification.
