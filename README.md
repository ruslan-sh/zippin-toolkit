# Zippin's Tookit

[![Build and deploy to GitHub Pages](https://github.com/ruslan-sh/zippin-toolkit/actions/workflows/pages.yml/badge.svg)](https://github.com/ruslan-sh/zippin-toolkit/actions/workflows/pages.yml)

[Open Zippin's Tookit](https://ruslan-sh.github.io/zippin-toolkit/)

Zippin's Tookit is a collection of focused, framework-free TypeScript tools for
tabletop role-playing games.

## Tools

- [Fantasy Calendar](fantasy-calendar/) —
  [open app](https://ruslan-sh.github.io/zippin-toolkit/fantasy-calendar/)

## Development

```sh
npm install
npm run start
npm run build
npm test
npm run lint
npm run lint:styles
```

All dependencies and commands are managed from the repository root. The build
produces one deployable `dist/` artifact containing the landing page and every
tool.

## Project Layout

- `app/src/`: Zippin's Tookit landing page.
- `fantasy-calendar/`: Fantasy Calendar tool and its project documentation.
- `specs/`: active repository-wide specifications and task trackers.
- `webpack.*.js`, `tsconfig*.json`: shared build and TypeScript configuration.

Generated files in `dist/` should not be edited directly.

## Deployment

GitHub Pages publishes `dist/` with these routes:

- `/zippin-toolkit/` — landing page.
- `/zippin-toolkit/fantasy-calendar/` — Fantasy Calendar.
