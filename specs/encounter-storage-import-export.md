# Encounter Workspace Storage and YAML Backup

## Summary

Persist the Encounter Difficulty Calculator's complete editable workspace in
browser local storage and restore it on later visits. Let users export and
import that same workspace as a versioned, human-readable YAML file for backup,
sharing, and manual editing.

The workspace is a single state snapshot, not a collection of named saves.

## Goals

- Automatically save and restore all user-editable calculator state:
  - party groups, including the text currently present in count and level
    fields;
  - party modifier type and value;
  - encounters in display order, including their names;
  - monster rows in display order, including name, XP, quantity, and optional
    statblock URL.
- Preserve incomplete and validation-error states exactly enough that a user
  can refresh and continue editing without losing work.
- Export the complete workspace as a versioned YAML document.
- Import a complete YAML workspace only after validating the entire document
  and warning that the current workspace will be replaced.
- Keep imported and restored state subject to the calculator's existing input
  validation and safe-URL behavior.

## Non-goals

- Named saves, multiple local workspaces, or a saved-encounter library.
- Merging imported data with the current workspace.
- Synchronization between browsers or devices.
- Cloud storage, accounts, or shareable server-hosted links.
- Markdown export; that is tracked as a separate roadmap follow-up.
- Changing encounter calculations or existing validation rules.

## Current behavior

The calculator initializes one default party group and one default encounter.
All party, modifier, encounter, monster, and statblock state lives in the DOM
and transient closures. Refreshing the page resets it, and there are no import
or export controls.

## Proposed behavior

### Workspace model and autosave

Define one serializable workspace model that is independent of generated DOM
identifiers and calculated output. Calculated thresholds, encounter XP totals,
difficulty ranks, validation messages, and focus state must not be persisted;
they are derived again after restoration.

Store raw editable field values where needed rather than only parsed numbers.
For example, an empty XP field or an invalid party level must survive a refresh
and render with the existing validation error. Preserve encounter and row order.

After every user action that changes persisted data, write the complete
workspace to one namespaced, versioned local-storage entry. This includes text
input, select changes, additions, removals, renames, and statblock URL changes.
On startup:

1. Read and validate the stored workspace.
2. Restore it and run the existing calculations and validation when it is
   valid.
3. Use the existing default workspace when no saved state exists.
4. If saved data cannot be read or has an unsupported or malformed structure,
   leave it untouched for possible recovery, load the default workspace, and
   show a non-blocking, accessible message explaining that saved data could not
   be restored.

Storage unavailability or quota errors must not prevent the calculator from
working. Report that changes could not be saved without repeatedly interrupting
the user.

### YAML export

Provide an Export control that downloads the current complete workspace as a
`.yml` file. Export the current in-memory state, including unsaved-to-storage
changes if a storage write has failed.

The YAML document must:

- contain an explicit schema version;
- use stable, descriptive keys and preserve list order;
- contain only workspace source data, not derived results or DOM identifiers;
- safely quote or encode arbitrary user-entered text; and
- be readable and reasonably convenient to edit by hand.

Use a maintained YAML library for serialization and safe parsing. The exported
shape and version are part of the feature's compatibility contract and must be
documented alongside the calculator behavior.

### YAML import

Provide an Import control that accepts a `.yml` or `.yaml` file. Parse YAML in
safe mode without constructing custom types, then validate the complete
document before asking to replace anything.

Validation must reject the entire import when the YAML is malformed, the schema
version is unsupported, required collections or fields are missing, field types
are structurally invalid, an unsafe statblock URL is present, or any unrecognized
structure would make restoration ambiguous. Editable values that the UI itself
can temporarily hold, such as empty or out-of-range numeric-field strings, are
valid workspace source data and must import successfully so exported unfinished
work remains round-trippable. Existing UI validation must flag those values
after restoration.

If validation succeeds, warn clearly that importing will permanently replace
the current browser workspace. Only after explicit confirmation:

1. replace the visible workspace as one operation;
2. recalculate all derived output and display existing validation states; and
3. persist the imported workspace as the new autosaved state.

Canceling the warning or encountering any read, parse, validation, rendering,
or storage error must leave both the current visible workspace and its stored
snapshot unchanged. Show a concise, accessible success or error message after
the operation; error messages should identify the problem without exposing a
stack trace.

## Acceptance criteria

- Refreshing restores every supported editable field and the order of all
  groups, encounters, and monsters.
- Empty and otherwise invalid field text is restored and revalidated rather
  than discarded or normalized.
- Every supported edit triggers autosave, including renames and structural
  additions or removals.
- A missing saved workspace starts with the current defaults.
- Corrupt saved data and unavailable local storage do not make the calculator
  unusable and are communicated accessibly.
- Exported YAML has an explicit version and round-trips the complete workspace
  without data loss.
- Export does not include calculated thresholds, totals, ranks, transient IDs,
  focus, or validation presentation.
- Import accepts both `.yml` and `.yaml`, fully validates before mutation, and
  rejects unsupported versions, unsafe URLs, malformed YAML, and invalid
  structures as a whole.
- A valid import does not mutate anything until the user confirms the explicit
  replacement warning.
- A canceled or failed import preserves both current UI state and local-storage
  state.
- A confirmed valid import replaces the workspace, recalculates results, and
  becomes the state restored on the next refresh.
- Import/export controls and status messages are keyboard-operable and have
  accessible names and announcements.

## Validation plan

- Unit-test workspace schema validation, serialization, deserialization, schema
  version handling, unsafe URL rejection, and round trips containing special
  YAML characters and Unicode.
- Unit-test autosave and restore for valid, incomplete, and UI-invalid field
  states, as well as corrupt storage, unavailable storage, and write failures.
- UI-test successful export, valid confirmed import, canceled replacement,
  malformed and partially invalid imports, unsupported versions, and the
  guarantee that failed imports do not mutate current or stored state.
- Verify restored and imported workspaces recalculate party thresholds,
  encounter totals, ranks, and validation messages using existing logic.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles` for
  the implementation.

## Implementation constraints and risks

- Keep persistence and YAML conversion separate from DOM rendering so the
  workspace schema can be tested without browser UI setup.
- Add only the YAML dependency needed for standards-compliant safe parsing and
  serialization; do not introduce broader storage or state-management
  infrastructure.
- Treat import as a transaction. Construct and validate a candidate state
  before replacing live or stored state so a failure cannot cause partial data
  loss.
- Local-storage capacity is limited. The implementation must handle quota
  failure, though normal calculator workspaces are expected to fit comfortably.
- Future schema changes must increment the version and either provide an
  explicit migration or reject the unsupported version without data loss.
