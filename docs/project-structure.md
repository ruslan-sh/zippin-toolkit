# Project Structure and Deployment

## Purpose

Zippin's Toolkit is a single repository for independently addressable TTRPG
tools. A landing page is served at the GitHub Pages root and links to each tool
at its own subpath.

## Repository Structure

- `app/` owns the landing page.
- `encounter-difficulty-calculator/` is self-contained for implementation,
  tests, documentation, and contributor guidance.
- `fantasy-calendar/` is self-contained for implementation, tests,
  documentation, archived planning, and contributor guidance.
- `shared/` contains theme source consumed by the landing page and both tools.
- `docs/` contains current repository-wide documentation.
- `specs/` contains active repository-wide plans; implemented plans are moved
  to `specs/archive/`.
- Dependencies and build, test, and lint orchestration remain at the repository
  root.

Nested `README.md` and `AGENTS.md` files own tool-specific documentation and
contribution rules. Root documentation stays focused on shared repository
behavior.

## Shared Tooling

The root `package.json` provides the common workflow:

- `npm run start` serves the landing page and all tools together.
- `npm run build` creates the complete deployable artifact.
- `npm test` runs the available tool tests.
- `npm run lint` checks TypeScript and JavaScript across projects.
- `npm run lint:styles` checks SCSS across projects.

Webpack uses a separate entry point for the landing page and each tool. Each
page receives only its own generated JavaScript and CSS assets.

## Build Output

The production build creates one deployable `dist/` directory containing the
landing page and a subdirectory for each tool. Generated output is disposable
and should not be edited or committed.

## Routing

GitHub Pages serves the landing page at the repository root and each tool from
its own subpath. The landing page uses relative links so navigation works in
local development and beneath the GitHub Pages repository path. Tool-specific
URL state is documented with the applicable tool.

## Deployment

`.github/workflows/pages.yml` installs the root lockfile with `npm ci`, runs the
shared production build, and publishes `dist/` as one GitHub Pages artifact.
The workflow runs for pushes to `main` and can also be started manually.

## Adding Tools

New tools should use their own top-level folder, webpack entry, generated asset
directory, and HTML page. Their source paths must be added to the shared
TypeScript and lint configuration while dependencies and orchestration remain
at the repository root.
