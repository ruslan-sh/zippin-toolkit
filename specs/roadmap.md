# Roadmap

This file is the intake queue for follow-up work that may become a focused
spec. Add a short kebab-case slug and enough context for a future `spec-create`
run to recover the intended boundary. Remove an entry after its implemented
spec is archived or when the work is intentionally dropped. Every entry must
include `Status` and `Prerequisite`; use `Prerequisite: none` when it is
unblocked. Archiving a prerequisite removes its slug from dependent entries.

## Application-wide

The following items apply across the Toolkit landing page and tools.

### `migrate-agentic-flow-to-open-spec`

Status: planned
Prerequisite: none

Migrate the repository's agentic specification workflow to `open-spec`,
including the contributor instructions, agent configuration, and supporting
skills that guide spec creation, planning, implementation, validation, and
finalization.

### `standardize-ui-library`

Status: planned
Prerequisite: `app-preact-migration`, `fantasy-calendar-preact-migration`, and
`encounter-calculator-preact-migration`

Select and adopt a shared UI library, including common components and theme
tokens, so the landing page and tools use a consistent presentation layer.

### `dark-mode`

Status: planned
Prerequisite: `standardize-ui-library`

Add a consistent dark color theme across the Toolkit landing page and tools.

## Toolkit Landing Page

The following items apply to the landing page in `app/`.

### `app-preact-migration`

Status: planned
Prerequisite: none

Convert the landing page UI to Preact while preserving its existing behavior,
styles, and static-page delivery. Keep the production bundle lightweight and
avoid adding application infrastructure that the page does not need.

## Fantasy Calendar

The following items apply to the `fantasy-calendar/` tool.

### `fantasy-calendar-preact-migration`

Status: planned
Prerequisite: none

Convert Fantasy Calendar's imperative rendering layer to Preact while keeping
calendar, moon, and URL logic framework-independent. Preserve existing
behavior and styles, and keep the production page and script small.

### `astronomical-events`

Status: planned
Prerequisite: none

Add astronomical events to the calendar model and rendered calendar.

### `render-configuration`

Status: planned
Prerequisite: none

Add rendering options, including controls to hide the current-day highlight
and calendar events.

### `foldable-footer`

Status: planned
Prerequisite: none

Allow the calendar footer to be collapsed and expanded.

### `calendar-properties`

Status: planned
Prerequisite: none

Expose calendar properties for users to inspect and configure.

### `local-configuration-storage`

Status: planned
Prerequisite: none

Persist Fantasy Calendar configuration in browser local storage and restore it
on later visits.

## Encounter Difficulty Calculator

The following items apply to the `encounter-difficulty-calculator/` tool.

### `encounter-calculator-preact-migration`

Status: planned
Prerequisite: none

Convert the party and encounter UI layers to Preact while retaining the pure
calculator modules and existing styles. Use a small client-side component tree
without routing or additional state-management dependencies, and preserve the
calculator's lightweight static output.

### `encounter-builder-keyboard-support`

Status: planned
Prerequisite: none

Add complete keyboard workflows for creating, editing, navigating, and removing
monsters and statblock links without requiring pointer input.

### `encounter-markdown-export`

Status: planned
Prerequisite: none

Export the current Encounter Difficulty Calculator workspace as readable
Markdown for use in campaign notes, documents, and other text-based tools.

### `encounter-list-enhancements`

Status: planned
Prerequisite: none

Let users reorder and duplicate encounters, and color-code each encounter by
its calculated difficulty so multiple encounters are easier to organize and
compare.

### `encounter-generation`

Status: planned
Prerequisite: none

Automatically suggest or generate a balanced encounter for a given party
composition and target difficulty, selecting appropriate monsters and
quantities without manual entry.

### `monster-library`

Status: planned
Prerequisite: none

Provide a searchable, filterable library of monsters (by name, CR, type, etc.)
that users can browse and add directly to an encounter from within the
calculator.
