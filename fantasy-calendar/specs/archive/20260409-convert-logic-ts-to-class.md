# Archived on 2026-04-09 after implementation. Current behavior now lives in `fantasy-calendar/docs/calendar-logic.md` and related project documentation.

# Convert `logic.ts` To `Calendar` Class

## Summary
Refactor [`src/ts/logic.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/logic.ts) from a free-function module that reads global `props` into a dedicated `Calendar` class instantiated with an explicit props interface. The refactor should fully migrate existing callers to the class API, align the module shape with [`src/ts/moon.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/moon.ts), and collapse the current split between `*InCalendar` helpers and props-based wrappers into a single instance API. Renaming the file as part of this refactor is allowed.

## Goals
- Replace the current `logic.ts` free-function API with a single exported `Calendar` class.
- Inject dependencies into `Calendar` instead of importing global `props` inside the logic module.
- Use an explicit constructor contract rather than deriving it from full `AppProps`.
- Fully migrate current callers to the class-based API.
- Update `Moon` so it depends on `Calendar` instead of importing calendar helpers directly from the logic module.
- Preserve current runtime behavior unless a small cleanup/refactor is explicitly enabled by this change and does not alter results.
- Add test coverage for the new class API and preserve regression confidence for existing calendar behavior.

## Non-Goals
- No file renames unless strictly required outside this refactor.
- No broader dependency-injection rewrite across the application.
- No render-layer redesign.
- No `props` architecture redesign beyond introducing the `Logic` constructor dependency.
- No webpack/build configuration changes.
- No manual edits to generated output in `dist/`.

## Current Behavior
[`src/ts/logic.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/logic.ts) exports a mix of:
- Calendar-agnostic helpers that accept explicit calendar/leap-year arguments, such as:
  - `getMonthByNameInCalendar`
  - `isLeapYearForCalendar`
  - `getMonthDaysInCalendarYear`
  - `getDaysSinceYearStartInCalendar`
  - `countLeapYearsBetweenInCalendar`
  - `getDayOfYearInCalendar`
- `props`-dependent wrappers that read from the global [`props.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/props.ts), such as:
  - `getMonthByName`
  - `isLeapYear`
  - `getMonthDaysInYear`
  - `getDaysSinceYearStart`
  - `countLeapYearsBetween`
  - `getDayOfYear`
- A `calculateDate()` function that uses both calendar and astronomical config through global props.

Current call sites:
- [`src/ts/render.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/render.ts) imports `calculateDate` and `isLeapYear`.
- [`src/ts/moon.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/moon.ts) imports `countLeapYearsBetweenInCalendar`, `getDayOfYearInCalendar`, `getMonthByNameInCalendar`, and `getMonthDaysInCalendarYear`.

The target refactor should remove this dual surface rather than preserve it under a class wrapper.

## Proposed Design
### `Calendar` class
Introduce a single exported `Calendar` class from the current logic module. Renaming [`src/ts/logic.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/logic.ts) to a file such as `calendar.ts` is allowed in this case.

Constructor contract:

```ts
interface CalendarProps {
  astronomical: AstronomicalConfig;
  calendar: CalendarConfig;
}

class Calendar {
  public constructor(private readonly props: CalendarProps) {}
}
```

The exact location of the interface is flexible, but the dependency must be limited to:
- `calendar`
- `astronomical`

Prefer an explicit interface over `Pick<AppProps, "calendar" | "astronomical">` so the class contract stays clear and does not silently widen if `AppProps` grows in the future.

The class must not import global `props` internally.

### Method organization
Refactor all current logic exports into a cohesive `Calendar` instance API.

Expected direction:
- Current props-dependent wrappers become normal instance methods.
- Current `*InCalendar` helper variants are removed from the public API.
- Any helper extracted during implementation should remain internal/private unless there is a strong reason to expose it.

The class should absorb the current behavior, but not preserve the old split between paired methods such as:
- `getMonthByNameInCalendar(...)` and `getMonthByName(...)`
- `isLeapYearForCalendar(...)` and `isLeapYear(...)`
- `getMonthDaysInCalendarYear(...)` and `getMonthDaysInYear(...)`
- similar duplicated pairs across the module

Illustrative target shape:

```ts
export class Calendar {
  public constructor(private readonly props: CalendarProps) {}

  public getMonthByName(...)
  public isLeapYear(...)
  public getMonthDaysInYear(...)
  public getDaysSinceYearStart(...)
  public countLeapYearsBetween(...)
  public getDayOfYear(...)
  public calculateDate(...)
}
```

## Migration Plan
### Full caller migration
This refactor should target full migration of existing application callers.

Expected integration direction:
- Instantiate `Calendar` once where it is sufficient for current app wiring.
- Based on current structure, creating the instance in [`src/ts/render.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/render.ts) is acceptable for now.
- A higher-level owner such as [`src/index.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/index.ts) is not required unless implementation pressure makes it clearly cleaner.

### Render integration
Replace direct free-function imports in [`src/ts/render.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/render.ts) with calls on a shared `Calendar` instance.

Current behavior to preserve:
- Leap-year checks used when rendering festivals.
- Date calculation used for navigation and date transitions.

### Moon integration
`Moon` should depend on `Calendar`.

Target direction:
- `Moon` should no longer import calendar helpers directly from `logic.ts`.
- `Moon` should receive a `Calendar` instance through its constructor, or otherwise be constructed around one explicitly.
- The final dependency chain should make `Moon` consume `Calendar` rather than reaching into loose helper exports.

Acceptable target shape:

```ts
const calendar = new Calendar({ calendar: props.calendar, astronomical: props.astronomical });
const moon = new Moon(moonProps, calendar);
```

The exact constructor signature may vary, but the dependency must be explicit.

## Behavioral Requirements
- All current logic results must remain unchanged for equivalent inputs.
- Existing error behavior for missing month names should remain equivalent unless there is a strong reason to normalize messages.
- Leap-year behavior must remain unchanged.
- Month-length calculation behavior must remain unchanged, including:
  - regular months
  - `leap-only` festival months
  - `extra-day` months
- `calculateDate()` must preserve current date-rolling semantics.
- `Moon` behavior must remain unchanged after it starts consuming `Calendar`.

## Allowed Cleanup
Small cleanup/refactoring is acceptable if it stays within the refactor boundary and preserves behavior.

Examples of acceptable cleanup:
- Extracting an internal helper for days-in-year calculation used by `calculateDate()`.
- Removing duplicate `*InCalendar` helper variants once the equivalent instance behavior exists.
- Tightening type aliases for constructor dependencies.
- Clarifying naming if it directly improves the class-based API.

Examples of disallowed scope expansion:
- Reworking unrelated rendering logic.
- Changing how app-wide props are sourced.
- Reorganizing multiple modules beyond what is needed for this refactor.

## Type Design
Prefer a dedicated explicit props interface for `Calendar` rather than using `Pick<AppProps, ...>`.

Example:

```ts
export interface CalendarProps {
  astronomical: AstronomicalConfig;
  calendar: CalendarConfig;
}
```

This should be treated as an explicit class contract, similar in spirit to `MoonProps`, rather than a type alias derived from `AppProps`.

## Public API Expectations
The spec should assume the following public API principles:
- `Calendar` is the main exported type from the refactored module.
- Instance methods cover the current behavior exposed by the old module.
- The old `*InCalendar` helper variants are removed from the public surface.
- The legacy free-function API is not intended to remain as a permanent compatibility layer.

Temporary compatibility shims are acceptable only if implementation needs them briefly, but the end state should not rely on them.

## Acceptance Criteria
- The refactored module exports a `Calendar` class as the primary API.
- `Calendar` no longer imports global [`props.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/props.ts).
- `Calendar` is instantiated with an injected props subset covering `calendar` and `astronomical`.
- All existing logic behavior from the current module is represented through the `Calendar` instance API.
- The old `*InCalendar` helper variants are removed from the public API.
- Existing callers are fully migrated away from direct free-function use.
- [`src/ts/render.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/render.ts) uses a `Calendar` instance instead of importing `calculateDate` / `isLeapYear` as free functions.
- [`src/ts/moon.ts`](/mnt/c/github/ruslan-sh/fantasy-calendar/src/ts/moon.ts) depends on `Calendar` rather than importing loose helper functions from the old logic module.
- Runtime behavior remains unchanged for existing calendar calculations and moon-phase generation.
- No broader app architecture changes are introduced beyond what is necessary for this migration.

## Validation Plan
### Required checks
- Run `npm run build`.
- Run relevant lint checks for touched TypeScript files.
- Run `npm test` because this refactor changes shared logic behavior and `Moon` integration.

### Test coverage expectations
Tests coverage is required.

Add or update tests to cover:
- `Calendar` instance methods:
  - month lookup
  - leap-year evaluation
  - month-day calculation
  - day-of-year calculation
  - leap-year counting across ranges
  - date calculation / rollover behavior
- Regression coverage for `Moon` behavior after its dependency changes.
- Interaction cases that span both modules, especially where `Moon` uses helpers now supplied through `Calendar`.

### Suggested edge cases
- Missing month name throws.
- Leap year at the configured first leap year.
- Non-leap year immediately adjacent to a leap year.
- Reverse year ranges in `countLeapYearsBetween*`.
- Festival month with `leap-only`.
- Month with `extra-day`.
- `calculateDate()` across year boundary.
- `calculateDate()` across leap and non-leap years.

## Risks
- Risk: the refactor preserves too much of the old dual API shape and leaves an awkward class wrapper over legacy helpers.
- Mitigation: remove the `*InCalendar` variants from the public surface and keep the new API centered on injected instance methods.

- Risk: `Moon` gains awkward coupling during migration.
- Mitigation: inject `Calendar` explicitly and keep the `Moon` surface otherwise unchanged.

- Risk: temporary compatibility exports linger and create a mixed API.
- Mitigation: treat full migration as part of acceptance criteria and remove legacy call sites before completion.

- Risk: constructor props subset becomes too broad and effectively recreates `AppProps`.
- Mitigation: define `CalendarProps` explicitly in terms of `CalendarConfig` and `AstronomicalConfig`, and avoid deriving it from `AppProps`.

## Open Implementation Choices
These are intentionally left flexible for the implementation:
- Exact location of the `CalendarProps` interface.
- Whether `Moon` accepts both `MoonProps` and `Calendar` separately, or whether its constructor contract is reshaped slightly to avoid duplication.
- Whether `Calendar` is instantiated in `render.ts` or lifted to a slightly higher composition point if the implementation clearly benefits.

The implementation should choose the smallest clean design that satisfies the acceptance criteria without broadening scope.
