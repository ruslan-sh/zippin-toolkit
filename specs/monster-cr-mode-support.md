# Monster Challenge Rating and Minion Support

## Summary

Add Challenge Rating (CR) and a per-monster Minion trait to encounter rows.
CR is the default way to enter a monster: selecting a CR calculates the row's
XP using the appropriate standard or Minion table. XP remains editable so
users can represent exceptions or creatures whose statblock XP differs from
the table. Encounter totals and difficulty ranks continue to use XP only.

## Goals

- Add a CR control to every monster row, with the supported CR values exposed
  consistently.
- Calculate XP immediately when a CR is selected or changed.
- Add a Minion trait that switches the CR-to-XP mapping for that row.
- Keep XP directly editable and make direct XP edits authoritative until CR or
  Minion changes again.
- Persist and export CR and Minion state while migrating existing XP-only
  workspaces.
- Preserve the calculator's existing totals, difficulty ranking, statblock
  links, and validation behavior.

## Non-goals

- Importing monster data or parsing statblock URLs.
- Looking up monsters by name or providing a monster library.
- Applying encounter multipliers, party-size multipliers, or automatic
  quantity changes.
- Changing encounter ranking boundaries or party threshold calculations.

## Current behavior

Each monster row currently stores a name, XP, quantity, and optional statblock
URL. XP is entered manually, and a complete row contributes `quantity × XP` to
the encounter total. Workspace schema version 1 has no CR or Minion fields and
the YAML import/export contract requires that exact shape.

## Proposed behavior

### Monster row controls

Every monster row exposes:

- Monster Name, unchanged and optional.
- Challenge Rating, an optional control with a blank value plus the canonical
  values `0`, `1/8`, `1/4`, `1/2`, and whole numbers `1` through `30`.
- XP, an editable non-negative whole-number input.
- Quantity, an editable positive whole-number input.
- The existing optional statblock URL control.
- A Minion checkbox or equivalent boolean control, off by default.

New rows start with blank CR, blank XP, quantity `1`, and Minion off. A blank
CR does not invalidate a row when its XP and quantity are valid. If CR is
cleared after XP was calculated, the last XP value remains unchanged; users
may continue to edit it directly.

### CR-to-XP calculation

Selecting or changing a CR immediately replaces the row's XP with the mapped
XP value. Changing CR does not require confirmation and does not preserve a
manual XP override. If Minion is off, use the standard table. If Minion is on,
use the Minion table.

The standard mapping follows the standard D&D 5.5 CR-to-XP rules:

| CR | XP |
|---:|---:|
| 0 | 10 |
| 1/8 | 25 |
| 1/4 | 50 |
| 1/2 | 100 |
| 1 | 200 |
| 2 | 450 |
| 3 | 700 |
| 4 | 1,100 |
| 5 | 1,800 |
| 6 | 2,300 |
| 7 | 2,900 |
| 8 | 3,900 |
| 9 | 5,000 |
| 10 | 5,900 |
| 11 | 7,200 |
| 12 | 8,400 |
| 13 | 10,000 |
| 14 | 11,500 |
| 15 | 13,000 |
| 16 | 15,000 |
| 17 | 18,000 |
| 18 | 20,000 |
| 19 | 22,000 |
| 20 | 25,000 |
| 21 | 33,000 |
| 22 | 41,000 |
| 23 | 50,000 |
| 24 | 62,000 |
| 25 | 75,000 |
| 26 | 90,000 |
| 27 | 105,000 |
| 28 | 120,000 |
| 29 | 135,000 |
| 30 | 155,000 |

CR 0 uses 10 XP by default. The user may directly edit it to 0 XP for
creatures that award no XP.

The Minion mapping is taken from MCDM's *Flee, Mortals!*:

| CR | XP |
|---:|---:|
| 0 | 2 |
| 1/8 | 5 |
| 1/4 | 10 |
| 1/2 | 20 |
| 1 | 40 |
| 2 | 90 |
| 3 | 140 |
| 4 | 220 |
| 5 | 225 |
| 6 | 285 |
| 7 | 360 |
| 8 | 485 |
| 9 | 500 |
| 10 | 590 |
| 11 | 720 |
| 12 | 840 |
| 13 | 1,000 |
| 14 | 1,150 |
| 15 | 1,300 |
| 16 | 1,500 |
| 17 | 1,800 |
| 18 | 2,000 |
| 19 | 2,200 |
| 20 | 2,500 |
| 21 | 3,300 |
| 22 | 4,100 |
| 23 | 5,000 |
| 24 | 6,200 |
| 25 | 7,500 |
| 26 | 9,000 |
| 27 | 10,500 |
| 28 | 12,000 |
| 29 | 13,500 |
| 30 | 15,500 |

CR 0 Minions use 2 XP by default. The user may directly edit the XP to 0.

Changing Minion immediately replaces XP from the selected CR's other mapping
when CR is present. If CR is blank, changing Minion does not change XP. Direct
XP edits never clear or alter CR or Minion, and show no warning about a mismatch.

All existing row validation remains based on XP and quantity. A valid XP and
quantity contribute normally regardless of whether CR is blank, and all
encounter totals and ranks continue to be calculated from the resulting XP.

### Workspace and YAML schema

Increase the workspace schema to version 2. Each monster stores these fields:

```yaml
name: Ogre
cr: "4"
xp: 1100
quantity: 1
url: ""
minion: false
```

`cr` is either `null` or one of the canonical CR strings. `xp` and `quantity`
remain finite numbers or `null` in the source workspace representation, so
empty and in-progress numeric edits continue to round-trip as before.
`minion` is a boolean. Derived XP totals, ranks, validation markup, focus, and
generated DOM identifiers are not persisted.

Version-1 local-storage and YAML workspaces remain readable. Migration adds
`cr: null` and `minion: false` to every existing monster and retains its XP
unchanged. New saves and exports use version 2. Version-2 parsing remains
strict: unsupported CR values, wrong field types, unknown fields, and malformed
structures are rejected according to the existing workspace import contract.

### Documentation

Update `encounter-difficulty-calculator/docs/calculator.md` to document CR and
Minion controls, conversion behavior, defaults, direct XP overrides, version-2
workspace fields, and version-1 migration. The documentation must identify the
standard CR-to-XP mapping as following D&D 5.5 rules and attribute the Minion
mapping to MCDM's *Flee, Mortals!*.

## Acceptance criteria

- Every new and restored monster row displays CR, XP, quantity, statblock, and
  Minion controls with accessible labels.
- New rows have blank CR and XP, quantity 1, and Minion off.
- Selecting every supported standard CR produces the table's XP, including
  standard CR 0 = 10.
- Selecting every supported Minion CR produces the Minion table's XP,
  including Minion CR 0 = 2.
- Changing CR immediately overwrites XP without a confirmation or warning.
- Toggling Minion immediately switches the calculated XP when CR is present.
- Direct XP edits remain valid and affect totals/ranks without requiring CR;
  they do not modify CR or Minion.
- Clearing CR leaves the current XP unchanged, and a blank CR does not make an
  otherwise valid XP/quantity row invalid.
- Encounter totals and difficulty ranks use XP exactly as before.
- Version-1 saved and imported workspaces migrate with XP preserved, blank CR,
  and Minion off.
- Version-2 storage and YAML round trips preserve CR, XP, quantity, name, URL,
  and Minion state and reject unsupported CR values or malformed structures.
- Existing storage/import transaction guarantees remain intact when migration,
  rendering, or saving fails.
- Documentation describes the new behavior, the unchanged calculation
  boundaries, and the sources of the standard and Minion XP mappings.

## Validation plan

- Unit-test the standard and Minion lookup tables for all supported CR values,
  both CR 0 defaults, and the absence of a mapping for blank/invalid CR.
- Unit-test that encounter totals accept manually overridden XP and do not
  depend on CR or Minion state.
- UI-test initial controls, CR-to-XP updates, Minion toggles, direct XP edits,
  clearing CR, accessible labels, and autosave snapshots.
- Test workspace validation, YAML serialization, version-1 migration, version-2
  round trips, and rejection of invalid CR values or non-boolean Minion data.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

## Implementation constraints and risks

- Keep CR-to-XP mappings in a pure calculator module so both UI behavior and
  table coverage can be tested without a browser.
- Keep `MonsterInput` calculation semantics XP-based; CR and Minion are source
  controls used only to update the editable XP field.
- Avoid adding dependencies or broad encounter-state refactors.
- Treat schema migration as an explicit compatibility path rather than
  weakening version-2 validation.
- The standard CR 0 table has a creature-specific 0-or-10 XP rule. This feature
  uses 10 as the default and preserves the user's ability to override XP to 0.
