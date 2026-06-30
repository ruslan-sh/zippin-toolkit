# Moon Phase Calculation Design

## Purpose
This document describes the current moon phase calculation design used by the application. It reflects the implemented behavior in `fantasy-calendar/src/ts/moon.ts`, the shared calendar dependency in `fantasy-calendar/src/ts/calendar.ts`, the renderer integration in `fantasy-calendar/src/ts/render.ts`, and the regression coverage in `fantasy-calendar/tests/moon.test.ts`.

## Scope
- Daily moon phase classification for calendar rendering.
- Direct initialization from a configured full-moon anchor.
- Month-level moon state generation for normal months and festivals.

## Module Boundaries
- `fantasy-calendar/src/ts/moon.ts`
  - Owns moon-specific calculation logic.
  - Exposes the `Moon` class.
- `fantasy-calendar/src/ts/calendar.ts`
  - Owns shared calendar helpers used by moon logic and general date logic.
- `fantasy-calendar/src/ts/render.ts`
  - Consumes day-classified moon states and maps them to existing CSS classes.
- `fantasy-calendar/tests/moon.test.ts`
  - Covers moon calculation boundaries, directionality, initialization, and continuity.

## Data Model
The moon module is constructed with `MoonProps`, a narrowed subset of app configuration:

```ts
interface MoonProps {
    astronomical: {
        daysInYear: number;
        moon: {
            name: string;
            period: number;
        };
    };
    calendar: {
        fullMoon: {
            year: number;
            day: number;
        };
        leapYear: {
            first: number;
            frequency: number;
        };
        months: CalendarMonth[];
    };
}
```

The classified output uses `MoonPhaseState`:
- `Full`
- `New`
- `HalfWaning`
- `HalfWaxing`
- `None`

Month-level renderer data is represented as:

```ts
type MonthMoonPhases = Partial<Record<number, MoonPhaseState>>;
```

Only classified days are present in the returned map.

## Core Model
The implementation uses normalized cycle position:
- `cyclePos` is always in `[0, 1)`.
- `0` means full moon.
- `0.5` means new moon.
- advancing one day adds `1 / moon.period`.

Normalization is handled by modulo arithmetic:

```text
normalize(x) = ((x % 1) + 1) % 1
```

with an explicit `1 -> 0` normalization so exact wrap lands on full moon.

## Phase Windows
Moon state is classified directly from `cyclePos`.

Constants:
- `Full = 0.025`
- `New = 0.025`
- `HalfLowerWaning = 0.225`
- `HalfUpperWaning = 0.275`
- `HalfLowerWaxing = 0.725`
- `HalfUpperWaxing = 0.775`

Classification rules:
- Full moon when `cyclePos < 0.025` or `cyclePos > 0.975`
- New moon when `0.475 <= cyclePos <= 0.525`
- Half waning when `0.225 < cyclePos <= 0.275`
- Half waxing when `0.725 < cyclePos <= 0.775`
- Otherwise `None`

These boundary semantics intentionally preserve the earlier threshold intent:
- full: strict outer edge
- new: inclusive edges
- half: strict lower edge, inclusive upper edge

## Direct Initialization From Anchor
The configured full moon is treated as the anchor:
- `calendar.fullMoon.year`
- `calendar.fullMoon.day`

For any target date, the implementation computes the offset in fantasy-calendar days from that anchor, then converts it to `cyclePos`.

Formula:

```text
daysOffset =
  (targetDayOfYear - anchorDayOfYear)
  + (targetYear - anchorYear) * floor(daysInYear)
  + leapYearsBetween(anchorYear, targetYear)
```

Then:

```text
cyclePos = normalize(daysOffset / moon.period)
```

This gives O(1) initialization relative to anchor distance. The leap-year term is computed arithmetically, not by iterating through all intervening years.

## Daily Progression
Once a starting day is known, subsequent days are advanced incrementally:

```text
dailyStep = 1 / moon.period
nextCyclePos = normalize(currentCyclePos + dailyStep)
```

This avoids recomputing from the anchor for every day in a month.

## Month Generation
`Moon#getMonthMoonPhases(yearId, monthName)` performs month generation in three steps:

1. Resolve the number of days in the target month using shared calendar helpers.
2. Compute `cyclePos` for day 1 of that month with `getMoonCyclePosition(...)`.
3. Walk the month day by day, classify each day, and store only non-`None` states.

Festival months use the same logic as normal months:
- one-day festival months return either an empty map or `{ 1: state }`
- leap-only festival months return an empty map in non-leap years because the month length is `0`

## Renderer Contract
The renderer instantiates a single `Moon` object from app props and consumes `getMonthMoonPhases(...)`.

Class mapping:
- `MoonPhaseState.Full` -> `calendar__day--moon-full`
- `MoonPhaseState.New` -> `calendar__day--moon-new`
- `MoonPhaseState.HalfWaning` -> `calendar__day--moon-half-waning`
- `MoonPhaseState.HalfWaxing` -> `calendar__day--moon-half-waxing`

The existing moon symbol element and SCSS selectors are preserved. Visibility remains controlled by the moon-specific modifier classes.

## Shared Calendar Dependencies
The moon module depends on an injected `Calendar` instance from `fantasy-calendar/src/ts/calendar.ts`.

It uses the following shared instance methods:
- `getMonthByName(...)`
- `getMonthDaysInYear(...)`
- `getDayOfYear(...)`
- `countLeapYearsBetween(...)`

This keeps month and leap-year rules centralized while keeping moon-specific behavior isolated in `fantasy-calendar/src/ts/moon.ts`.

## Validation Coverage
The current unit tests cover:
- cycle position normalization
- day-by-day advancement
- full/new/half boundary semantics
- waning vs waxing classification
- anchor invariants
- leap and non-leap year offsets
- direct initialization for past and future dates
- wide-range reference checks against a naive implementation
- continuity across month and leap-day boundaries
- festival parity with normal day logic

## Known Constraints
- Classification is sampled at day start only.
- Intra-day threshold crossings are intentionally ignored.
- The renderer still appends the moon symbol element for every day cell, but SCSS keeps it hidden unless a moon-state class is present.
