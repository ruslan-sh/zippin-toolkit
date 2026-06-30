# Tasks For Encounter Difficulty Calculator

The task graph was reordered so every task delivers a user-testable vertical
slice, beginning with landing-page and production-route integration. All
existing tasks were `todo`, so no in-progress or completed work was displaced.

## Task 1: Add the navigable calculator page
Status: todo
Summary: Create the new tool as a minimal standalone page, integrate it into the shared production build, and link it from the landing page so it can be opened and tested immediately.
Scope:
- Create the self-contained `encounter-difficulty-calculator/` project with a semantic HTML template, TypeScript entry point, minimal SCSS, and scoped documentation as appropriate.
- Add the calculator entry and HTML generation to webpack with isolated output under `dist/encounter-difficulty-calculator/`.
- Include the new source in shared TypeScript, lint, and stylelint configuration without broad build refactoring.
- Add an accessible calculator link or card to the toolkit landing page without changing Fantasy Calendar behavior or routing.
- Render a clear page heading and short description as the initial usable page; do not add speculative calculator controls or decorative styling.
- Ensure asset and navigation paths work beneath the GitHub Pages repository base path.
Dependencies:
- Depends on: none
- Parallelizable: no
- Parallel with: none
Validation:
- Run `npm run build`, `npm run lint`, and `npm run lint:styles`.
- Inspect generated output and references to confirm the landing page links to the nested calculator route and its assets are isolated.
- Do not use a browser or browser automation; visual feedback will come from user-supplied screenshots.
Definition of done:
- The landing page exposes an accessible link to the new tool.
- Direct navigation to `encounter-difficulty-calculator/` produces a valid standalone page in the production artifact.
- Fantasy Calendar remains present and unchanged in behavior.
- Generated `dist/` output is inspected but not manually edited or committed.

## Task 2: Add the party difficulty calculator
Status: todo
Summary: Turn the standalone page into a useful party calculator that accepts player count, shared level, and one modifier and immediately displays correct Low, Moderate, and High XP thresholds.
Scope:
- Add labeled controls for positive-integer player count and one shared level from 1 through 20.
- Encode the supplied 20-level XP table in a typed, side-effect-free calculation module.
- Calculate base party thresholds and apply one selected percentage or flat-XP modifier, including signed values, zero clamping, tiered rounding, and halfway-up behavior.
- Display locale-formatted Low, Moderate, and High XP values and update them immediately without submission or reload.
- Add field-specific validation that distinguishes incomplete or invalid party input from valid thresholds adjusted to zero.
- Keep markup and SCSS limited to accessible controls, readable results, focus visibility, and narrow-screen usability.
- Add unit tests for all table rows, representative party sizes, modifier formulas, clamping, rounding tiers, exactly 1,000 XP, and halfway ties.
- Add DOM tests for player count, level, modifier switching, live recalculation, formatted output, and validation.
- Extend the shared test command and configuration to include the calculator tests.
Dependencies:
- Depends on: Task 1
- Parallelizable: no
- Parallel with: none
Validation:
- Run `npm test`, `npm run lint`, `npm run lint:styles`, and `npm run build`.
- Confirm a four-player, level-5 party displays 2,000 Low, 3,000 Moderate, and 4,400 High XP before modification.
- Validate through automated logic and DOM tests plus build-output inspection only.
Definition of done:
- A user can calculate and modify all three party difficulty thresholds from the standalone page.
- Every party, modifier, clamping, and rounding rule in the spec has automated coverage.
- Refreshing resets the calculator because no persistence or URL state is introduced.
- Existing landing-page and Fantasy Calendar behavior remains intact.

## Task 3: Add the encounter builder and live ranking
Status: todo
Summary: Complete the tool with one encounter containing multiple monsters, live XP totals, safe statblock links, and automatic Trivial-to-Deadly ranking against the party thresholds.
Scope:
- Add one permanent encounter editor with controls to add and remove multiple monster rows using stable internal identifiers.
- Add labeled name, quantity, XP-per-unit, and optional statblock URL fields for each monster.
- Validate required fields, positive-integer quantity, non-negative-integer XP, and optional safe external URLs; invalid or incomplete rows must not contribute partial XP.
- Calculate each complete monster total and the summed encounter XP immediately as monster or party inputs change.
- Implement centralized highest-rank-first classification for Trivial, Low, Moderate, High, and Deadly using the exact inclusive and exclusive boundaries in the spec.
- Display the encounter total and textual rank, withholding the rank until party input is valid.
- Preserve other valid input when rows are added or removed, and give destructive actions unambiguous accessible names.
- Add unit tests for monster validation and totals, encounter sums, every rank boundary, floating-point-sensitive comparisons, and collapsed or overlapping thresholds.
- Add DOM tests for row lifecycle, live totals and ranking, validation feedback, preserved input, and safe statblock links.
- Review the finished HTML and SCSS and remove any class or declaration not required for behavior, accessibility, legibility, or minimal layout.
- Update concise project documentation to describe the completed tool where appropriate.
Dependencies:
- Depends on: Task 2
- Parallelizable: no
- Parallel with: none
Validation:
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.
- Inspect production output for the landing page, Fantasy Calendar, and calculator with valid relative paths and isolated assets.
- Run `git diff --check` and confirm `dist/` has no tracked or staged changes.
- Use automated logic and DOM tests plus build-output inspection only; reserve visual correction for screenshots supplied by the user.
Definition of done:
- A user can build one multi-monster encounter and see its correct total and rank update immediately.
- Invalid rows, exact rank boundaries, extreme modifiers, and safe links behave as specified and have automated coverage.
- All acceptance criteria in the spec are implemented and verified without adding persistence, external monster data, encounter multipliers, or multiple encounters.
- All repository checks pass, or any check that cannot run is documented with its exact cause.
