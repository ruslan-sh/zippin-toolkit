# Tasks For Zippin Toolkit Monorepo

## Task 1: Relocate Fantasy Calendar Into Its Project Folder

Status: todo

Summary: Move the calendar implementation and tests under
`fantasy-calendar/` while adapting the shared root toolchain so the existing
calendar remains buildable, testable, and lintable without behavior changes.

Scope:

- Move the current `src/` tree, including the unused legacy `src/css/`
  content, to `fantasy-calendar/src/`.
- Move `tests/` to `fantasy-calendar/tests/` and update test imports.
- Update root TypeScript/test configuration, webpack entry/template paths,
  package scripts, and lint globs for the relocated files.
- Keep dependencies, the lockfile, and shared build/lint/test configuration at
  the repository root.
- Preserve the current single-calendar build output as the green checkpoint;
  the landing page and nested production output belong to Task 2.
- Do not change calendar behavior, styling, or known constraints.

Dependencies:

- Depends on: none
- Parallelizable: no
- Parallel with: none

Validation:

- Run `npm run build`.
- Run `npm test` and confirm all existing calendar tests pass from their new
  location.
- Run ESLint against `fantasy-calendar/src/` and
  `fantasy-calendar/tests/`.
- Run Stylelint against `fantasy-calendar/src/**/*.scss`.
- Search build/test/lint configuration for stale root `src/` and `tests/`
  assumptions.

Definition of done:

- Calendar source and tests live under `fantasy-calendar/`.
- Root commands successfully build, test, and lint the relocated calendar.
- No calendar implementation remains in root `src/` or `tests/` directories.
- Runtime behavior and the existing test results are unchanged.

## Task 2: Add the Landing App and Multi-App Build

Status: todo

Summary: Create the minimal Zippin Toolkit landing app and change the shared
webpack workflow to build and serve both the landing page and Fantasy Calendar
at their final paths.

Scope:

- Add a framework-free TypeScript/SCSS landing app under `app/src/`.
- Render a `Zippin Toolkit` title, short description, and accessible relative
  link or card to `fantasy-calendar/`.
- Adapt the shared webpack configuration to emit the landing page at
  `dist/index.html` and the calendar at
  `dist/fantasy-calendar/index.html`.
- Isolate each app's JavaScript and CSS assets and ensure each HTML page loads
  only its own bundles.
- Ensure asset and navigation paths work below the GitHub Pages
  `/zippin-toolkit/` base path.
- Update `npm run start` so both pages are served together at their production-
  equivalent paths.
- Preserve calendar URL hashes and verify subsequent URL writes retain the
  `/fantasy-calendar/` pathname.
- Add focused automated coverage where practical for landing navigation or
  generated route behavior.

Dependencies:

- Depends on: Task 1
- Parallelizable: yes
- Parallel with: Task 3

Validation:

- Run `npm run build` and confirm both expected HTML files exist.
- Inspect the generated HTML and asset paths for bundle isolation and
  repository-base compatibility.
- Run `npm test`.
- Run ESLint against both app source trees and all tests.
- Run Stylelint against SCSS in both app source trees.
- Serve the result and verify the landing link, direct calendar navigation,
  initial hash selection, and nested-path URL updates.

Definition of done:

- The root URL renders the Zippin Toolkit landing page.
- The landing page links to the calendar with a relative URL.
- Fantasy Calendar loads directly from `fantasy-calendar/`, including with a
  `#year/month/day` hash.
- The production artifact contains isolated, working output for both apps.
- Shared root start/build/test/lint workflows remain green.

## Task 3: Move Calendar Documentation and Planning History

Status: todo

Summary: Complete the calendar project boundary by moving its documentation,
archived specs, and TODO file under `fantasy-calendar/` and correcting all
links affected by the move.

Scope:

- Move root `docs/` to `fantasy-calendar/docs/`.
- Move the calendar-specific files from `specs/archive/` to
  `fantasy-calendar/specs/archive/` while preserving their contents and
  history.
- Move the calendar-specific root `TODO` to `fantasy-calendar/TODO`.
- Update paths inside moved documents to the new calendar source and test
  locations.
- Update existing root-level links that would otherwise break after these
  moves, without yet rewriting the root README for the final toolkit
  experience.
- Leave the active monorepo spec and task file in root `specs/`.

Dependencies:

- Depends on: Task 1
- Parallelizable: yes
- Parallel with: Task 2

Validation:

- Run `git diff --check`.
- Search the moved documents and repository links for stale root-level
  calendar source, test, docs, TODO, and archived-spec paths.
- Confirm active repository-wide specs remain in root `specs/`.
- Run `npm test` to catch accidental path or file-move regressions.

Definition of done:

- Calendar docs, archived specs, and TODO content live under
  `fantasy-calendar/`.
- Moved documents point to the relocated source and tests.
- Root links resolve after the moves.
- No calendar-specific documentation or planning history remains in its old
  root location.

## Task 4: Finalize Repository Integration and Deployment Readiness

Status: todo

Summary: Reconcile repository-facing documentation, metadata, contributor
guidance, and deployment configuration with the completed multi-app layout,
then validate the full GitHub Pages artifact.

Scope:

- Rewrite the root README around Zippin Toolkit, its shared commands, project
  layout, available tools, and deployed routes.
- Update root package identity and repository metadata from the old
  calendar-only naming where applicable, keeping one package and lockfile.
- Update `AGENTS.md` paths and validation guidance for the new layout.
- Review the Pages workflow and adjust it only as needed to build and publish
  the combined root `dist/` artifact.
- Perform a repository-wide stale-path audit across configuration,
  documentation, and workflow files.
- Do not add other tools, split package manifests, extract shared UI systems,
  or fix unrelated calendar issues.

Dependencies:

- Depends on: Task 2, Task 3
- Parallelizable: no
- Parallel with: none

Validation:

- Run `npm run build`, `npm test`, the root ESLint command, and
  `npm run lint:styles`.
- Verify `dist/index.html` and `dist/fantasy-calendar/index.html` plus their
  isolated assets.
- Serve the built app and repeat the landing, nested direct-link, calendar hash,
  and nested URL-write checks.
- Confirm the Pages workflow uploads `dist/` and does not assume the calendar
  is the root application.
- Run `git diff --check` and a final search for obsolete root calendar paths
  and calendar-only project naming.

Definition of done:

- Repository documentation and metadata describe Zippin Toolkit accurately.
- Contributor and CI guidance uses the final project paths and shared commands.
- The complete build, test, and lint suite passes.
- The deployable artifact serves the landing page at `/zippin-toolkit/` and
  Fantasy Calendar at `/zippin-toolkit/fantasy-calendar/`.
- All acceptance criteria in the monorepo spec are satisfied.
