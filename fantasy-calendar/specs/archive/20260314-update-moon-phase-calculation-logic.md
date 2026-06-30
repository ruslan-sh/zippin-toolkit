# Update Moon Phase Calculation Logic

## Summary
Replace quarter-event moon calculation with a daily normalized phase model. Moon state is classified directly from cycle position (`cyclePos` in `[0, 1)`) while preserving existing UI markers and waxing/waning distinction for half moon. The design must support efficient day-by-day progression and efficient initialization from a distant known full-moon anchor.

## Goals
- Compute moon phase per day from normalized cycle position (`cyclePos`).
- Classify states using direct phase windows equivalent to previous semantics:
- `new moon` (equivalent to old `percentage <= 5`).
- `half moon` (equivalent to old `45 < percentage <= 55`).
- `full moon` (equivalent to old `percentage > 95`).
- Preserve current marker behavior and visual classes:
- `calendar__day--moon-full`
- `calendar__day--moon-new`
- `calendar__day--moon-half-waxing`
- `calendar__day--moon-half-waning`
- Keep calculations internal only (no raw phase/percentage UI exposure).
- Ensure efficient computation:
- Use previous-day progression instead of recomputing from scratch for each day.
- Provide an algorithm to compute cycle position at day start of a target year directly from the known full-moon anchor, without iterating every day from that anchor.
- Ensure the initialization algorithm works in both directions (target years after and before the anchor year).

## Non-Goals
- No moon UI redesign.
- No changes to webpack/build architecture.
- No new dependencies.
- No changes to generated output in `dist/` by manual edits.

## Current Behavior (Baseline)
- Moon events are currently derived from quarter points of the moon period using tuple events (`full`, `half waning`, `new`, `half waxing`).
- Rendering applies classes only when day number exactly equals one of those event days.

## Proposed Behavior
### Daily normalized phase model
- Introduce daily moon phase calculation for each calendar day using `cyclePos` in `[0, 1)`.
- `cyclePos = 0.0` means full moon at anchor.
- `cyclePos = 0.5` means new moon.
- `cyclePos = 1.0` wraps and is equivalent to `0.0`.
- Daily classification is fixed at day start.
- Intra-day crossings are ignored: if a threshold is crossed later in the day, it applies on the next day.
- Implementation detail is flexible, but should remain deterministic for any year/month/day.

### Classification rules (directly on `cyclePos`)
Use fixed linear windows around canonical phase centers.

Definitions:
- `FULL_WINDOW = 0.025` (because old full rule was `x > 95`).
- `NEW_WINDOW = 0.025` (because old new rule was `x <= 5` around new at `0.5`).
- `HALF_CENTER = 0.25`, `HALF_WINDOW = 0.025` (because old half rule was `45 < x <= 55`).

Rules:
- `full moon` when `cyclePos < FULL_WINDOW` or `cyclePos > 1 - FULL_WINDOW`.
- `new moon` when `abs(cyclePos - 0.5) <= NEW_WINDOW`.
- `half moon` on two windows:
- Waning half window: `0.225 < cyclePos <= 0.275`.
- Waxing half window: `0.725 < cyclePos <= 0.775`.

Boundary semantics in this linear model are intended to match prior threshold intent:
- `new`: inclusive (`<= 5`) -> inclusive window edges around `0.5`.
- `full`: strict (`> 95`) -> strict outer edges near `0` and `1`.
- `half`: strict lower, inclusive upper (`45 < x <= 55`) -> same edge behavior in both half windows.

### Half moon direction (waxing/waning)
- Continue to render distinct waxing/waning half moon markers.
- For days classified as half moon:
- Waning in the first half of cycle (`cyclePos` near `0.25`, moving full -> new).
- Waxing in the second half (`cyclePos` near `0.75`, moving new -> full).
- Preserve existing class names so SCSS selectors and visuals remain intact.

### Non-classified days
- Keep current marker semantics: only classified days receive moon-state class.
- Days outside classification windows receive no moon phase modifier class.

### Festival-day behavior
- Festival entries (single-day months) use the same `cyclePos` and classification logic as normal months.

### Precision and rounding
- No strict rounding requirement; direct float comparisons are acceptable.
- Comparisons must still respect boundary semantics above.

## Efficiency Requirements
### Incremental day progression
- Avoid expensive per-day recomputation from absolute anchors.
- Use incremental state updates:
- Compute an initial day `cyclePos` once.
- Advance next day with a constant step (`1 / moon.period`) and wrap in `[0, 1)`.

### Year-start initialization from distant anchor
- Compute `cyclePos` at day start of year start via direct offset math from known full moon event.
- Do not require day-by-day traversal from anchor year when anchor is far in the past/future.
- Support negative and positive offsets so calculations are correct for both backward and forward direction.
- Normalize phase using modulo arithmetic so result remains within `[0, 1)`.

### Complexity target
- Year-start initialization complexity: O(1) relative to anchor distance.
- Per-year day classification complexity after initialization: linear in number of days generated for that year.
- Space complexity: O(1) rolling calculation state, excluding rendered/output structures.

## Calculation Algorithms
This section defines concrete math and pseudocode for phase and day-level moon events.

### Definitions
- `moon.period`: lunar cycle length in days (existing config value, e.g. `30 + 10.5 / 24`).
- `anchorFull`: known full-moon anchor in fantasy calendar coordinates:
- `anchorYear = calendar.fullMoon.year`
- `anchorDayOfYear = calendar.fullMoon.day`
- `targetYear`: year being generated.
- `targetDayOfYear`: day index in that year (`1..daysInYear(targetYear)`).
- Leap-year assumption: every leap year adds exactly `1` extra day.
- `baseYearDays = floor(daysInYear)`.
- `cyclePos`: normalized cycle position in `[0, 1)`.

### 1) O(1) year-start initialization from full-moon anchor
Use direct fantasy-day offset math (works for past and future years):

```text
daysOffset =
  (targetDayOfYear - anchorDayOfYear)
  + (targetYear - anchorYear) * baseYearDays
  + leapYearsBetween(anchorYear, targetYear)

cyclePos = mod(daysOffset / moon.period, 1)
```

Where:

```text
leapYearsBetween(a, b) = signed count of leap years in [min(a, b), max(a, b))
mod(x, m) = ((x % m) + m) % m
```

`leapYearsBetween(a, b)` should be computed with arithmetic (not per-year loops) to preserve O(1) initialization.

### 2) Incremental per-day progression
Advance by one day using constant step:

```text
dailyStep = 1 / moon.period
cyclePos(nextDay) = mod(cyclePos(today) + dailyStep, 1)
```

### 3) Classify daily moon state directly from `cyclePos`

```javascript
const FULL_WINDOW = 0.025;
const NEW_WINDOW = 0.025;
const HALF_LOWER_WANING = 0.225;
const HALF_UPPER_WANING = 0.275;
const HALF_LOWER_WAXING = 0.725;
const HALF_UPPER_WAXING = 0.775;

function classify(cyclePos) {
  if (cyclePos < FULL_WINDOW || cyclePos > 1 - FULL_WINDOW) return "full";
  if (Math.abs(cyclePos - 0.5) <= NEW_WINDOW) return "new";

  if (cyclePos > HALF_LOWER_WANING && cyclePos <= HALF_UPPER_WANING) return "half-waning";
  if (cyclePos > HALF_LOWER_WAXING && cyclePos <= HALF_UPPER_WAXING) return "half-waxing";

  return "none";
}
```

### 4) Day-level event extraction
Moon "events" for renderer markers are days whose `state !== "none"` at day start.

```javascript
for each day in generated year:
  state = classify(cyclePos)
  if (state !== "none") emit marker(day, state)
  cyclePos = advanceOneDay(cyclePos)
```

Notes:
- This naturally supports festival-day months (same daily loop logic).
- Intra-day threshold crossings are ignored by design because sampling is fixed at day start.

## Suggested Implementation Shape
- Keep shared calendar/date helpers in `src/ts/logic.ts`; keep moon-specific behavior in `src/ts/moon.ts`; keep rendering concerns in `src/ts/render.ts`.
- The moon module is implemented as a dedicated `Moon` class that accepts `MoonProps` (the subset of app props it needs) in its constructor, rather than reading global props directly.
- Replace the legacy tuple-based month moon API with a daily classification-oriented API:
- `getMonthMoonPhases(yearId, monthName)` returns day-indexed classified moon states for the renderer.
- `getMoonCyclePosition(yearId, monthName, dayId)` returns normalized `cyclePos` for the start of a target day.
- `MoonPhaseState` represents day-level classified states while preserving compatibility with existing rendering classes.

## Backward Compatibility
- Existing CSS class names for moon states remain unchanged.
- No externally visible behavior changes beyond revised day classification rules.

## Acceptance Criteria
- Moon state is determined from daily normalized cycle position, not quarter-event rounding.
- Daily moon classification sample point is day start for each calendar day.
- Threshold crossings during the day do not change that day classification.
- Classification windows are linearly mapped from prior semantics:
- old `<=5` new.
- old `45 < x <= 55` half.
- old `x > 95` full.
- Half moon still renders as waxing or waning via existing classes.
- Non-threshold days have no moon-state modifier class.
- Festival day moon marker follows same classification logic.
- Calculation method uses incremental previous-day progression.
- Year-start phase can be initialized directly from known full moon anchor without per-day traversal from anchor.
- Year-start initialization works for years both before and after the anchor year.

## Validation Plan
- Automated/logic checks:
- Verify boundary points around linear windows:
- `FULL_WINDOW`, just below/above `FULL_WINDOW`, `1 - FULL_WINDOW`, just below/above `1 - FULL_WINDOW`.
- `0.5 - NEW_WINDOW`, `0.5`, `0.5 + NEW_WINDOW`.
- `0.225` (excluded), just above `0.225`, `0.275` (included), just above `0.275`.
- `0.725` (excluded), just above `0.725`, `0.775` (included), just above `0.775`.
- Verify direction assignment for half moon on both waning and waxing windows.
- Verify classification continuity across month and year boundaries (including leap year transitions in calendar logic).
- Verify festival-day classification parity with normal days.
- Performance sanity:
- Validate direct year-start initialization for far-future and far-past years against a reference implementation.
- Confirm no day-by-day traversal from anchor is required for year-start phase calculation.

## Risks and Mitigations
- Risk: floating-point drift over long ranges.
- Mitigation: periodic normalization/wrap and tolerance-safe comparisons near boundaries.
- Risk: direction misclassification around wrap points.
- Mitigation: explicit phase-window logic and targeted boundary tests around full/new transitions.
- Risk: regression while removing renderer assumptions around the old tuple-based moon model.
- Mitigation: adapt renderer integration with minimal surface change and preserve class contract.
