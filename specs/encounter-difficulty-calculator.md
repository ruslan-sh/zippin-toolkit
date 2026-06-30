# Encounter Difficulty Calculator

## Summary

Add a framework-free D&D 5.5 encounter difficulty calculator to Zippin's
Toolkit. A user defines a party, optionally adjusts its XP thresholds, and
builds an encounter from monsters. The tool continuously totals and ranks the
encounter as Trivial, Low, Moderate, High, or Deadly.

The first version is a transient calculator. Saving, persistence, URL sharing,
and external monster data are intentionally deferred.

## Goals

- Calculate a party from a player count and one shared character level.
- Calculate Low, Moderate, and High party XP thresholds from the supplied
  per-character table.
- Apply one optional percentage or flat-XP modifier to all three thresholds.
- Let users build one encounter containing multiple monsters.
- Recalculate the encounter XP total and difficulty ranking immediately after
  relevant input changes.
- Add the tool as an independently addressable project and link it from the
  toolkit landing page.
- Prioritize correct, understandable functionality over visual design.

## Non-Goals

- Looking up, importing, or validating monster statistics against an external
  rules source.
- Applying encounter multipliers based on monster count or party size.
- Persisting calculator state across refreshes.
- Encoding state in a shareable URL.
- Mixed-level parties and per-character level input.
- Multiple encounters on the same page.
- User accounts, saved encounter libraries, or cross-device synchronization.
- Decorative styling, animation, a bespoke visual identity, or a reusable
  component/design system.
- Changing Fantasy Calendar behavior or introducing a shared UI framework.

## Repository Integration

Create a self-contained top-level tool directory, following the existing
multi-tool structure. Keep dependencies and build orchestration at the
repository root.

The implementation must:

- have its own TypeScript/SCSS source, HTML template, tests, and scoped
  documentation as appropriate;
- be included in the shared TypeScript, lint, stylelint, test, webpack, and
  production-build configuration;
- produce an isolated page and assets under
  `dist/encounter-difficulty-calculator/`;
- be available at the relative route `encounter-difficulty-calculator/`; and
- be represented by an accessible link or card on the landing page.

Do not manually edit generated files in `dist/` or add a new dependency unless
the implementation demonstrably requires one.

## Markup and Styling Constraints

The initial implementation must produce minimal semantic HTML and CSS. Design
polish is subordinate to calculator behavior, clarity, validation, and
accessibility.

- Use native HTML elements and browser behavior wherever practical.
- Add CSS classes only when they are necessary for behavior, accessibility,
  basic legibility, or a minimal usable layout.
- Each class must contain only the declarations needed for that purpose; avoid
  decorative rules and speculative styling hooks.
- Do not create a component library, utility-class system, design tokens, or
  elaborate SCSS structure for this tool.
- Keep spacing, typography, borders, colors, and responsive rules to the
  minimum needed to keep inputs and results readable and usable.
- Do not imitate or refactor Fantasy Calendar styling merely for visual
  consistency.

## Party Input

The party editor contains:

- number of players; and
- one shared party level from 1 through 20.

Player count must be a positive integer. Level must be an integer from 1
through 20. Empty or invalid fields prevent party calculation and must show a
clear validation state. The interface must distinguish an incomplete party
from a valid party whose adjusted threshold is zero.

## Base XP Thresholds

Each table entry is the XP threshold for one character at that level:

| Character level | Low | Moderate | High |
| ---: | ---: | ---: | ---: |
| 1 | 50 | 75 | 100 |
| 2 | 100 | 150 | 200 |
| 3 | 150 | 225 | 400 |
| 4 | 250 | 375 | 500 |
| 5 | 500 | 750 | 1,100 |
| 6 | 600 | 1,000 | 1,400 |
| 7 | 750 | 1,300 | 1,700 |
| 8 | 1,000 | 1,700 | 2,100 |
| 9 | 1,300 | 2,000 | 2,600 |
| 10 | 1,600 | 2,300 | 3,100 |
| 11 | 1,900 | 2,900 | 4,100 |
| 12 | 2,200 | 3,700 | 4,700 |
| 13 | 2,600 | 4,200 | 5,400 |
| 14 | 2,900 | 4,900 | 6,200 |
| 15 | 3,300 | 5,400 | 7,800 |
| 16 | 3,800 | 6,100 | 9,800 |
| 17 | 4,500 | 7,200 | 11,700 |
| 18 | 5,000 | 8,700 | 14,200 |
| 19 | 5,500 | 10,700 | 17,200 |
| 20 | 6,400 | 13,200 | 22,000 |

For each difficulty, calculate the party's base threshold as:

```text
number of players × per-character threshold at the shared party level
```

The displayed party results use the terms Low, Moderate, and High. They must
show XP units and locale-friendly thousands separators.

## Difficulty Modifier

The party has at most one active modifier. The user selects either percentage
or flat XP and enters a signed numeric value. Zero or an empty modifier means
no adjustment.

- Percentage: `adjusted = base × (1 + modifier / 100)`
- Flat XP: `adjusted = base + modifier`

Apply the selected modifier independently to Low, Moderate, and High. Negative
modifiers are valid, but each adjusted threshold is clamped to a minimum of
zero before rounding. The modifier must not mutate the underlying base values.

Round each adjusted result to the nearest increment based on the clamped,
unrounded result:

- below 500 XP: nearest 25 XP;
- from 500 XP through 999 XP: nearest 50 XP; and
- 1,000 XP or greater: nearest 100 XP.

Exact halfway values round upward. This rounding also applies when the active
modifier is zero, so all displayed and ranking thresholds follow one rule.

## Encounter Editor

One encounter appears after the party thresholds and supports adding and
removing any number of monster rows. The encounter itself cannot be duplicated
or removed.

Each monster row contains:

- name;
- quantity;
- XP per unit; and
- statblock URL.

Name, quantity, and XP are required for a complete monster row. Quantity must
be a positive integer and XP must be a non-negative integer. The statblock URL
is optional so custom monsters remain usable; when present and valid, render it
as a safe external link. Invalid or incomplete monster rows must show clear
validation and must not silently contribute a partial value.

Calculate each complete monster row as:

```text
monster XP = quantity × XP per unit
```

The encounter XP is the sum of its valid monster-row totals. Display its total
XP and current difficulty rank. Recalculate immediately when the party,
modifier, or any monster quantity or XP changes.

## Encounter Ranking

Let `L`, `M`, and `H` be the adjusted and rounded Low, Moderate, and High party
thresholds. Rank encounter XP using these boundaries:

| Rank | Boundary |
| --- | --- |
| Trivial | XP is at most `80% × L` |
| Low | XP is above `80% × L` and below `90% × M` |
| Moderate | XP is at least `90% × M` and below `90% × H` |
| High | XP is at least `90% × H` and below `120% × H` |
| Deadly | XP is at least `120% × H` |

The 80%, 90%, and 120% ranking boundaries are calculated from the adjusted,
rounded party thresholds but are not themselves rounded. This preserves exact
comparisons for integer encounter XP. A value exactly on a lower boundary is
assigned to the higher rank, except the inclusive Trivial upper boundary
defined above.

Do not show a rank until the party is valid. If adjusted thresholds collapse
or overlap because of an extreme negative modifier, evaluate the ranks from
highest to lowest (`Deadly`, `High`, `Moderate`, `Low`, `Trivial`) so the most
severe matching rank wins.

Example for `L = 1,000`, `M = 1,700`, and `H = 2,100`:

- Trivial: 0–800 XP;
- Low: 801–1,529 XP;
- Moderate: 1,530–1,889 XP;
- High: 1,890–2,519 XP; and
- Deadly: 2,520 XP or more.

## Interaction and Accessibility Requirements

- Calculations update without a submit or page reload.
- Adding or removing a monster must not reset other valid input.
- All controls have programmatic labels and are keyboard accessible.
- Validation messages identify the field and correction needed.
- Difficulty is communicated with text, not color alone.
- Destructive remove actions have unambiguous accessible names.
- The layout remains usable on narrow mobile screens and with many monsters.
- Visual simplicity must not remove labels, validation feedback, focus
  visibility, or other accessibility essentials.

## Acceptance Criteria

- A party of four level-5 characters produces base thresholds of 2,000 Low,
  3,000 Moderate, and 4,400 High XP.
- Changing the shared level applies that level's table row to every player.
- Switching between percentage and flat XP activates only the selected
  modifier and recalculates every party threshold.
- Signed modifiers, zero clamping, tiered rounding, and halfway-up behavior
  match the formulas in this spec.
- Users can independently add, edit, and remove multiple monsters in the one
  encounter.
- The encounter total equals the sum of `quantity × XP per unit` for its
  complete monster rows.
- The encounter rank updates immediately and matches every inclusive/exclusive
  boundary in the ranking table.
- The calculator works after direct navigation to its nested route under the
  GitHub Pages repository base path.
- Refreshing the page resets calculator data in this version.
- The landing page links to the new tool, while Fantasy Calendar behavior and
  routing remain unchanged.
- The delivered HTML and CSS remain minimal and contain no design work beyond
  what is required for usability and accessibility.

## Validation Plan

- Unit-test all 20 XP-table rows and representative player-count products.
- Unit-test percentage and flat modifiers, positive and negative inputs, zero
  clamping, all three rounding tiers, the exactly-1,000 case, and halfway-up
  ties.
- Unit-test ranking immediately below, exactly at, and immediately above every
  boundary, including collapsed thresholds.
- Unit-test monster and encounter totals and invalid-row exclusion.
- Test DOM interactions for changing player count and shared level; adding and
  removing monster rows; live recalculation; validation; and safe statblock
  links.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.
- Verify the production artifact contains the landing page, Fantasy Calendar,
  and the calculator with isolated assets and valid relative paths.
- Validate behavior through automated logic and DOM tests plus build-output
  inspection. Do not use a browser or browser automation to validate or refine
  this tool's UI.
- If visual correction is needed, use screenshots supplied by the user as the
  source of feedback; do not independently capture browser screenshots.

## Risks and Implementation Notes

- Ranking thresholds can overlap after extreme negative flat modifiers. The
  specified highest-rank-first evaluation order must be centralized and
  covered by tests.
- Floating-point percentage math can create boundary drift. Keep calculations
  numeric, apply the specified threshold rounding once, and test fractional
  modifier results.
- Repeated monster controls need stable internal identifiers; array position
  alone can cause edits or labels to target the wrong row after removal.
- Root build/test/lint globs are currently enumerated. Adding the tool requires
  updating each relevant integration point without broad build refactoring.
