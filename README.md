# Fantasy Calendar

[![Build And Deploy Static Content to Pages](https://github.com/ruslan-sh/fantasy-calendar/actions/workflows/pages.yml/badge.svg)](https://github.com/ruslan-sh/fantasy-calendar/actions/workflows/pages.yml)

[Fantasy Calendar](https://ruslan-sh.github.io/fantasy-calendar)

Fantasy Calendar is a framework-free TypeScript app that renders the Forgotten
Realms Calendar of Harptos. It supports festivals, leap-day Shieldmeet, moon
phases, date arithmetic, interactive date selection, and shareable URL state.

## Development

```sh
npm install
npm run start
npm test
npm run build
```

Webpack builds the static app from `src/index.ts` and `src/index.ejs`. SCSS is
compiled from `src/scss/index.scss`; generated files in `dist/` should not be
edited directly.

## Architecture

- `src/ts/props.ts` defines the calendar and astronomical configuration.
- `src/ts/calendar.ts` owns month, leap-year, and date calculations.
- `src/ts/moon.ts` calculates moon-cycle positions and phases.
- `src/ts/render.ts` renders the controls and full calendar year into the DOM.
- `src/ts/url-utils.ts` reads and writes the selected date in the URL.

At startup, the app reads `#year/month/day` (or legacy query parameters),
creates the controls, and renders the year. Selection changes rebuild the year
and update the URL hash.

## Current constraints

- Date offsets support forward, non-negative movement only.
- URL and control values receive minimal validation.
- Every month currently starts at the first weekday column.
- `springEquinox` and `isMonthsWeeksSynced` are reserved configuration fields
  and are not currently used by rendering or calculations.

## Documentation

- [Calendar date selection](docs/calendar-date-selection.md)
- [Calendar logic](docs/calendar-logic.md)
- [Moon phase calculation](docs/moon-phase-calculation.md)
