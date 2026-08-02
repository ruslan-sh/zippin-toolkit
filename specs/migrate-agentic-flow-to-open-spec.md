# Migrate the Agentic Workflow to OpenSpec

## Summary

Replace the repository's custom `specs/*.md` and `*.tasks.md` delivery workflow
with repository-pinned OpenSpec. Convert the Markdown roadmap into a
machine-readable YAML intake queue, enforce its lifecycle through repository
scripts, and retain independent agentic review plus the full repository check
suite as a hard pre-archive gate.

OpenSpec becomes the source of truth for selected changes and current behavioral
specifications after this bootstrap migration is completed through the existing
legacy workflow. Planned work remains in `specs/roadmap.yml` until selected.

## Goals

- Use OpenSpec artifacts and its expanded Codex workflow for proposal,
  planning, implementation, verification, synchronization, and archival.
- Preserve the roadmap's lightweight backlog and prerequisite graph without
  creating OpenSpec changes for unselected work. Derive whether an item is in
  progress from the presence of its same-slug active OpenSpec change, and
  remove the item after archival.
- Make roadmap selection and archival executable, transactional repository
  operations rather than prompt-only conventions.
- Require an independent, read-only agent review and all repository checks
  before a change can be archived.
- Pin the OpenSpec version, workflow allowlist, generated Codex integration,
  and regeneration process so clean installs are reproducible.
- Mark the complete existing spec workflow as legacy, retain it long enough to
  plan, implement, validate, finalize, and archive this migration, and prevent
  it from being selected for new work afterward.

## Non-goals

- Do not implement any product roadmap item as part of this migration.
- Do not create OpenSpec changes for every planned roadmap entry.
- Do not reconstruct current-state OpenSpec specifications from historical
  legacy plans.
- Do not rewrite or relocate existing files in `specs/archive/`; they remain
  read-only historical documentation.
- Do not add pull-request CI in this migration.
- Do not add OpenSpec integration for Cursor, Claude Code, or other non-Codex
  agents in this migration.
- Do not remove the legacy `$spec-*` skills or custom spec-validator agent in
  this migration. Their removal is deferred until they have completed this
  bootstrap feature.
- Do not enable OpenSpec's `bulk-archive` or `onboard` workflows in this
  migration. Their multi-change and automatically selected change lifecycles
  require dedicated integration with repository receipts and roadmap policy.
- Do not automate cancelling or abandoning an active change. That remains an
  explicit, user-directed recovery procedure because returning work to the
  roadmap, dropping it, preserving artifacts, and reverting implementation are
  distinct destructive choices.
- Do not change application code, generated `dist/` output, or production
  behavior.

## Current behavior

The repository keeps deferred work in `specs/roadmap.md`, active plans in
`specs/<feature>.md`, implementation tracking in sibling `*.tasks.md` files,
and completed plans in `specs/archive/`. Five custom Codex skills implement
spec creation, planning, implementation, validation, and finalization. A
custom validator agent provides the pre-completion validation gate.

At the start of this migration there are no other active legacy specifications
or task trackers. This document is the only bootstrap specification, the
roadmap is the only other live planning document, and all prior specifications
are archived.

## Proposed behavior

### Repository-managed OpenSpec

- Add `@fission-ai/openspec` version `1.7.0` as an exact development dependency
  and commit the lockfile update.
- Declare Node.js `>=20.19.0` in `package.json`.
- Expose the pinned CLI as `npm run openspec -- <args>` so no global OpenSpec
  installation is required.
- Disable OpenSpec telemetry for every repository-managed invocation with
  `OPENSPEC_TELEMETRY=0` without changing contributors' global preferences.
- Initialize OpenSpec for Codex and commit its generated skills.
- Use skills-only delivery and a checked-in allowlist containing only these
  approved OpenSpec 1.7.0 workflows: `explore`, `propose`, `apply`, `verify`,
  and `archive`.
- Explicitly exclude `new`, `continue`, `update`, `ff`, `sync`, `bulk-archive`,
  and `onboard`; regeneration and contract checks fail if any appears as an
  exposed workflow.
- Treat the allowlist as exact. A future OpenSpec upgrade must not enable newly
  introduced workflows until they are reviewed and added deliberately.
- Lead contributor documentation with the generated Codex `$openspec-*` skill
  names. OPSX `/opsx:*` names may appear once as cross-tool equivalents but
  must not be presented as the primary Codex invocation syntax.

### Reproducible generated integration

Generated OpenSpec skills are disposable output and must never be hand-edited.
Repository-specific rules live in root `AGENTS.md`, `openspec/config.yaml`,
repository scripts, and tests.

Provide these commands:

- `npm run openspec:update` creates an isolated temporary `XDG_CONFIG_HOME`,
  writes the checked-in skills-only workflow selection there, runs the pinned
  `openspec update`, and discards the temporary configuration. It must not read
  or modify a contributor's personal OpenSpec profile.
- `npm run openspec:check` performs the same regeneration in a temporary
  project and byte-compares the result with the committed generated Codex
  integration without modifying the working tree.

OpenSpec project context may add artifact guidance, including required proposal
metadata. Because OpenSpec 1.7.0 treats operation guidance as advisory and does
not expose a verification-operation hook, root `AGENTS.md` is the mandatory
override that requires the generated verification and archive skills to use
the repository review, receipt, and lifecycle commands. Automated checks must
fail if that contract disappears.

### Canonical artifacts

- `openspec/specs/` describes current behavior established by completed
  OpenSpec changes.
- `openspec/changes/<slug>/` contains an active change's proposal, delta specs,
  design decisions when needed, implementation tasks, and verification record.
- `openspec/changes/archive/` contains immutable OpenSpec audit history.
- `specs/roadmap.yml` is the intake queue for work that has not been selected.
- `specs/roadmap-legacy.md` is a temporary, frozen compatibility copy used only
  by the legacy skills while they complete this bootstrap migration. It is not
  a second source of truth and is deleted during bootstrap finalization.
- `specs/archive/` remains the unchanged legacy archive and is not authoritative
  for new work.

The repository begins with no seeded `openspec/specs/` content. Historical
legacy documents are not assumed to match current behavior; future verified
archives build the current-state OpenSpec set incrementally.

Archived OpenSpec changes remain audit records and permanently reserve their
slugs. Slugs are globally unique across the live roadmap, active OpenSpec
changes, and OpenSpec archives. The legacy `specs/archive/` directory belongs
to the retired identity system and does not reserve OpenSpec slugs. Work that
is deliberately dropped before archival reserves no slug after both its
roadmap item and active change are removed.

### Machine-readable roadmap

Before creating `specs/roadmap.yml`, rename the complete current
`specs/roadmap.md` file to `specs/roadmap-legacy.md`. Convert that snapshot into
the YAML roadmap using this shape:

```yaml
version: 1

application-wide:
  description: Applies across the Toolkit landing page and tools.
  items:
    - slug: dark-mode
      prerequisites:
        - standardize-ui-library
      description: >-
        Add a consistent dark color theme across the Toolkit landing page
        and tools.
```

The initial top-level area keys are `application-wide`,
`toolkit-landing-page`, `fantasy-calendar`, and
`encounter-difficulty-calculator`. Future kebab-case area keys are allowed.
Every area requires only `description` and ordered `items`. Every item requires
only `slug`, `prerequisites`, and `description`; unknown area or item fields
are invalid.

Roadmap rules:

- `version` must be exactly `1`.
- Slugs are globally unique, kebab-case, human-readable canonical identifiers.
  Do not generate opaque IDs or require area prefixes. Reject a slug already
  present in the live roadmap, an active OpenSpec change, or an OpenSpec
  archive.
- A slug is immutable while it is present in the roadmap or an active change.
- An item without a same-slug active change is planned. An item with exactly
  one same-slug active change is in progress. Completion removes the item.
- `prerequisites` is always a YAML sequence. `[]` means unblocked; prerequisite
  values are canonical slugs.
- Every prerequisite must resolve to a live roadmap item. Self references,
  duplicates, missing references, and cycles are invalid.
- Every item with a same-slug active change must have `prerequisites: []`.
- A dependent may continue referencing an active prerequisite until that
  prerequisite archives.
- Lifecycle writes mutate the existing `yaml` document nodes and preserve area
  order, comments, and scalar styles. Semantic and formatting preservation is
  required, but byte-identical text for untouched entries is not.

Provide read-only `npm run roadmap:validate` to enforce the complete schema and
graph. Every lifecycle mutation validates the whole roadmap before changing
anything. Invalid unrelated entries block mutation because the roadmap is one
source of truth.

After conversion, only `specs/roadmap.yml` receives normal intake, selection,
or archive mutations. `specs/roadmap-legacy.md` remains frozen. Legacy skills
may read it only to confirm the bootstrap slug, its original unblocked state,
and its legacy status. They must not use it to discover or authorize other
work.

Provide canonical, non-interactive intake:

```text
npm run roadmap:add -- \
  --area <existing-area> \
  --slug <slug> \
  --description <text> \
  [--prerequisite <slug>]...
```

The command accepts only an existing area, validates before and after mutation,
uses the shared repository lifecycle lock, preserves the YAML document
structure, and rolls back on handled failure. It rejects duplicate or
historically reserved slugs and unknown, duplicate, self-referential, or cyclic
prerequisites. Creating a new area is a separate, deliberately reviewed schema
edit rather than an intake side effect.

### Change selection and intake

Provide transactional `npm run opsx:select -- <roadmap-slug>`.

Selection acquires the same repository lifecycle lock used by intake and
archival before validating or mutating state and releases it after a successful
selection or handled rollback. Concurrent intake, selection, and archive
commands fail while the lock is held.

Selection succeeds only when:

- exactly one live item matches the slug;
- it has `prerequisites: []` and no same-slug active change;
- no active or archived OpenSpec change has already reserved the slug; and
- the full roadmap and workflow state are valid.

The command creates the same-slug OpenSpec change; that active directory makes
the roadmap item in progress without a separate status mutation. It is strict
and non-idempotent: repeated calls, duplicate state, and partial drift fail
instead of silently reconciling. Handled failures inside the wrapper restore
its pre-command state. If the process terminates during creation, later
lifecycle commands detect the mixed state, fail closed, and direct the user to
the documented recovery procedure; automatic crash recovery is not required.
If a completed selection is followed by interrupted proposal authoring, keep
the item claimed and the partial change resumable.

Every persistent OpenSpec change is roadmap-backed. The active change directory
name is its canonical linkage and must equal exactly one roadmap slug; proposals
do not duplicate that linkage as metadata.

For an existing roadmap item, the generated Codex propose workflow invokes
`opsx:select` as its first mutation before authoring substantive artifacts. For
an explicit request to create a proposal or implement work that is absent from
the roadmap, the request itself authorizes the agent to state that it is adding
intake, invoke `roadmap:add`, and then use the normal selection path. The agent
may infer an obvious existing area, slug, and concise description, asking only
when scope genuinely spans areas or remains ambiguous. Discussion, exploration,
evaluation, and review are read-only; an explicit request to add backlog creates
only the roadmap item without selecting it.

A natural-language request to implement missing work may run intake, selection,
proposal authoring, and apply in sequence. An explicit `$openspec-apply`
invocation remains narrow and requires an existing active proposal. The
generated explore skill never selects work or creates persistent state.

### Independent verification gate

The generated Codex verification workflow is extended by mandatory root-agent
instructions and repository scripts. Verification is an agent-driven semantic
review, not a machine-executable OpenSpec CLI operation.

A successful gate requires:

1. A fresh, independent, read-only reviewer agent checks the implementation
   against the proposal, delta specs, design, and completed tasks, then performs
   a focused general code-quality review.
2. The reviewer reports no concrete actionable finding. Optional ideas and
   out-of-scope enhancements may be recorded but do not block.
3. The repository passes all of these commands without waivers:
   - `npm run roadmap:validate`
   - `npm run workflow:validate`
   - `npm run openspec:check`
   - strict pinned OpenSpec validation
   - `npm test`
   - `npm run lint`
   - `npm run lint:styles`
   - `npm run build`
   - `git diff --check`

Missing tools, access failures, dependency failures, and timeouts block the
gate exactly like failing checks. Verification must fail closed when the host
cannot spawn an independent reviewer; self-review is not a substitute.

The reviewer is capability-selected rather than model-pinned. Record the
reported reviewer/task identity in the verification evidence. The reviewer
never edits files; the primary agent owns focused remediation.

Allow at most three review-and-fix iterations. Every iteration starts with a
fresh reviewer. If the reviewer reports an actionable finding, remediate it and
begin the next iteration without running the command suite against an
implementation already known to be unacceptable. Run the complete command
suite only after the reviewer reports clean. A command failure consumes that
iteration and requires a fresh reviewer on the next attempt. The primary agent
may rebut a finding with concrete evidence, but a fresh reviewer must accept
that resolution. If iteration three is not clean, stop without verification
and request user intervention.

### Verification evidence and receipts

After a clean gate, write `verification.md` inside the active change. It records:

- reviewer/task identity;
- iteration count and outcome;
- concise findings and their resolution status;
- exact commands run and pass results; and
- the repository fingerprint.

Do not preserve reviewer transcripts or hidden reasoning. Do not store verbose
successful command logs.

Provide internal `npm run opsx:record-verification -- <slug>`. It validates the
required `verification.md` fields, computes a composite fingerprint, and writes
an ephemeral ignored receipt at `openspec/.verification/<slug>.json`. The
fingerprint binds to current `HEAD`, every tracked working-tree file, every
non-ignored untracked file, and the completed `verification.md`, excluding only
the receipt and lifecycle lock. A separate summary hash avoids circular hashing
while still invalidating any edit to `verification.md`.

Receipts are single-use workflow evidence, not a cryptographic security
boundary. Directly hand-writing a receipt is unsupported. Any subsequent
non-ignored repository edit invalidates it and requires the entire gate again.
Delete a receipt after successful archive and whenever verification restarts.

### Transactional archive lifecycle

Provide `npm run opsx:archive -- <slug>` for every change. Raw archival is
unsupported.

Before mutation, the wrapper must:

- acquire a repository-local ignored lifecycle lock;
- validate the full roadmap and active workflow state;
- require all OpenSpec artifacts to be `done` or legitimately `skipped`;
- reject every unchecked task without an override;
- require a fresh matching verification receipt;
- run strict OpenSpec structural validation; and
- snapshot the roadmap and every OpenSpec path the native archive operation may
  change.

If delta specs exist, the native archive must synchronize them into
`openspec/specs/`; the wrapper must not expose a skip option. If no delta specs
exist, it may select OpenSpec's infrastructure/documentation-only archive path.

Successful archival removes the change's roadmap item, removes its slug from
every dependent `prerequisites` sequence, and leaves `[]` when the final
prerequisite is gone.

Before committing the transaction, rerun `roadmap:validate`,
`workflow:validate`, strict OpenSpec validation, and `git diff --check`. Do not
rerun the full application suite solely for archive metadata movement. Any
handled failure restores the exact pre-command snapshot, removes the lock, and
exits nonzero. Concurrent lifecycle commands fail while the lock is held.

The lock records enough ownership and operation metadata to diagnose an
interrupted process. A lock is never discarded merely because it is old. If a
process terminates without cleanup, subsequent lifecycle commands report the
affected operation and paths and refuse mutation. The human recovery guide
must explain how to inspect the recorded state, restore or finish the partial
operation deliberately, validate the repository, and only then remove the
stale lock. Automatic journaled crash recovery is out of scope.

### Cross-artifact validation

Provide read-only `npm run workflow:validate` to detect invalid or mixed state,
including state commonly caused by bypassing a lifecycle wrapper. A direct
mutation that produces the same valid repository state as a wrapper is not
distinguishable and is outside this cooperative enforcement boundary. The
command cross-checks the roadmap, active changes, task/artifact state,
root-agent mandates, and post-migration archives.

At minimum it rejects:

- an active change without exactly one same-slug roadmap item;
- more than one active change for a roadmap item;
- an active change whose roadmap item still has prerequisites;
- an active or archived OpenSpec slug that reuses another live or archived
  OpenSpec identity;
- stale or contradictory lifecycle state; and
- a post-migration OpenSpec archive missing the required `verification.md`
  evidence. The one legacy bootstrap archive created by `$spec-finalize` is an
  explicit historical exception.

An active scaffold created by a successful selection may temporarily lack a
proposal; its directory name and same-slug roadmap item provide complete
linkage until proposal authoring finishes. Archived changes remain subject to
audit validation and permanently reserve their slugs.

During this migration only, `workflow:validate` must recognize the bootstrap
combination of the `migrate-agentic-flow-to-open-spec` item in the canonical
YAML roadmap, the frozen `specs/roadmap-legacy.md` compatibility copy, this
same-slug legacy spec and its sibling legacy task tracker, and no OpenSpec
change. The legacy spec derives the item's in-progress state for this exception.
The exception disappears when `$spec-finalize` archives this spec, removes its
YAML roadmap item, and deletes the compatibility copy.

Include `roadmap:validate`, `workflow:validate`, generated-integration contract
checks, receipt freshness, locking, rollback, and archive cleanup in automated
tests.

### Legacy workflow and documentation

- Retain `.codex/skills/spec-create`, `spec-plan`, `spec-implement`,
  `spec-validate`, and `spec-finalize`, including their prompts and references,
  until the dependent removal follow-up is implemented.
- Retain `.codex/agents/spec-validator.toml` so this migration can complete its
  existing independent validation gate.
- Mark every retained legacy skill, its generated skill metadata, the custom
  validator, and its contributor instructions as `legacy`. State that they are
  preserved only to complete `migrate-agentic-flow-to-open-spec` and must not
  be selected for new work after that feature is archived.
- Give the retained skills a narrow bootstrap compatibility rule. `$spec-plan`,
  `$spec-implement`, and `$spec-validate` may read
  `specs/roadmap-legacy.md` only for this migration. `$spec-finalize` uses that
  copy to identify the legacy bootstrap, then uses the shared YAML lifecycle
  code to remove the canonical roadmap item and prerequisite references before
  deleting the compatibility copy. No retained skill gains general YAML-roadmap
  support for new legacy work.
- Make root `AGENTS.md` the sole workflow authority. It directs this bootstrap
  through the legacy workflow and directs every subsequently selected change
  through OpenSpec. Tool-scoped `AGENTS.md` files retain only tool-specific
  engineering and validation guidance.
- Add `docs/openspec-workflow.md` as the canonical human guide for roadmap
  intake, Codex skills, lifecycle wrappers, verification, archival,
  regeneration, and upgrades. Link to it from `docs/contributing.md` and keep
  other descriptions concise.
- Search every repository instruction and documentation surface for superseded
  workflow references. Matches inside retained legacy archives are intentional
  history and are not rewritten.

### Bootstrap migration and deferred follow-ups

This document remains the one-time bootstrap authority for the entire feature.
Do not convert or duplicate it as an OpenSpec change. The user or primary agent
must complete it through the existing workflow in this order:

1. Use `$spec-plan` to create and maintain the sibling legacy task tracker.
2. Use `$spec-implement` to claim and implement its tasks through the existing
   `todo` to `in-progress` to validation gate to `done` lifecycle.
3. Use `$spec-validate` and the retained custom validator agent for the final
   independent spec-alignment and code-quality gate while the final task remains
   `in-progress`.
4. Use `$spec-finalize` to update current-state documentation, archive this
   legacy spec, delete its task tracker, remove its canonical YAML roadmap item,
   unblock every dependent roadmap entry, and delete
   `specs/roadmap-legacy.md`.

The new OpenSpec verification receipt and archive wrapper apply to changes
selected after this migration. They do not apply retroactively to this legacy
bootstrap feature. After `$spec-finalize` succeeds, no active legacy spec or
bootstrap exception remains, but the legacy skills and validator remain visibly
marked until the removal follow-up is implemented.

For post-migration work, the active change is the ownership boundary. OpenSpec
task checkboxes track only incomplete and completed implementation work; do not
recreate the legacy per-task `todo`, `in-progress`, and `done` ownership states.

The machine-readable roadmap must retain these deferred global items without
creating OpenSpec changes for them:

- `add-pr-quality-gate`, initially dependent on this migration, to add pull
  request and main-branch CI for the full repository and workflow validation
  suites.
- `adopt-openspec-for-other-agents`, initially dependent on this migration, to
  generate equivalent OpenSpec integrations for agents such as Cursor and
  Claude Code.
- `enable-advanced-openspec-workflows`, initially dependent on this migration,
  to integrate `bulk-archive` and `onboard` with roadmap intake and selection,
  per-change verification receipts, and safe archive behavior.
- `remove-legacy-spec-workflow`, initially dependent on this migration, to
  remove the legacy `$spec-*` skills, custom validator agent, and bootstrap-only
  contributor guidance after this feature has used them to finish.

Bootstrap cleanup removes the migration slug from all four prerequisites,
leaving them planned and unblocked.

## Acceptance criteria

- A clean `npm install` provides exact OpenSpec 1.7.0 and the documented pinned
  CLI command on Node `>=20.19.0`.
- OpenSpec recognizes the checked-in configuration and strict validation
  succeeds.
- Codex exposes skills-only generated integration for exactly `explore`,
  `propose`, `apply`, `verify`, and `archive`, while `new`, `continue`, `update`,
  `ff`, `sync`, `bulk-archive`, and `onboard` remain absent.
- `openspec:update` does not read or change personal OpenSpec configuration, and
  `openspec:check` proves the committed generated skills are reproducible.
- Generated OpenSpec files contain no hand edits; mandatory repository behavior
  survives regeneration through root-agent guidance, scripts, and automated
  contract checks.
- `specs/roadmap.yml` contains every existing planned roadmap item plus the four
  agreed deferred follow-ups, excludes the completed bootstrap item, contains
  no stored status fields, conforms to schema version 1, and has a valid acyclic
  prerequisite graph.
- Planned roadmap items remain backlog entries and are not bulk-created as
  OpenSpec changes.
- `roadmap:add` is the only supported intake mutation, targets existing areas,
  uses the shared lifecycle lock, and validates and rolls back its YAML edit.
- Selection rejects blocked, missing, duplicated, historically reserved,
  already-selected, or invalid items and atomically creates an eligible
  same-slug active change. Active-change presence derives in-progress state.
- Every persistent change is roadmap-backed; proposal files contain no
  duplicate roadmap linkage, rationale field, or alternate creation path.
- Verification cannot produce a fresh receipt without a clean independent
  agent review and every mandatory repository command passing.
- A stale, missing, malformed, or incomplete receipt blocks archival.
- Archival rejects incomplete artifacts/tasks without override, synchronizes
  every delta spec, performs required roadmap cleanup, and rolls back exactly
  on handled failure.
- A committed integration test exercises the pinned real CLI in a temporary
  project with a synthetic roadmap, simulated reviewer evidence, receipt
  freshness, blocked/unblocked selection, archival, dependent cleanup,
  intake, concurrency locking, and rollback without touching the real roadmap.
- The bootstrap is planned, implemented, independently validated, finalized,
  and archived through `$spec-plan`, `$spec-implement`, `$spec-validate`, and
  `$spec-finalize`; it is never duplicated as an OpenSpec change.
- Every custom `$spec-*` skill and the custom spec-validator agent remains
  installed but is visibly marked `legacy` and limited to completing this
  migration until the dependent removal follow-up is implemented.
- The retained legacy skills can complete this bootstrap from the frozen
  `specs/roadmap-legacy.md` copy, while finalization mutates only the canonical
  YAML roadmap and deletes the compatibility copy.
- There are no active legacy `specs/*.md` or `specs/*.tasks.md` files after the
  bootstrap spec moves into the archive, and no `specs/roadmap-legacy.md`
  remains; `specs/roadmap.yml` is the only live planning artifact directly
  under `specs/`.
- Existing `specs/archive/` contents remain unchanged except for this completed
  bootstrap spec.
- Slugs are unique across the live roadmap, active OpenSpec changes, and
  OpenSpec archives; legacy archives do not reserve slugs, and deliberately
  dropped unarchived work releases its slug.
- Application source, generated `dist/`, and production behavior are unchanged.

## Validation plan

- Run the repository-managed OpenSpec version, status, instructions, and strict
  validation commands against the checked-in configuration.
- Run `npm run openspec:check` and confirm the exact approved Codex skill set.
- Run `npm run roadmap:validate` and `npm run workflow:validate`.
- Run the automated lifecycle integration test against a temporary roadmap and
  OpenSpec project using the pinned real CLI, including `roadmap:add`.
- Exercise the legacy bootstrap finalization path against temporary roadmap
  copies and confirm that it archives the legacy spec, cleans the canonical YAML
  dependencies, and deletes only the compatibility roadmap.
- Perform one live verification with a fresh read-only reviewer and confirm that
  a clean result plus all commands creates a fresh receipt while a subsequent
  edit invalidates it.
- Exercise handled archive failure injection and confirm the roadmap and all
  OpenSpec paths return byte-for-byte to their pre-command state and the lock
  clears.
- Simulate an interrupted lifecycle operation and confirm later mutations fail
  closed with actionable manual recovery instructions until the recorded state
  is deliberately resolved and the stale lock is removed.
- Search outside `specs/archive/` for active legacy specs or task trackers and
  for unmarked or newly selectable `$spec-*` and custom-validator instructions.
  Confirm every intentionally retained legacy workflow file is visibly marked
  and restricted to this bootstrap migration.
- Run `npm test`, `npm run lint`, `npm run lint:styles`, `npm run build`, and
  `git diff --check`.
- Confirm application source and `dist/` are absent from the final diff.

## Risks and constraints

- OpenSpec profile selection is global by default. Repository regeneration must
  isolate its configuration or it will mutate contributor preferences.
- OpenSpec-generated files may change between releases. Exact version pinning,
  an explicit allowlist, isolated regeneration, and byte comparison are
  required to make drift reviewable.
- OpenSpec project operation guidance is advisory and cannot replace built-in
  workflow steps. Root `AGENTS.md`, executable wrappers, receipt enforcement,
  and cross-artifact validation provide the repository-specific guarantees.
- The temporary legacy roadmap is intentionally stale after conversion and must
  never be treated as canonical or used to select additional work.
- Agentic verification is not cryptographic attestation. Receipts provide
  freshness and auditability for a cooperative pet-project workflow.
- A receipt fingerprints the whole non-ignored repository. Unrelated edits after
  verification intentionally require a fresh complete gate.
- Transactional archive rollback must include main-spec synchronization paths,
  not only the active change and roadmap.
- Automatic rollback is guaranteed for handled wrapper failures, not process
  termination. Interrupted operations rely on recorded lock metadata,
  fail-closed validation, and explicit human recovery.
- Legacy archives and active OpenSpec truth must remain clearly separated so
  agents do not treat historical plans as current requirements.
