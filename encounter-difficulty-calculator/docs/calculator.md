# Encounter Difficulty Calculator

The framework-free D&D 5.5 calculator builds a shared mixed-level party and
ranks multiple independent encounters against its XP thresholds.

## Party thresholds

The party contains one or more groups. Each group has a positive whole-number
player count and a character level from 1 through 20. The calculator sums each
group's per-character XP thresholds before displaying the party's Low,
Moderate, and High thresholds.

One optional party-wide modifier applies after the group thresholds are
summed:

- percentage: `base × (1 + modifier / 100)`;
- flat XP: `base + modifier`.

Negative modifiers are supported. Adjusted values are clamped to zero, then
rounded to the nearest 25 XP below 500, 50 XP from 500 through 999, or 100 XP
at 1,000 and above. Halfway values round upward.

An invalid group invalidates the shared party: displayed thresholds and every
encounter rank are withheld until the group is corrected or removed.

## Encounters

The page starts with `Encounter 1` and supports any number of independently
named encounters. Encounters can be added, renamed, or deleted, including the
final encounter. New default names use the collection size at creation time,
so duplicate names are allowed and deleting an encounter does not renumber the
others.

Each encounter contains any number of monster rows. A complete row requires a
positive whole-number quantity and non-negative whole-number XP value; its
contribution is `quantity × XP`. A monster name and HTTP or HTTPS statblock URL
are optional. Invalid or incomplete rows show validation and do not contribute
to the total.

Each encounter maintains its own monster rows, total, and rank. Party or
modifier changes recalculate every rank without changing encounter totals.

## Difficulty ranks

For adjusted Low (`L`), Moderate (`M`), and High (`H`) thresholds, ranks are:

| Rank | Encounter XP |
| --- | --- |
| Trivial | At most `80% × L` |
| Low | Above `80% × L` and below `90% × M` |
| Moderate | At least `90% × M` and below `90% × H` |
| High | At least `90% × H` and below `120% × H` |
| Deadly | At least `120% × H` |

The percentage boundaries are not rounded. When adjusted thresholds overlap,
the most severe matching rank wins. The displayed rank is also color-coded:
gray for Trivial, green for Low, yellow for Moderate, orange for High, and red
for Deadly. Text remains the primary rank indicator.

## Workspace persistence

The calculator automatically stores one complete editable workspace in browser
local storage under `zippin-toolkit.encounter-workspace.v1`. The stored JSON
object has `version`, `party`, and ordered `encounters` fields. Party groups and
monster rows are ordered arrays. Numeric controls are stored as finite JSON
numbers or `null`; empty or unexpectedly nonnumeric controls become `null`,
while out-of-range values remain numbers so validation can resume after refresh.

On startup, a supported version-1 workspace is restored before the calculator
renders, then thresholds, totals, ranks, and validation messages are derived
again. Calculated results, validation presentation, focus, and generated DOM
identifiers are not stored. Missing storage uses the normal defaults. If storage
is unavailable, unreadable, malformed, or unsupported, the calculator remains
usable, leaves the unreadable value untouched, loads defaults, and reports the
problem in an accessible status message. Save failures are likewise reported
without interrupting in-memory editing.

## YAML backup export

The **Export YAML backup** button downloads the workspace currently visible in
the calculator as `encounter-workspace.yml`. Export uses the in-memory state, so
it includes the latest edits even if browser storage is unavailable or full.

The YAML document uses the same stable version-1 source schema as storage:

```yaml
version: 1
party:
  groups:
    - playerCount: 4
      level: 5
  modifierType: percentage
  modifierValue: 0
encounters:
  - name: Encounter 1
    monsters:
      - name: ""
        xp: null
        quantity: 1
        url: ""
```

Array order is significant. Numeric fields are unquoted YAML numbers or `null`;
out-of-range numbers round-trip and `null` restores as an empty input. Names,
modifier types, and URLs are ordinary YAML
strings; let a YAML editor preserve or add quoting for characters such as `:`,
`#`, line breaks, and non-ASCII text. Derived totals, ranks, validation markup,
focus, and generated DOM identifiers are never exported.

## YAML backup import

The **Import YAML backup** control accepts `.yml` and `.yaml` files using the
documented version-1 schema. The complete document is safely parsed and
validated before a permanent-replacement warning is shown. Unknown or missing
fields, unsupported versions, wrong scalar types, non-finite numeric values,
custom YAML tags, and non-HTTP(S) statblock URLs are rejected.

After confirmation, the calculator replaces the visible workspace, derives
totals, ranks, and validation messages again, and saves the imported snapshot.
Canceling or encountering a read, parse, validation, rendering, or storage
failure leaves the previous visible and stored workspace unchanged. Import
successes, cancellations, and failures are reported in alert dialogs.

## Boundaries

The tool does not import monster data, apply monster-count or party-size
multipliers, or share encounters.

## Implementation

- `src/party-calculator.ts` aggregates and adjusts party thresholds.
- `src/party-ui.ts` manages party groups and shared validation.
- `src/encounter-calculator.ts` validates monsters, totals XP, and ranks
  encounters.
- `src/encounter-ui.ts` manages independent encounter instances and distributes
  shared thresholds.
- `src/workspace-state.ts` defines and validates the versioned source state.
- `src/workspace-storage.ts` loads and saves the state without depending on the
  DOM.
- `src/workspace-yaml.ts` serializes the stable YAML backup representation.
- `src/workspace-import.ts` validates and transactionally applies YAML backups.
