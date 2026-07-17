# Zippin's Toolkit

[![Build and deploy to GitHub Pages](https://github.com/ruslan-sh/zippin-toolkit/actions/workflows/pages.yml/badge.svg)](https://github.com/ruslan-sh/zippin-toolkit/actions/workflows/pages.yml)

[Open Zippin's Toolkit](https://ruslan-sh.github.io/zippin-toolkit/)

Zippin's Toolkit is a collection of focused, framework-free TypeScript tools for
tabletop role-playing games.

## Tools

- [Fantasy Calendar](fantasy-calendar/) —
  [open app](https://ruslan-sh.github.io/zippin-toolkit/fantasy-calendar/)
- [Encounter Difficulty Calculator](encounter-difficulty-calculator/) —
  [open app](https://ruslan-sh.github.io/zippin-toolkit/encounter-difficulty-calculator/)

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

Generated files in `dist/` should not be edited directly.

## Documentation

- [Project structure and deployment](docs/project-structure.md)
- [Contribution, branch, and commit conventions](docs/contributing.md)

## Deployment

GitHub Pages publishes the production `dist/` artifact. Use the links under
**Tools** to open each deployed page.
