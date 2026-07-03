# Roadmap

This file is the intake queue for follow-up work that may become a focused
spec. Add a short kebab-case slug and enough context for a future `spec-create`
run to recover the intended boundary. Remove an entry after its implemented
spec is archived or when the work is intentionally dropped.

## Toolkit Landing Page

The following items apply to the landing page in `app/`.

### `app-preact-migration`

Status: planned

Convert the landing page UI to Preact while preserving its existing behavior,
styles, and static-page delivery. Keep the production bundle lightweight and
avoid adding application infrastructure that the page does not need.

## Fantasy Calendar

The following items apply to the `fantasy-calendar/` tool.

### `fantasy-calendar-preact-migration`

Status: planned

Convert Fantasy Calendar's imperative rendering layer to Preact while keeping
calendar, moon, and URL logic framework-independent. Preserve existing
behavior and styles, and keep the production page and script small.

## Encounter Difficulty Calculator

The following items apply to the `encounter-difficulty-calculator/` tool.

### `encounter-calculator-preact-migration`

Status: planned

Convert the party and encounter UI layers to Preact while retaining the pure
calculator modules and existing styles. Use a small client-side component tree
without routing or additional state-management dependencies, and preserve the
calculator's lightweight static output.

### `encounter-builder-keyboard-support`

Status: planned

Add complete keyboard workflows for creating, editing, navigating, and removing
monsters and statblock links without requiring pointer input.

### `encounter-storage-import-export`

Status: planned

Store encounters locally and support portable import and export for backup,
sharing, and restoration.

### `encounter-list-enhancements`

Status: planned

Let users reorder and duplicate encounters, and color-code each encounter by
its calculated difficulty so multiple encounters are easier to organize and
compare.

### `monster-cr-mode-support`

Status: planned

Allow monsters to be added by Challenge Rating instead of by XP value, with
automatic CR-to-XP conversion, so that users can build encounters directly
from stat blocks.

### `encounter-generation`

Status: planned

Automatically suggest or generate a balanced encounter for a given party
composition and target difficulty, selecting appropriate monsters and
quantities without manual entry.

### `monster-library`

Status: planned

Provide a searchable, filterable library of monsters (by name, CR, type, etc.)
that users can browse and add directly to an encounter from within the
calculator.
