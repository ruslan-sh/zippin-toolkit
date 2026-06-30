# Calendar Date Selection

## Purpose
This document describes the implemented ways the active calendar date can be selected or changed in the UI. It reflects the current renderer behavior in `fantasy-calendar/src/ts/render.ts`, the application bootstrap in `fantasy-calendar/src/index.ts`, and the URL synchronization handled through `fantasy-calendar/src/ts/url-utils.ts`.

## Scope
- Initial date selection from the URL.
- Direct date selection from form controls.
- Relative date selection through the day-offset calculator.
- Direct date selection from rendered calendar cells and festivals.
- Synchronization between rendered current-day state, form controls, and URL hash.

## Initial Selection
- On startup, `fantasy-calendar/src/index.ts` reads the date from the browser URL before rendering the controls.
- The preferred URL format is the hash path `#year/month/day`.
- `fantasy-calendar/src/ts/url-utils.ts` also accepts the older query-string form `?y=...&m=...&d=...`.
- If a URL part is missing, the controls fall back to their built-in defaults during render.

## Selection Methods

### Direct Control Inputs
- Changing the `Year` input selects a new year for the current month and day values.
- Changing the `Month` select chooses a new month for the current year and day values.
- Changing the `Day` input chooses a new day for the current year and month values.
- When the selected month is a festival month, the day input is disabled and forced to `1`.

### Relative Date Calculator
- The `Add days` control computes a new date from the currently selected date.
- The resulting year, month, and day become the new active date.
- This path can move the selection across months, festivals, leap days, and years.

### Calendar Grid Selection
- Clicking or tapping a rendered day cell selects that exact date.
- Clicking or tapping a rendered festival title selects day `1` of that festival month.
- Clicking the already selected date produces no visible or state change.

## Shared Result of Selection
All implemented selection methods converge on the same rendered state:
- the active year, month, and day values are shown in the form controls;
- the calendar rerenders for that selection;
- the current-day styling moves to the selected day or festival;
- the URL hash is updated through the existing render flow to `#year/month/day`.

## Selection Boundaries
- Date selection is limited to dates rendered for the currently selected year.
- Empty structural cells are not interactive.
- Leap-only festivals are selectable only in leap years because they are rendered only when valid.
- Calendar-grid selection does not provide direct year-to-year navigation; changing year remains a control-driven action.

## Implementation Notes
- `fantasy-calendar/src/index.ts` initializes the first rendered date from `readDateFromUrl()`.
- `fantasy-calendar/src/ts/render.ts` stores target dates on interactive elements with `data-year`, `data-month`, and `data-day`.
- A single click handler on `#calendarContainer` resolves the clicked target by event delegation.
- Calendar-grid selection reuses the same input-update and rerender path used by control-based changes, which keeps URL updates and current-day styling aligned.
- URL writes always use the hash-path format, even when the initial date came from the older query-string format.
