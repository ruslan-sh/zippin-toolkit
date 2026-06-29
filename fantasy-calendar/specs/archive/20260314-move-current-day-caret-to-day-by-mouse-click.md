# Move Current Day Caret to Day by Mouse Click

Archived on 2026-04-09 after implementation. The click-to-select day behavior is now part of the project documentation.

## Summary

Allow the user to change the current calendar date by clicking or tapping a day cell in the rendered calendar for the currently displayed year. The interaction must move the current-day caret/highlight, update the application state shown in the controls, rerender the calendar for the selected date, and update the URL hash.

## Goals

- Make every rendered day cell an interactive target.
- On single click or touch tap, set the clicked day as the current date.
- Keep the rendered current-day indicator in sync with the newly selected date.
- Update the input controls (`year`, `month`, `day`) to match the selected date.
- Update the URL through the existing hash-based date helper.
- Preserve existing keyboard-based or control-based date changes.
- Include UX details that make the interaction discoverable and consistent.
- Keep the interaction scoped to dates already visible in the currently rendered year.

## Non-Goals

- No accessibility expansion beyond current app behavior.
- No additional side panels, moon details, or other secondary UI reactions.
- No change to webpack/build architecture.
- No unrelated refactor of render or logic modules.

## Current Behavior (Baseline)

- The current day is rendered with the `calendar__day--current` modifier only when it matches the date selected in the controls.
- The user can change the date through the inputs and the "Add days" calculator.
- Rendered day cells are not currently interactive.
- The URL is updated when the controls trigger a rerender.

## Proposed Behavior

### Primary interaction

- Each non-empty rendered day cell in a month table is clickable.
- On touch-capable devices, a normal tap on the same cell triggers the same behavior as a click.
- The interaction should be bound to the `click` event rather than `mousedown`.

Rationale:

- `click` maps cleanly to both mouse and tap behavior.
- It avoids moving the current day before the pointer interaction is complete.
- It aligns with the existing UI, which does not require drag-style interactions.

### State updates

- Clicking a day cell updates the active date to the clicked day.
- The app must then:
- keep the existing year input value unchanged;
- update the month select to the month containing the clicked day;
- update the day input to the selected day;
- rerender the calendar;
- write the new date to the URL.

### Scope of selection

- The interaction is limited to dates already rendered for the currently selected year.
- Clicking a day in another visible month within that same year switches the selected month/day.
- Changing to a different year remains the responsibility of the existing controls.

## Calendar Grid Requirements

The current implementation renders only dates that belong to the currently displayed year. Click behavior should be attached only to rendered dates in that year.

### Festival handling

- Festival months are represented separately from standard month tables.
- Clicking a festival title/day should be treated as selecting day `1` of that festival month.
- Leap-only festival months must only be selectable in leap years, matching current rendering rules.

## UX Details

### Discoverability

- Interactive day cells should use a pointer cursor.
- Hover and active styling should make it clear the cell can be selected.

### Current-day styling

- After selection, exactly one date should appear current.
- The existing current-day visual treatment should move to the newly selected date immediately after rerender.
- Clicking the date that is already current should produce no visible or state change.

### Interaction consistency

- Single click is the only mouse interaction to specify.
- Tap should behave the same as click where touch input is supported.
- No double-click-specific behavior is needed.

## Suggested Implementation Shape

- Keep date arithmetic and month/day traversal in `src/ts/logic.ts`.
- Keep DOM event wiring and visual class assignment in `src/ts/render.ts`.
- Reuse the existing URL update path in `src/ts/url-utils.ts` through the current render flow rather than adding a separate URL-writing path for click handling.

Implementation direction:

- Render metadata on each interactive day cell sufficient to identify its target date.
- Prefer storing the target year/month/day in `data-*` attributes or deriving it from local render context.
- Add one click handler per rendered interactive cell, or use event delegation on the month container if that keeps the diff smaller and clearer.
- After resolving the clicked target date, update the existing inputs and call the same render path used by control changes.
- Do not introduce month-to-month or year-to-year navigation behavior beyond selecting among the dates already rendered for the current year.

## Edge Cases

- Clicking an empty structural cell should do nothing.
- Clicking the current date should do nothing.
- Selecting a leap-only festival date in a non-leap year must not be possible.
- URL month segments with names containing special characters must continue to be encoded through the existing URL helper.

## Acceptance Criteria

- Every rendered real day is selectable by click/tap.
- The selected day becomes the only current day shown in the calendar.
- The year/month/day inputs reflect the clicked target date after the interaction.
- The URL updates to the clicked target date using the existing hash path format.
- Existing date changes via inputs and calculator continue to work.
- Clicking the current day produces no state or visible change.
- Clicking a day in another month within the same rendered year updates the selected month/day without changing the year.
- Festival dates remain selectable where valid and respect leap-year rules.
- Interactive styling clearly indicates that day cells can be selected.

## Validation Plan

- Automated:
- add DOM-oriented tests if the project introduces render interaction tests for click handling;
- verify URL updates still use the expected `#year/month/day` format after selection.

- Manual:
- click a normal day in the active month and verify current-day highlight, controls, and URL all update;
- click a day in a different visible month of the same rendered year and verify the selected month/day changes correctly;
- tap a day on a touch-capable device or emulator and verify parity with mouse click;
- click the already current day and verify there is no visible change;
- verify festival navigation behavior in both leap and non-leap years.

## Risks and Mitigations

- Risk: duplicated date-update code paths could drift from input-driven behavior.
- Mitigation: route click selection through the same input-update and rerender path already used by existing controls.

- Risk: festival selection can drift from current input-driven behavior if it uses a separate code path.
- Mitigation: route festival clicks through the same input-update and rerender path as normal day selection.
