# Encounter Difficulty Calculator

This framework-free D&D 5.5 tool calculates party XP thresholds and ranks one
multi-monster encounter. It is linked from the toolkit landing page and is
available at `encounter-difficulty-calculator/`.

## Party thresholds

Enter a positive player count and one shared character level from 1 through
20. The calculator multiplies the per-character XP values for that level by
the player count and displays Low, Moderate, and High thresholds.

One optional modifier applies to all three thresholds:

- percentage: `base × (1 + modifier / 100)`;
- flat XP: `base + modifier`.

Negative modifiers are supported. Adjusted values are clamped to zero, then
rounded to the nearest 25 XP below 500, 50 XP from 500 through 999, or 100 XP
at 1,000 and above. Halfway values round upward.

## Encounter builder

The page contains one encounter with any number of monster rows. Each complete
row requires a positive whole-number quantity and non-negative whole-number XP
value; its contribution is `quantity × XP`. A name and an HTTP or HTTPS
statblock URL are optional. Invalid or incomplete rows display validation and
do not contribute to the total.

The total and textual rank update as party, modifier, or monster values change.
For adjusted Low (`L`), Moderate (`M`), and High (`H`) thresholds, ranks are:

| Rank | Encounter XP |
| --- | --- |
| Trivial | At most `80% × L` |
| Low | Above `80% × L` and below `90% × M` |
| Moderate | At least `90% × M` and below `90% × H` |
| High | At least `90% × H` and below `120% × H` |
| Deadly | At least `120% × H` |

The percentage boundaries are not rounded. When adjusted thresholds overlap,
the most severe matching rank wins. No rank is shown until party input is
valid.

## Boundaries

Calculator state is transient and resets on refresh. The tool does not import
monster data, apply monster-count or party-size multipliers, support mixed
party levels or multiple encounters, or save and share encounters.

## Development

Run the tool with the repository-level `npm run start`. Its TypeScript, SCSS,
template, and tests live in this directory; production output is generated
under `dist/encounter-difficulty-calculator/`.
