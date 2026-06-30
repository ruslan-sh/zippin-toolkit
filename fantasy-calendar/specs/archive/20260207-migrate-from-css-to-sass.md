# Migrate CSS to Sass

## Summary
Migrate `src/css/index.css` to Sass in a single PR, split styles into maintainable modules, enforce BEM naming conventions, centralize reusable variables, and perform style cleanup without changing intended UI behavior.

## Goals
- Replace the current CSS entry with a Sass entry point.
- Split monolithic styles into industry-standard Sass modules/partials.
- Enforce BEM class naming for maintainability and consistency.
- Introduce centralized reusable design variables.
- Keep webpack output behavior effectively unchanged (single built stylesheet output from app entry).
- Keep compatibility for modern browsers (Chrome, Firefox, Safari, modern Edge).
- Include a validation checklist for manual visual QA.

## Non-Goals
- No redesign or feature-level UI changes.
- No migration to CSS-in-JS or alternative styling systems.
- No multi-phase rollout; complete migration in one PR.

## Scope
### In scope
- `src/css/index.css` migration to `.scss`.
- Creation of Sass partials/modules and import structure.
- BEM renaming where needed, with corresponding selector updates.
- Cleanup of redundant/dead/conflicting style rules discovered during migration.
- Build/lint adjustments required specifically to support Sass and lint it.

### Out of scope
- Unrelated JavaScript/TypeScript refactors.
- Webpack config changes not required for Sass compilation.
- Hand-editing `dist/` outputs.

## Proposed Structure
Use a standard Sass folder layout under `src/scss/`:
- `src/scss/index.scss` (entry point)
- `src/scss/abstracts/_variables.scss` (color, spacing, typography, sizing, z-index tokens as needed)
- `src/scss/base/_reset.scss` and/or `src/scss/base/_base.scss`
- `src/scss/layout/_<layout-block>.scss`
- `src/scss/components/_<component-block>.scss`
- `src/scss/utilities/_helpers.scss` (only if needed)

Notes:
- Keep structure pragmatic; do not create empty or unnecessary partials.
- Use Sass modules/import pattern consistent with current toolchain support.

## BEM Enforcement
- All component selectors should follow BEM:
  - Block: `.calendar`
  - Element: `.calendar__header`
  - Modifier: `.calendar--compact`, `.calendar__day--selected`
- Avoid deep descendant selector chains when a BEM element/modifier class can express intent.
- During migration, update any class references in rendering code only as needed to match renamed selectors.

## Variables and Reuse
- Move repeated literal values (colors, spacing, radii, font sizes, shadows, transitions) into centralized variables.
- Prefer semantic variable names (for example, role-based rather than raw-color names when sensible).
- Keep variable set minimal and directly justified by actual reuse.

## Cleanup Rules
- Remove duplicate declarations and unreachable selectors.
- Consolidate repeated rule groups where readability is preserved.
- Do not change computed behavior intentionally; cleanup should be behavior-preserving.

## Build and Tooling Requirements
- `npm run build` must pass after migration.
- Relevant lint checks must pass for touched styling files (Sass-aware linting configuration if needed).
- Keep bundling behavior stable from consumer perspective (no intentional runtime style-loading changes).

## Acceptance Criteria
- Sass entry replaces CSS entry in source structure.
- Styles are split into clear modules/partials under an industry-standard layout.
- BEM naming is consistently applied to migrated selectors.
- Reusable variables are centralized and referenced across modules.
- Redundant/dead/conflicting CSS from legacy file is removed.
- Build passes and relevant lint checks pass.
- Manual visual verification checklist is completed by reviewer.

## Validation Checklist (Manual + Automated)
- [ ] Project builds successfully with `npm run build`.
- [ ] Lint checks for touched JS/TS/CSS/SCSS files pass.
- [ ] App loads with expected styling in Chrome (latest stable).
- [ ] App loads with expected styling in Firefox (latest stable).
- [ ] App loads with expected styling in Safari (latest stable).
- [ ] Core calendar interactions visually match expected behavior (navigation, day grid, selected/active states, controls, and key text styles).
- [ ] No obvious layout breakage at common viewport sizes (mobile and desktop).
- [ ] No legacy `index.css` dependency remains in active source imports.

## Risks and Mitigations
- Risk: BEM renames may break style hooks in rendered markup.
  - Mitigation: Audit class usage in rendering code and verify key UI states manually.
- Risk: Cleanup may unintentionally alter specificity/cascade.
  - Mitigation: Make incremental, reviewable changes and validate all core screens/states.
- Risk: Browser differences in modern feature handling.
  - Mitigation: Validate on latest stable Chrome/Firefox/Safari before merge.

## Delivery Plan
Single PR containing:
- Sass migration and module split.
- Required class name updates for BEM consistency.
- Required build/lint configuration updates.
- Validation evidence (build/lint success + checklist completion notes).
