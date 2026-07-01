# Multiple Encounters and Mixed-Level Parties

## Summary

Extend the Encounter Difficulty Calculator so one shared party can contain
multiple level groups and can be used to rank multiple independently editable
encounters. Keep the existing calculation rules, modifier behavior, monster
rows, and transient page state.

## Goals

- Let users describe a mixed-level party as multiple player-count and level
  rows.
- Sum every valid party row's base thresholds, then apply the one shared
  modifier to the summed thresholds.
- Let users add, rename, edit, and delete multiple encounters on one page.
- Calculate each encounter's total and difficulty independently against the
  shared party thresholds.
- Preserve the calculator's framework-free, minimal, accessible UI.

## Non-Goals

- Persisting party or encounter state across refreshes.
- Importing, exporting, sharing, or storing encounters.
- Assigning a different party or modifier to each encounter.
- Named individual characters or per-character inputs.
- Reordering party rows, encounters, or monster rows.
- Encounter tabs, cards, duplication, or enforced unique names.
- Changing XP tables, threshold adjustment, rounding, encounter ranking, or
  monster validation rules.
- Introducing new dependencies or changing shared build architecture.

## Current Behavior

The calculator has one party row containing a player count and shared level,
one modifier, and one encounter. The party thresholds are calculated from the
single row, and the encounter is ranked against them. Calculator state resets
on refresh.

## Proposed Behavior

### Mixed-level party rows

Replace the single player-count and level pair with a repeatable list of party
rows. Each row uses the existing controls and validation:

- player count must be a positive integer; and
- level must be an integer from 1 through 20.

The page initially contains one row with the existing defaults of four players
at level 5. Users can add and remove rows. At least one party row must remain,
so the only remaining row cannot be removed.

For each difficulty, calculate every valid row's base threshold as:

```text
row base threshold = player count × per-character threshold at that level
```

Then sum the rows:

```text
party base threshold = sum of all row base thresholds
```

Keep one modifier control for the entire party. Apply it once to each summed
Low, Moderate, and High threshold using the existing percentage or flat-XP
formula, followed by the existing clamping and rounding rules. Do not apply or
round the modifier separately per row.

If any party row is incomplete or invalid, the whole party is invalid: show
that row's validation, clear the displayed party thresholds, and withhold ranks
from every encounter. This prevents a malformed row from being silently
excluded from the party. Removing or correcting the row restores calculation.

### Multiple encounters

The page initially contains one empty encounter named `Encounter 1`. Each
encounter has the current encounter UI and behavior:

- a heading containing its name, rank, and XP total;
- independently managed monster rows; and
- the existing monster input, validation, statblock-link, total, and ranking
  behavior.

Provide one page-level action to append a new empty encounter. Its default name
is based only on its new position at creation time:

```text
Encounter {current encounter count + 1}
```

Deleting an encounter does not rename or renumber the remaining encounters.
Consequently, deleting one and adding another can produce duplicate default
names; encounter names do not need to be unique. Users may delete any
encounter, including the final one. If none remain, the add action remains
available and creates `Encounter 1`.

Each encounter has a delete action with an unambiguous accessible name. Deleting
one encounter must not alter the party or any other encounter.

### Encounter naming

Each encounter heading has an edit action represented by a pencil icon. The
action may be visually revealed when the name area is hovered, but it must also
be visible when focused and remain keyboard accessible without hover.

Activating the edit action opens the browser's system prompt initialized with
the current name. A non-empty entered value, trimmed of surrounding whitespace,
replaces the name. Cancelling the prompt or submitting an empty/whitespace-only
value leaves the current name unchanged. Renaming affects no calculations and
names do not need to be unique.

### Independent calculation

All encounters share the same calculated party thresholds. Each encounter
sums only its own monster rows and derives its own rank from that total. Adding,
editing, renaming, or deleting one encounter must not change any other
encounter's monsters, total, or rank.

Changes to a party row or the shared modifier recalculate the thresholds once
and immediately update the rank of every encounter. Encounter totals remain
unchanged by party edits.

## Accessibility and Interaction Requirements

- Calculations update without submission or page reload.
- Every repeated party row, encounter, and monster control has a stable
  programmatic label that distinguishes it from its peers.
- Add, edit, and delete actions are keyboard operable and have descriptive
  accessible names; icon meaning is not the only accessible label.
- Hover-only presentation of the rename pencil must not hide it from keyboard
  users or touch interaction.
- Validation identifies the affected party or monster row and the required
  correction.
- Adding or deleting a row or encounter should move focus to a sensible nearby
  control and must not unexpectedly reset unrelated input.
- The page remains usable on narrow screens and with many party rows,
  encounters, or monsters.

## Acceptance Criteria

- The initial state contains one party row for four level-5 players and one
  empty encounter named `Encounter 1`.
- A party with two level-5 characters and two level-7 characters produces base
  thresholds of 2,500 Low, 4,100 Moderate, and 5,600 High XP before adjustment.
- Percentage and flat modifiers are each applied once to the summed party
  thresholds, not once per party row.
- The existing clamp and tiered-rounding rules operate on the adjusted summed
  thresholds.
- An invalid party row invalidates the shared thresholds and withholds every
  encounter rank without changing encounter totals.
- Users can add and remove party rows while at least one row remains.
- Users can add multiple encounters, and each new encounter's default name is
  based on the encounter count immediately before it is appended.
- Deletion does not renumber existing names, and duplicate default or custom
  encounter names are accepted.
- Users can rename an encounter through a system prompt; cancellation and
  empty input preserve the existing name.
- Users can delete every encounter and can add a new `Encounter 1` from the
  empty state.
- Editing monsters in one encounter changes only that encounter's total and
  rank.
- Party and modifier changes update every encounter rank against the same
  thresholds while leaving all encounter totals intact.
- Refreshing the page resets to the initial party and encounter state.

## Validation Plan

- Unit-test aggregation across mixed levels, including representative rows,
  invalid rows, and modifier application after summation.
- Test percentage and flat modifiers with values whose result would differ if
  modification or rounding occurred per row.
- Preserve existing tests for XP tables, clamping, rounding, ranking, monster
  totals, validation, and safe statblock URLs.
- Test DOM interactions for adding and removing party rows, including the
  one-row minimum and invalid-row behavior.
- Test adding and deleting encounters, default naming after deletion, duplicate
  names, deletion of the last encounter, and adding from an empty state.
- Test rename confirmation, trimming, cancellation, and empty input.
- Test that monster edits remain isolated to one encounter and party edits
  update all encounter ranks.
- Test accessible names and focus behavior for repeated add, rename, and delete
  controls.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.
- Do not edit or commit generated `dist/` output.

## Implementation Constraints and Risks

- Separate the party's row aggregation from modifier application so the
  modifier cannot accidentally be applied or rounded per row.
- Give party rows, encounters, and monster rows stable internal identifiers;
  do not use displayed names or mutable array positions as identity.
- The current encounter builder owns one set of DOM references and mutable
  state. Multiple encounters will require instance-local state plus a small
  coordinator that distributes shared thresholds to every instance.
- Keep changes localized to `encounter-difficulty-calculator/` and its tests
  except for this spec and the roadmap status update.
