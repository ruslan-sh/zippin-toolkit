# Fantasy Calendar

[Open Fantasy Calendar](https://ruslan-sh.github.io/zippin-toolkit/fantasy-calendar/)

Fantasy Calendar is a framework-free TypeScript app that renders the Forgotten
Realms Calendar of Harptos. It supports festivals, leap-day Shieldmeet, moon
phases, date arithmetic, interactive date selection, and shareable URL state.

## Development

Dependencies and commands are managed from the repository root. See the root
[README](../README.md) for the shared development workflow and
[AGENTS.md](AGENTS.md) for calendar-specific contribution guidance.

## Architecture

- `src/ts/props.ts`: calendar and astronomical configuration.
- `src/ts/calendar.ts`: month, leap-year, and date calculations.
- `src/ts/moon.ts`: moon-cycle positions and phase classification.
- `src/ts/render.ts`: controls and full-year DOM rendering.
- `src/ts/url-utils.ts`: selected-date URL parsing and serialization.
- `src/scss/`: calendar presentation and component styles.
- `tests/`: unit and DOM-rendering tests.

At startup, the app reads `#year/month/day` or legacy query parameters, creates
the controls, and renders the year. Selection changes rebuild the year and
update the URL hash while preserving the nested calendar path.

## Current Constraints

- Date offsets support forward, non-negative movement only.
- URL and control values receive minimal validation.
- Every month currently starts at the first weekday column.
- `springEquinox` and `isMonthsWeeksSynced` are reserved configuration fields
  and are not currently used by rendering or calculations.

## Documentation

- [Date selection](docs/calendar-date-selection.md)
- [Calendar logic](docs/calendar-logic.md)
- [Moon-phase calculation](docs/moon-phase-calculation.md)

Archived implementation specifications live in `specs/archive/`, and the
calendar-specific backlog lives in [TODO](TODO).
