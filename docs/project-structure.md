# Project Structure and Deployment

## Purpose

Zippin's Toolkit is a single repository for independently addressable TTRPG
tools. A landing page is served at the GitHub Pages root and links to each tool
at its own subpath.

## Repository Structure

```text
app/
  src/
fantasy-calendar/
  src/
  tests/
  docs/
  specs/archive/
  AGENTS.md
  README.md
  TODO
docs/
specs/
package.json
package-lock.json
webpack.*.js
tsconfig*.json
```

- `app/` owns the landing page.
- `fantasy-calendar/` is self-contained for implementation, tests,
  documentation, archived planning, contributor guidance, and backlog.
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

Webpack uses separate entry points for `app/src/index.ts` and
`fantasy-calendar/src/index.ts`. Each page receives only its own generated
JavaScript and CSS assets.

## Build Output

The production build creates:

```text
dist/
  index.html
  app/
    app.bundle.js
    app.css
  fantasy-calendar/
    index.html
    fantasy-calendar.bundle.js
    fantasy-calendar.css
```

Generated output is disposable and should not be edited or committed.

## Routes and URL State

GitHub Pages publishes the `dist/` directory at these routes:

- `/zippin-toolkit/` — Zippin's Toolkit landing page.
- `/zippin-toolkit/fantasy-calendar/` — Fantasy Calendar.

The landing page uses the relative link `fantasy-calendar/`, which works in
local development and beneath the GitHub Pages repository path.

Fantasy Calendar stores its selected date in the hash while preserving its
nested pathname. A direct date URL has this form:

```text
/zippin-toolkit/fantasy-calendar/#1504/Hammer/1
```

The calendar can be opened directly without first visiting the landing page.

## Deployment

`.github/workflows/pages.yml` installs the root lockfile with `npm ci`, runs the
shared production build, and publishes `dist/` as one GitHub Pages artifact.
The workflow runs for pushes to `main` and can also be started manually.

## Adding Tools

New tools should use their own top-level folder, webpack entry, generated asset
directory, and HTML page. Their source paths must be added to the shared
TypeScript and lint configuration while dependencies and orchestration remain
at the repository root.
