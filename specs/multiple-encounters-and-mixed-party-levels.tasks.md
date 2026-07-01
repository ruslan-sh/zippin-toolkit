# Tasks For Multiple Encounters and Mixed-Level Parties

## Task 1: Build and calculate a mixed-level party

Status: todo

Summary: Replace the single party count/level pair with repeatable level-group
rows so users can calculate shared thresholds for a mixed-level party while
retaining one modifier applied after aggregation.

Scope:

- Render one initial party row with the existing defaults of four players at
  level 5 and keep the modifier as one party-wide control.
- Add controls to append and remove party rows while preventing removal of the
  final row.
- Give repeated controls stable identities, row-specific programmatic labels,
  descriptive remove actions, and sensible focus behavior after add/remove.
- Validate count and level independently in every row; make any invalid row
  invalidate the entire party, clear threshold output, and withhold the current
  encounter rank without changing its monster total.
- Calculate each row's base Low, Moderate, and High thresholds, sum them, then
  apply the shared percentage or flat modifier exactly once before the existing
  clamping and tiered rounding.
- Keep the existing initial result, modifier semantics, XP table, formatting,
  and live recalculation behavior unchanged for a one-row party.
- Keep the repeated layout usable on narrow screens with minimal localized
  SCSS changes.
- Add or update calculator and DOM tests with the behavior, rather than leaving
  test work for a later task.

Dependencies:

- Depends on: none
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test aggregation for two level-5 and two level-7 characters, producing
  2,500 Low, 4,100 Moderate, and 5,600 High XP before adjustment.
- Unit-test percentage and flat examples that prove the modifier and rounding
  occur after row summation rather than per row.
- Test initial values, row addition/removal, the one-row minimum, row-specific
  validation, recovery after correction/removal, accessible names, and focus
  behavior.
- Verify the existing encounter still recalculates its rank from the aggregated
  thresholds and retains its total when the party becomes invalid.
- Run `npm test`, `npm run lint`, `npm run lint:styles`, and `npm run build`.

Definition of done:

- A user can create and edit a mixed-level party through repeated count/level
  rows and receives correctly aggregated, adjusted thresholds.
- Invalid rows cannot be silently excluded, the final party row cannot be
  removed, and all row actions are keyboard-accessible and clearly labeled.
- Existing one-row calculations and the single encounter remain functional.
- All required validation commands pass, or an exact environmental reason for
  any command that cannot run is documented.

## Task 2: Manage multiple independent encounters

Status: todo

Summary: Turn the single encounter builder into a repeatable collection so
users can add, rename, edit, and delete independent encounters that all rank
against the mixed-level party from Task 1.

Scope:

- Render one initial empty encounter named `Encounter 1`, preserving the
  existing monster-row, statblock-link, validation, total, and ranking behavior
  inside that encounter.
- Add a page-level action that appends an empty encounter named from its
  creation position: `Encounter {current encounter count + 1}`.
- Keep stable internal encounter and monster identities independent of display
  names and mutable collection positions.
- Give every encounter instance its own monster rows, total, rank, and mutable
  name so edits in one instance cannot affect another.
- Add an accessible delete action per encounter; allow deletion of the final
  encounter, leave existing names unchanged after deletion, and keep the add
  action available in the empty state.
- Preserve the simple positional naming rule, including `Encounter 1` when
  adding from zero encounters and accepted duplicate names after deletion.
- Add a pencil rename action that is available on hover, keyboard focus, and
  touch; invoke the system prompt with the current name and accept a trimmed,
  non-empty result while treating cancellation or blank input as no change.
- Introduce an encounter coordinator that distributes party threshold changes
  to every encounter without changing encounter totals; invalid shared party
  state withholds all ranks.
- Provide distinct programmatic labels and sensible focus placement for
  repeated encounters and their add, rename, delete, and monster controls.
- Keep a long list of encounters usable on narrow screens with minimal
  localized SCSS changes.
- Update the calculator README to describe mixed-level parties and multiple
  transient encounters, removing the obsolete single-party/single-encounter
  boundary statements.
- Add or update DOM and calculation tests as part of the slice.

Dependencies:

- Depends on: Task 1
- Parallelizable: no
- Parallel with: none

Validation:

- Test the initial encounter and adding multiple independently editable
  encounters.
- Test default naming, deletion without renumbering, duplicate names, deleting
  the final encounter, and adding `Encounter 1` from the empty state.
- Test rename confirmation and trimming plus cancellation and blank input,
  including keyboard-accessible and descriptive controls.
- Test that monster edits, validation, totals, ranks, and statblock links are
  isolated to their encounter.
- Test that party and modifier edits recalculate every encounter rank from the
  same thresholds without changing any encounter total, and that invalid party
  state withholds all ranks.
- Test focus behavior after encounter add/delete and repeated-control accessible
  names.
- Run `npm test`, `npm run lint`, `npm run lint:styles`, and `npm run build`.

Definition of done:

- A user can add, rename, populate, and delete any number of encounters in one
  session, including deleting all encounters and starting again.
- Every encounter remains isolated except for its deliberate use of the shared
  party thresholds, and duplicate display names cause no identity collision.
- Repeated interactions are keyboard-accessible, touch-usable, clearly labeled,
  focus-aware, and usable on narrow screens.
- Documentation reflects the shipped mixed-party and multiple-encounter
  behavior while persistence/import/export remain deferred.
- All required validation commands pass, or an exact environmental reason for
  any command that cannot run is documented.
