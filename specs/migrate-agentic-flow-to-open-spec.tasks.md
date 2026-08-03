# Tasks For Migrate the Agentic Workflow to OpenSpec

## Task 1: Provide a pinned and reproducible OpenSpec integration
Status: done
Summary: Contributors can use the repository-pinned OpenSpec 1.7.0 CLI and the exact approved Codex skill set without depending on or modifying personal OpenSpec configuration.
Scope:
- Declare Node.js `>=20.19.0`, add exact `@fission-ai/openspec` version `1.7.0`, update the lockfile, and expose the telemetry-disabled repository CLI.
- Add the OpenSpec project configuration and initialize the Codex skills-only integration for exactly `explore`, `propose`, `apply`, `verify`, and `archive`.
- Add the checked-in workflow allowlist plus isolated `openspec:update` and non-mutating `openspec:check` commands.
- Add automated contract coverage for the exact workflow surface, regeneration isolation, byte-for-byte reproducibility, and mandatory repository-owned guidance that generated files cannot provide.
- Keep generated OpenSpec integration disposable and free of hand edits.
Dependencies:
- Depends on: none
- Parallelizable: no
- Parallel with: none
Validation:
- Install from the updated lockfile and confirm the pinned CLI reports OpenSpec 1.7.0 on a supported Node.js version.
- Run `npm run openspec:check` and the generated-integration contract tests.
- Run strict repository-managed OpenSpec validation against the checked-in configuration.
- Confirm excluded workflows are not exposed and isolated regeneration does not read or modify the personal profile.
Definition of done:
- A clean install provides the pinned CLI and only the approved generated Codex skills.
- Regeneration is deterministic, isolated, and enforced without hand-editing generated files.
- The repository remains working and relevant automated checks pass.

## Dev Task 2: Establish the shared roadmap and lifecycle foundation
Status: done
Summary: Add the schema, state inspection, identity, locking, snapshot, and rollback primitives needed by the user-facing roadmap, selection, and archive commands.
Scope:
- Implement the version 1 YAML roadmap parser and validator for exact area and item fields, ordered content, global slug uniqueness, prerequisite resolution, duplicate/self-reference rejection, and cycle detection.
- Cross-check active and archived OpenSpec identities while treating legacy archives as outside the OpenSpec identity system.
- Implement structure-preserving YAML mutation helpers that preserve area order, comments, and scalar styles.
- Implement the shared ignored lifecycle lock with diagnostic ownership and operation metadata, fail-closed stale-lock behavior, and safe release after success or handled rollback.
- Implement reusable snapshot and exact handled-failure rollback helpers for lifecycle paths.
- Add focused automated tests for schema, graph, identity, locking, formatting preservation, and rollback primitives.
Dependencies:
- Enables: Task 3, Task 4, and Task 6
- Depends on: Task 1
- Parallelizable: no
- Parallel with: none
Validation:
- Run focused unit tests covering valid and invalid roadmap graphs, identity collisions, lock contention, stale locks, node-preserving edits, and exact rollback.
- Run `npm run lint` for added JavaScript or TypeScript.
- Run `git diff --check`.
Definition of done:
- Later lifecycle commands share one tested interpretation of roadmap and OpenSpec state.
- Concurrent or interrupted mutations fail closed with actionable diagnostics.
- The repository remains working and this increment clearly advances Tasks 3, 4, and 6.

## Task 3: Manage the canonical YAML roadmap and intake queue
Status: done
Summary: Contributors can validate and add unselected work through one machine-readable roadmap while preserving its human-maintained structure.
Scope:
- Rename the complete Markdown roadmap snapshot to frozen `specs/roadmap-legacy.md` before creating `specs/roadmap.yml`.
- Convert every roadmap item and prerequisite into the specified four-area version 1 YAML shape without stored status fields or unintended OpenSpec changes.
- Provide read-only `npm run roadmap:validate` using the shared validation foundation.
- Provide canonical non-interactive `npm run roadmap:add` for existing areas, including repeated prerequisites, whole-roadmap pre/post validation, lifecycle locking, reserved-slug checks, structure-preserving mutation, and handled-failure rollback.
- Keep the compatibility Markdown frozen and limited to the bootstrap migration.
- Add command-level tests for successful intake and rejection of invalid areas, slugs, prerequisites, identities, concurrent operations, and rollback failures.
Dependencies:
- Depends on: Dev Task 2
- Parallelizable: no
- Parallel with: none
Validation:
- Run `npm run roadmap:validate` against the converted roadmap.
- Exercise `roadmap:add` against temporary roadmap copies and verify formatting preservation, locking, rejection cases, and exact rollback.
- Confirm every existing planned item and the four deferred follow-ups remain backlog-only entries.
- Confirm `specs/roadmap-legacy.md` is byte-equivalent to the pre-conversion roadmap snapshot and is not used for new intake.
Definition of done:
- `specs/roadmap.yml` is the canonical valid intake queue and contains the complete intended backlog.
- Contributors have one safe, non-interactive command for adding valid unselected work.
- No product roadmap item or OpenSpec change is created as a conversion side effect.

## Task 4: Select roadmap work into an active OpenSpec change
Status: in-progress
Summary: A contributor can transactionally claim one eligible roadmap item as a same-slug active OpenSpec change, and invalid or partial workflow state is detected before further work proceeds.
Scope:
- Provide strict, non-idempotent `npm run opsx:select -- <roadmap-slug>` using the shared lifecycle lock, validation, snapshot, and rollback behavior.
- Require exactly one unblocked roadmap item and reject missing, duplicate, blocked, already-active, archived, or otherwise reserved identities.
- Create the same-slug active OpenSpec scaffold without duplicating roadmap linkage in proposal metadata; keep successfully selected partial proposal work resumable.
- Provide read-only `npm run workflow:validate` cross-checks for roadmap, active changes, archives, artifact/task state, required root-agent mandates, contradictory lifecycle state, and verification evidence.
- Recognize only the documented legacy bootstrap combination while this migration remains active.
- Add automated command tests for selection success, all rejection paths, mixed-state detection, lock contention, and handled rollback.
Dependencies:
- Depends on: Task 3
- Parallelizable: no
- Parallel with: none
Validation:
- Run `npm run roadmap:validate` and `npm run workflow:validate`.
- Exercise selection in a temporary OpenSpec project with unblocked, blocked, missing, duplicated, active, archived, partially created, and rollback scenarios.
- Run strict OpenSpec validation for the selected temporary change.
- Confirm a successful selection derives in-progress state solely from active-directory presence.
Definition of done:
- Eligible roadmap work has one safe selection path and every persistent active change remains roadmap-backed.
- Repeated calls and invalid or mixed states fail closed without silent reconciliation.
- The bootstrap legacy state is accepted only through its narrow documented exception.

## Task 5: Record independent verification as a fresh repository receipt
Status: todo
Summary: The OpenSpec verification workflow can record a clean independent review and the complete required command suite, then produce a receipt that becomes stale after any relevant repository edit.
Scope:
- Add mandatory root-agent verification instructions for a fresh read-only reviewer, at most three review-and-fix iterations, primary-agent remediation, no self-review fallback, and the complete no-waiver command suite.
- Define and validate concise `verification.md` evidence containing reviewer identity, iteration outcome, findings and resolutions, exact passing commands, and repository fingerprint information.
- Provide internal `npm run opsx:record-verification -- <slug>` to validate evidence and write the ignored, ephemeral receipt.
- Compute the composite fingerprint over `HEAD`, tracked working-tree files, non-ignored untracked files, and verification evidence while excluding only the receipt and lifecycle lock and avoiding circular hashing.
- Delete an existing receipt whenever verification restarts and reject missing, malformed, incomplete, or stale evidence.
- Add focused tests for evidence validation, fingerprint coverage, summary hashing, ignored-file behavior, and receipt invalidation.
Dependencies:
- Depends on: Task 4
- Parallelizable: no
- Parallel with: none
Validation:
- Run a live verification with a fresh independent read-only reviewer and record its identity and outcome.
- After a clean review, run `npm run roadmap:validate`, `npm run workflow:validate`, `npm run openspec:check`, strict OpenSpec validation, `npm test`, `npm run lint`, `npm run lint:styles`, `npm run build`, and `git diff --check`.
- Record a receipt, then modify a non-ignored repository file and confirm freshness validation fails.
- Confirm ignored receipt and lock changes do not create circular or false invalidation.
Definition of done:
- A receipt can be produced only from complete, clean, current verification evidence.
- Every relevant repository edit invalidates the receipt and requires the whole gate again.
- Failure to obtain an independent review or pass any required command blocks verification.

## Task 6: Archive a verified change transactionally
Status: todo
Summary: A contributor can archive one fully completed and freshly verified OpenSpec change while synchronizing current specs and cleaning its roadmap dependencies, with exact rollback on handled failure.
Scope:
- Provide mandatory `npm run opsx:archive -- <slug>` and make raw archival unsupported through repository guidance and contract validation.
- Before mutation, require the lifecycle lock, valid workflow state, completed or legitimately skipped artifacts, no unchecked tasks, a fresh matching receipt, and strict OpenSpec validation.
- Snapshot the roadmap and every active, archived, and current-spec path the native archive may change.
- Invoke the pinned native archive path with required delta-spec synchronization and the documented infrastructure-only path when no delta specs exist; expose no skip option.
- Remove the archived roadmap item and its slug from every dependent prerequisite list, leaving `[]` where appropriate.
- Revalidate roadmap, workflow state, strict OpenSpec structure, and `git diff --check` before commit; on handled failure restore the exact snapshot and clear the lock.
- Delete the single-use receipt after successful archive and add tests for preconditions, synchronization, dependency cleanup, concurrency, interrupted state, and failure injection.
Dependencies:
- Depends on: Task 5
- Parallelizable: no
- Parallel with: none
Validation:
- Exercise successful archival with and without delta specs in temporary projects using the pinned real CLI.
- Confirm incomplete tasks/artifacts and stale, missing, or malformed receipts block archival without overrides.
- Inject handled failures after each mutation boundary and verify byte-for-byte restoration plus lock cleanup.
- Simulate process interruption and confirm later lifecycle mutations fail closed until deliberate recovery.
- Run the required post-archive validation commands without rerunning the full application suite solely for metadata movement.
Definition of done:
- Every supported archive synchronizes required specs, removes and unblocks roadmap entries, preserves an auditable archive, and consumes its receipt.
- Handled failures leave the repository exactly as it was before the command.
- Interrupted operations remain diagnosable and cannot be bypassed automatically.

## Dev Task 7: Prove the complete lifecycle with the pinned real CLI
Status: todo
Summary: Add one isolated integration harness that proves Tasks 3 through 6 work together against OpenSpec 1.7.0 without touching the repository's real roadmap or active changes.
Scope:
- Build a temporary-project integration test with a synthetic roadmap and the repository-pinned real OpenSpec CLI.
- Cover canonical intake, blocked and unblocked selection, proposal/task completion, simulated reviewer evidence, receipt freshness, delta synchronization, archival, dependent cleanup, and permanent archived-slug reservation.
- Cover shared locking, stale-lock diagnostics, workflow drift, strict validation, generated-integration contracts, failure injection, and exact rollback.
- Keep fixtures and successful logs concise, deterministic, and independent of personal OpenSpec configuration.
Dependencies:
- Enables: Task 8
- Depends on: Task 6
- Parallelizable: no
- Parallel with: none
Validation:
- Run the committed lifecycle integration test repeatedly from a clean temporary directory.
- Confirm the test uses the pinned package CLI and never mutates the real roadmap, OpenSpec paths, personal profile, application source, or `dist/`.
- Run `npm test`, `npm run lint`, and `git diff --check`.
Definition of done:
- The complete lifecycle has automated end-to-end coverage at the real CLI boundary.
- Core failure, concurrency, freshness, synchronization, cleanup, and rollback guarantees are demonstrated together.
- The repository remains working and this increment clearly advances Task 8.

## Task 8: Transition contributors to the OpenSpec workflow
Status: todo
Summary: Contributors have one authoritative, documented OpenSpec workflow for all future selected work, while the visibly legacy workflow remains narrowly capable of validating and finalizing this bootstrap migration.
Scope:
- Make root `AGENTS.md` the sole workflow authority for roadmap intake, OpenSpec proposal/apply/verify/archive behavior, generated-file rules, lifecycle wrappers, and the one-time legacy bootstrap path.
- Reduce tool-scoped `AGENTS.md` files to tool-specific engineering and validation guidance.
- Mark all retained `$spec-*` skills, generated metadata, references, and the custom validator agent as legacy and unavailable for new work after this migration; preserve only the specified bootstrap compatibility.
- Update `$spec-plan`, `$spec-implement`, and `$spec-validate` to read the frozen compatibility roadmap only for this slug, and update `$spec-finalize` to remove the canonical YAML item and dependency references through shared lifecycle code before deleting the compatibility copy.
- Add `docs/openspec-workflow.md` covering intake, primary Codex skill names, lifecycle commands, verification, archival, regeneration, upgrades, and deliberate stale-lock recovery; link it from `docs/contributing.md`.
- Search repository instruction and documentation surfaces outside the immutable legacy archive and remove or mark superseded workflow guidance.
- Add contract and temporary-copy finalization tests for legacy restrictions, bootstrap cleanup, deferred-item unblocking, and preservation of unrelated roadmap and archive content.
Dependencies:
- Depends on: Dev Task 7
- Parallelizable: no
- Parallel with: none
Validation:
- Run the workflow contract tests and exercise legacy bootstrap finalization against temporary roadmap, spec, task, and archive copies.
- Confirm the temporary finalization removes only the bootstrap YAML item, clears its four dependent prerequisites, archives the legacy spec, deletes its tracker and compatibility roadmap, and preserves all other content.
- Search outside `specs/archive/` for active legacy workflow references and confirm every intentional match is visibly marked and restricted.
- Run `npm run roadmap:validate`, `npm run workflow:validate`, `npm run openspec:check`, strict OpenSpec validation, `npm test`, `npm run lint`, `npm run lint:styles`, `npm run build`, and `git diff --check`.
- Confirm application source and generated `dist/` are absent from the diff.
Definition of done:
- Future selected work is directed through the documented OpenSpec workflow and exact approved skill surface.
- The retained legacy workflow cannot authorize new work but can complete validation and finalization of this migration.
- The implementation is ready for the legacy `$spec-validate` gate and subsequent `$spec-finalize` archive cleanup.
