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

## Boundaries

Calculator state is transient and resets on refresh. The tool does not import
monster data, apply monster-count or party-size multipliers, persist state, or
share encounters.

## Implementation

- `src/party-calculator.ts` aggregates and adjusts party thresholds.
- `src/party-ui.ts` manages party groups and shared validation.
- `src/encounter-calculator.ts` validates monsters, totals XP, and ranks
  encounters.
- `src/encounter-ui.ts` manages independent encounter instances and distributes
  shared thresholds.
