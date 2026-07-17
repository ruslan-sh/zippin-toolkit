# Tasks For Monster Challenge Rating and Minion Support

Plan update: The former combined Task 3 is now a CR-only slice followed by a separate Minion slice. Documentation moved to Task 5; all existing statuses remain `todo`.

## Dev Task 1: Add the canonical standard CR-to-XP domain model
Status: done
Summary: Introduce one pure, typed source of truth for supported Challenge Ratings and their standard XP mapping so validation and the initial CR workflow can share the same rules.
Scope:
- Add a calculator module that exposes the blank-independent canonical CR values (`0`, the fractional CRs, and whole numbers through `30`).
- Implement standard XP lookup without adding CR semantics to `MonsterInput`, encounter totals, or difficulty ranking.
- Cover every supported CR in the standard table, including CR 0 = 10 XP.
- Cover blank and unsupported CR inputs as having no mapping.
Dependencies:
- Depends on: none
- Enables: Dev Task 2 and Task 3
- Parallelizable: no
- Parallel with: none
Validation:
- Run the focused calculator tests for the canonical CR values, standard mapping, and missing mappings.
- Run `npm test`.
- Run `npm run lint`.
Definition of done:
- The repository has one tested canonical CR value list and lookup boundary that later schema and UI work can consume.
- Existing XP-based monster validation, totals, and ranking behavior remain unchanged.

## Dev Task 2: Add strict version-2 workspace compatibility
Status: todo
Summary: Upgrade persisted and exported monster state to carry CR and Minion fields while explicitly migrating version-1 browser and YAML workspaces without changing their saved XP.
Scope:
- Change the source workspace contract to version 2 and add `cr` and `minion` to every `MonsterState`, including default and in-progress rows.
- Validate version-2 workspaces strictly: CR must be `null` or canonical, Minion must be boolean, field sets must remain exact, and existing numeric, URL, and structural checks must remain intact.
- Add an explicit version-1 compatibility path for browser storage and YAML import that supplies `cr: null` and `minion: false`, preserves XP and all other source fields, and produces version 2 for subsequent saves and exports.
- Preserve the existing import replacement and storage recovery guarantees when reading, migration, rendering, or saving fails; leave invalid saved data recoverable as today.
- Update state, storage, YAML, and persisted-workspace tests for version-2 round trips, version-1 migration, rejected CR/Minion shapes, unknown fields, and failure transactions.
Dependencies:
- Depends on: Dev Task 1
- Enables: Task 3 and Task 4
- Parallelizable: no
- Parallel with: none
Validation:
- Run the focused workspace state, storage, YAML, import, and persisted-workspace tests.
- Run `npm test`.
- Run `npm run lint`.
- Run `npm run build`.
Definition of done:
- Existing version-1 browser and YAML workspaces load as version 2 with XP unchanged, blank CR, and Minion off.
- New storage saves and YAML exports round-trip the complete strict version-2 monster shape.
- Invalid version-2 data cannot partially replace the visible or stored workspace.

## Task 3: Build encounters with standard CR controls
Status: todo
Summary: Let users choose a monster CR to calculate standard XP and still edit that XP directly while all totals and difficulty ranks continue to use the current XP value.
Scope:
- Add a blank-capable Challenge Rating control to every new and restored monster row, with encounter-specific accessible labels and usable responsive styling.
- Start new rows with blank CR, blank XP, quantity 1, and the version-2 Minion source field off; render imported or restored CR and XP exactly.
- On CR selection or change, immediately replace XP from the standard table without confirmation or warning.
- Keep direct XP edits authoritative without clearing CR, and leave XP unchanged when CR is cleared.
- Include CR in row state, state replacement, autosave snapshots, and YAML-backed import rendering without persisting derived UI state.
- Preserve the version-2 Minion source value through restored, replaced, and autosaved row state without exposing or applying Minion behavior before Task 4.
- Keep XP and quantity as the only monster-completeness inputs, retain statblock behavior, and confirm manual XP overrides still drive encounter totals and ranks.
- Extend the fake DOM test harness only as needed for the CR control, then cover initial values, restored values, standard mapping changes, direct overrides, clearing CR, accessible labels after encounter rename, and autosave state.
Dependencies:
- Depends on: Dev Task 1 and Dev Task 2
- Parallelizable: no
- Parallel with: none
Validation:
- Run the focused encounter calculator, encounter UI, and persisted-workspace UI tests.
- Run `npm test`.
- Run `npm run lint`.
- Run `npm run lint:styles`.
- Run `npm run build`.
Definition of done:
- A user can choose any supported standard CR in every encounter row and override the calculated XP without warnings or hidden state changes.
- Blank CR remains optional, clearing it preserves XP, and existing XP-based validation, totals, ranks, statblock links, and encounter interactions have no regressions.
- CR edits survive autosave, refresh, export, and import through the version-2 workspace contract, and the not-yet-exposed Minion source value is not lost.

## Task 4: Add Minion XP mode to monster rows
Status: todo
Summary: Let users mark a monster as a Minion so its selected CR uses the MCDM Minion XP table while preserving the direct-XP override workflow.
Scope:
- Add the Minion XP mapping to the pure CR calculator module and cover every supported CR, including Minion CR 0 = 2 XP.
- Add an encounter-specific, accessibly labelled Minion checkbox or equivalent boolean control to every new and restored monster row, off by default for new and migrated rows.
- When Minion changes and CR is present, immediately replace XP from the selected CR's standard or Minion mapping; when CR is blank, leave XP unchanged.
- Make later CR changes use the currently selected standard or Minion mapping.
- Keep direct XP edits authoritative without altering CR or Minion and without showing mismatch warnings.
- Render, replace, autosave, export, and import Minion state through the version-2 workspace contract.
- Cover restored values, both mapping directions, blank-CR toggles, manual overrides, CR changes while Minion is on, accessible labels after encounter rename, and autosave snapshots.
Dependencies:
- Depends on: Task 3
- Parallelizable: no
- Parallel with: none
Validation:
- Run the focused CR calculator, encounter UI, and persisted-workspace UI tests.
- Run `npm test`.
- Run `npm run lint`.
- Run `npm run lint:styles`.
- Run `npm run build`.
Definition of done:
- Every monster row exposes Minion state and switches between the complete standard and Minion XP mappings when CR is present.
- Toggling Minion with blank CR preserves XP, direct overrides remain valid, and Minion state survives autosave, refresh, export, and import.

## Task 5: Document CR, Minion, and workspace version 2
Status: todo
Summary: Update the calculator documentation so users can understand calculated XP, manual overrides, persistence compatibility, and the source of both mappings.
Scope:
- Document the CR and Minion controls, supported values, new-row defaults, immediate recalculation rules, direct XP overrides, and CR-clearing behavior.
- Explain that validation, totals, and ranks remain XP-based and that CR and Minion do not introduce encounter or party-size multipliers.
- Document the version-2 JSON/YAML monster fields and strict types, plus version-1 browser-storage and YAML migration behavior.
- Identify the standard mapping as following D&D 5.5 rules and attribute the Minion mapping to MCDM's *Flee, Mortals!*.
- Update implementation notes and examples so they match the shipped module and schema names.
Dependencies:
- Depends on: Task 3 and Task 4
- Parallelizable: no
- Parallel with: none
Validation:
- Review `encounter-difficulty-calculator/docs/calculator.md` against the spec and version-2 schema for all required behaviors and attributions.
- Run `npm run build`.
Definition of done:
- The calculator documentation accurately describes the complete CR/Minion workflow, unchanged XP calculation boundary, version-2 contract, version-1 migration, and mapping sources.
