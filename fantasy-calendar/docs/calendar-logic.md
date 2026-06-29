# Calendar Logic Design

## Purpose
This document describes the implemented calendar logic surface used by the application. It reflects the `Calendar` class in `fantasy-calendar/src/ts/calendar.ts`, its render-layer integration in `fantasy-calendar/src/ts/render.ts`, its use from `fantasy-calendar/src/ts/moon.ts`, and the regression coverage in `fantasy-calendar/tests/calendar.test.ts`.

## Scope
- Shared calendar calculations for month lookup, leap years, month lengths, day-of-year offsets, and date rollover.
- The constructor contract for calendar logic dependencies.
- The integration points that consume the shared `Calendar` instance.

## Module Boundaries
- `fantasy-calendar/src/ts/calendar.ts`
  - Owns the shared `Calendar` class.
  - Exposes the explicit `CalendarProps` constructor contract.
- `fantasy-calendar/src/ts/render.ts`
  - Instantiates the shared `Calendar` instance from app props.
  - Uses `Calendar` for festival leap-year checks, month lookup, month length lookup, and relative date calculation.
- `fantasy-calendar/src/ts/moon.ts`
  - Receives a `Calendar` instance explicitly and uses it for shared calendar math.
- `fantasy-calendar/tests/calendar.test.ts`
  - Covers the public `Calendar` API directly.

## Constructor Contract
`Calendar` is constructed with a narrowed explicit dependency set:

```ts
export interface CalendarProps {
    astronomical: AstronomicalConfig;
    calendar: CalendarConfig;
}
```

The module does not import global props internally. Callers provide only the `calendar` and `astronomical` configuration needed by the shared logic.

## Public API
The current public API is instance-based:
- `getMonthByName(monthName)`
- `isLeapYear(yearId)`
- `getMonthDaysInYear(yearId, month)`
- `getDaysSinceYearStart(yearId, monthName)`
- `countLeapYearsBetween(startYearId, endYearId)`
- `getDayOfYear(yearId, monthName, dayId)`
- `calculateDate(currentDate, daysToAdd)`

The earlier split between props-dependent wrappers and `*InCalendar` helper exports is removed. Shared calendar behavior now flows through a single `Calendar` object.

## Month And Leap-Year Rules
- Month lookup matches configured month names exactly and throws `Month not found: <name>` for unknown names.
- Leap years follow `calendar.leapYear.first` and `calendar.leapYear.frequency`.
- Regular months always use their configured `days`.
- `leap-only` months have `0` days outside leap years and their configured length during leap years.
- `extra-day` months gain one additional day during leap years.

These rules are shared by the renderer and moon logic, which keeps festival and leap-day handling consistent across the application.

## Day-Of-Year And Range Calculations
- `getDaysSinceYearStart(...)` sums the lengths of all configured months before the target month in the target year.
- `getDayOfYear(...)` adds the day number within the target month.
- `countLeapYearsBetween(...)` computes leap years arithmetically across forward and reverse ranges without iterating through every year.

This shared behavior is used directly by the moon logic when converting fantasy-calendar dates into offsets from the configured full-moon anchor.

## Date Rollover
`calculateDate(...)` treats the selected date as a day-of-year position, applies a non-negative offset, then rolls forward through year lengths and month lengths until it resolves the resulting date. Backward movement is not currently supported.

Current behavior:
- preserves leap-year and non-leap-year year lengths derived from `astronomical.daysInYear`;
- skips `leap-only` months in non-leap years because their month length is `0`;
- rolls correctly across month boundaries, festival boundaries, and year boundaries.

The renderer uses this path for the `Add days` control.

## Integration
The renderer creates a single shared instance:

```ts
const calendar = new Calendar({
    calendar: props.calendar,
    astronomical: props.astronomical,
});
const moon = new Moon(props, calendar);
```

This keeps shared date rules centralized while allowing the moon logic to stay focused on phase-specific calculations.

## Validation Coverage
The current tests cover:
- month lookup and missing-month errors;
- leap-year evaluation around the configured first leap year;
- regular, `leap-only`, and `extra-day` month length behavior;
- day-of-year calculations with skipped leap-only festivals;
- leap-year counting in forward and reverse ranges;
- date rollover across leap-year, non-leap-year, and year-boundary cases.
