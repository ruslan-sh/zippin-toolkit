# Tasks For Encounter Workspace Storage and YAML Backup

## Dev Task 1: Establish a versioned workspace state boundary

Status: done

Summary: Create a tested, serializable workspace model and adapt the existing
party and encounter UI boundaries so callers can initialize them from state and
observe complete state changes while preserving current behavior.

Scope:

- Define the versioned workspace, party-group, encounter, and monster source
  data types using raw editable strings where the UI can hold unfinished input.
- Define the current default workspace independently of generated markup and
  transient DOM identifiers.
- Add strict structural validation for stored workspace data, including schema
  version and safe HTTP(S) statblock URLs, while allowing UI-invalid editable
  field strings.
- Refactor the party and encounter initialization APIs only as needed to hydrate
  arbitrary valid workspace state and publish complete state changes.
- Preserve current calculations, validation, accessible labels, focus behavior,
  and default user experience.
- Add unit and UI coverage for default hydration, arbitrary hydration, ordered
  state snapshots, invalid editable values, and all existing interactions.

Dependencies:

- Enables: Task 2
- Depends on: none
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test schema acceptance and rejection, defaults, raw-value preservation,
  ordering, unsupported versions, and unsafe URLs.
- UI-test hydration and state publication for party edits, modifier changes,
  encounter changes, monster changes, renames, and statblock changes.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

Definition of done:

- One framework-independent workspace shape can faithfully initialize and read
  the complete calculator state.
- Existing calculator behavior remains working, with tests covering the new
  state boundary.
- The repository passes the required build, tests, and lint checks.

## Task 2: Restore the complete workspace after refresh

Status: done

Summary: Use the workspace boundary from Dev Task 1 to autosave every edit,
restore on startup, and handle corrupt or unavailable storage without losing
calculator usability.

Scope:

- Add a small storage adapter around one namespaced local-storage key.
- Restore a structurally valid supported workspace before initializing the UI.
- Autosave the complete state after all state-change notifications, including
  structural and statblock changes.
- Persist party groups, modifier values, encounters, monster rows, encounter and
  row order, names, and statblock URLs while deriving calculations, validation
  presentation, transient identifiers, and focus after restoration.
- Preserve incomplete and invalid raw field values exactly enough to resume
  editing after refresh.
- Preserve corrupt or unsupported stored values while falling back to defaults.
- Provide an accessible status region and deduplicated messages for restore and
  save failures.
- Document the persisted workspace shape and restoration behavior in the
  calculator behavior documentation.
- Test storage absence, read exceptions, write exceptions, quota failure,
  malformed content, unsupported versions, and successful refresh restoration.

Dependencies:

- Depends on: Dev Task 1
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test the storage adapter and startup selection behavior with fake storage
  implementations.
- UI-test autosave triggers and restored calculations and validation states.
- Manually edit every supported value, add and remove groups, encounters, and
  monsters, refresh, and confirm values, order, calculations, validation
  states, and accessible non-repeating failure messaging.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

Definition of done:

- The complete state boundary is stored and restored end to end.
- Storage failures cannot prevent normal in-memory calculator use or overwrite
  the unreadable value during startup fallback.
- A user can close or refresh the page and continue from the same complete
  editable workspace, including unfinished fields.
- The repository passes the required build, tests, and lint checks.

## Task 3: Download a human-editable YAML workspace backup

Status: done

Summary: Users can download the complete workspace currently visible in the
calculator as a stable, versioned YAML file, including unfinished edits even
when browser storage could not save them.

Scope:

- Add a maintained YAML library as the only new dependency needed by this
  feature.
- Define a stable, documented YAML representation of the versioned workspace
  model established in Dev Task 1.
- Serialize arbitrary user text, Unicode, ordered groups, encounters, and
  monsters safely and readably without derived results or transient UI state.
- Add a keyboard-operable Export control that serializes current in-memory
  state and downloads a `.yml` file.
- Show an accessible error if serialization or download setup fails without
  changing the workspace.
- Document the export filename, schema keys, schema version, and examples
  needed for safe manual editing.

Dependencies:

- Depends on: Task 2
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test deterministic YAML serialization and round trips containing empty
  fields, multiline strings, YAML-significant characters, and Unicode.
- Verify exported content preserves source state and omits calculated values,
  DOM identifiers, validation presentation, and focus.
- UI-test export from both normally persisted state and an in-memory state
  whose storage write failed.
- Manually download and inspect a `.yml` backup using keyboard controls.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

Definition of done:

- A user can download a readable YAML representation of exactly the editable
  workspace currently on screen.
- The YAML format is versioned, documented, and protected by round-trip tests.
- The repository passes the required build, tests, and lint checks.

## Task 4: Use typed workspace numeric values

Status: done

Summary: Store, restore, and export calculator numeric controls as finite
numbers or `null` without changing calculator results or validation rules.

Scope:

- Change player count, level, modifier value, monster XP, and quantity in the
  workspace state boundary from raw strings to finite numbers or `null`.
- Convert native numeric controls to typed state at the UI boundary: empty or
  unexpectedly nonnumeric values become `null`, while out-of-range numbers stay
  numeric so existing validation can report them.
- Render `null` as an empty numeric input and render finite numbers using their
  normal string representation.
- Retain schema version 1 and the existing local-storage key.
- Export version-1 YAML using unquoted YAML numbers and `null` for numeric
  controls, while retaining strings for names, modifier type, and URLs.
- Update workspace and YAML documentation to describe the typed version-1
  contract.

Dependencies:

- Depends on: Task 3
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test strict version-1 state validation for finite numbers, nulls, wrong
  scalar types, non-finite values, unsafe URLs, and unknown structure.
- Unit-test version-1 storage load/save, corrupt storage preservation, write
  failure, and unsupported versions.
- Unit-test deterministic YAML output containing unquoted numbers and `null`,
  plus arbitrary text, Unicode, ordered collections, and omitted derived state.
- UI-test typed state publication and hydration, restored calculations and
  validation, export after normal saves, and export after storage failure.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

Definition of done:

- The in-memory workspace, local-storage snapshot, and YAML export all use the
  version-1 numeric-or-null contract.
- Calculations, validation, ordering, accessible status behavior, and all
  nonnumeric source fields continue to work as before.
- The repository passes the required build, tests, and lint checks.

## Task 5: Replace the workspace from a validated YAML backup

Status: done

Summary: Users can select a YAML backup, validate it completely, review an
explicit data-loss warning, and replace the current workspace atomically; any
cancelation or failure leaves current visible and stored state unchanged.

Scope:

- Add a keyboard-operable Import control accepting `.yml` and `.yaml` files.
- Parse YAML safely without custom type construction and reject malformed
  documents, unsupported schema versions, missing or unknown structure,
  structurally invalid values, and unsafe statblock URLs.
- Accept finite numeric values and `null` for numeric controls so empty and
  out-of-range imported work is revalidated in the UI.
- Validate the entire candidate before displaying a clear warning that import
  will permanently replace the current browser workspace.
- On explicit confirmation, replace the visible workspace, recalculate derived
  output, render existing validation states, and persist the imported state.
- Treat parsing, validation, confirmation, rendering, and persistence as a
  transaction: cancellation or failure must preserve both current UI and the
  previous stored snapshot.
- Announce concise success and actionable error messages accessibly without
  exposing stack traces.

Dependencies:

- Depends on: Task 4
- Parallelizable: no
- Parallel with: none

Validation:

- Unit-test safe parsing and whole-document validation for valid backups,
  malformed YAML, unsupported versions, unknown or missing keys, wrong types,
  unsafe URLs, null and out-of-range numeric values, and YAML custom types.
- UI-test successful confirmed replacement, canceled confirmation, file-read
  failure, parse failure, validation failure, rendering failure, and storage
  failure.
- Assert every canceled or failed path preserves both the visible state and
  prior local-storage value byte for byte.
- Verify a successful import recalculates results, shows validation states,
  autosaves, and restores identically after refresh.
- Manually import `.yml` and `.yaml` files using keyboard-only controls and
  verify warning and status announcements.
- Run `npm run build`, `npm test`, `npm run lint`, and `npm run lint:styles`.

Definition of done:

- A user can restore a complete supported YAML backup only after confirming
  replacement of the current workspace.
- Invalid, unsupported, canceled, or failed imports cause no visible or stored
  partial mutation.
- Successful imports round-trip unfinished values, recalculate derived output,
  and become the next refresh-restored state.
- The repository passes the required build, tests, and lint checks.
