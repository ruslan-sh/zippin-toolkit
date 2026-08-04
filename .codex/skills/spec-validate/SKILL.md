---
name: spec-validate
description: Legacy bootstrap-only validation for migrate-agentic-flow-to-open-spec. Unavailable for new work.
---

# Spec Validate

> **Legacy only:** Validate only `migrate-agentic-flow-to-open-spec`. Read `specs/roadmap-legacy.md` only for that bootstrap. Use `$openspec-verify-change` afterward.

Validate spec alignment first. When the requested implementation has no major
spec misses, follow it with a focused general code review of the same change
set and return one combined report.

Read the target spec first. If the user gives only the spec path, derive the sibling tasks file by replacing `.md` with `.tasks.md`. Read the tasks file if it exists.

Read [`references/checklist.md`](./references/checklist.md) before writing the review.

## Validation context

When the parent identifies the review as the `spec-implement` pre-completion
gate, expect the selected task to be `in-progress`. Do not report that status
as drift or require it to be `done` before the gate can pass. Instead, decide
whether the implementation, tests, and available validation evidence justify
the implementer changing it to `done` after a clean report. Report `todo` as
workflow drift in this context because active work should already be claimed.
Accept fresh raw command outcomes supplied by the implementer as validation
evidence. Do not rerun a passing check merely to duplicate it; run a focused
check only when evidence is absent, stale relative to subsequent edits, failed,
or insufficient to resolve a concrete review question.

For a standalone validation request, continue to verify that existing `done`
statuses are justified and report implementation/task-status mismatches
normally.

## Workflow

1. Read the spec and extract:

- intended end state;
- acceptance criteria;
- task boundaries and validation requirements;
- any explicit non-goals.

Also inspect `specs/roadmap-legacy.md` for the bootstrap slug. Verify that
its status is `in-progress` and its `Prerequisite` field is `none`. Treat an
active spec with unresolved prerequisites as workflow drift and report it, but
keep the roadmap read-only during validation.

2. Read the implementation that should satisfy the spec:

- start with files named in the spec or task file;
- expand only to direct callers, tests, and touched types/modules;
- inspect relevant git worktree changes to understand what was actually implemented for the current task or review request;
- avoid broad repo scans unless the spec is vague.

3. Compare along three axes:

- implementation vs spec: what is compliant, partially compliant, or missing;
- tasks vs implementation: whether completed task statuses are justified by the code;
- spec/tasks vs implementation reality: whether the documents need updates or whether the code simply has remaining work.

4. Validate claims with local evidence:

- cite concrete file references and line numbers;
- use `git diff`, `git status`, or focused diffs for touched files when that helps identify the intended implementation slice;
- run the relevant checks named in the spec or `AGENTS.md` when they are needed to confirm behavior or buildability;
- during a pre-completion gate, avoid rerunning checks already covered by fresh
  raw evidence from the implementer;
- if a command is known to hang in WSL for this repo, use the documented fallback and say so.

5. Decide whether to continue to general code review:

- Treat a missing core behavior, violated safety or transactional guarantee,
  substantially incomplete requested scope, or unjustified completed task as a
  major spec miss.
- If a major spec miss exists, prioritize reporting it and do not broaden the
  review. State that general code review was deferred because the implementation
  is not sufficiently spec-complete.
- Otherwise, review the changed implementation and its direct callers and tests
  for correctness, regressions, security, reliability, data integrity,
  accessibility, performance, maintainability, and meaningful test gaps.
- Keep the general review focused on actionable defects. Do not report cosmetic
  preferences or unrelated pre-existing issues.

## Review Rules

- Default to code-review mode: findings first, ordered by severity.
- Complete the spec-alignment pass before beginning the general code-review pass.
- Label each finding as `Spec alignment` or `General code review`; merge
  duplicate findings rather than reporting the same defect twice.
- Focus on bugs, missing behavior, task-status drift, validation gaps, and document/code mismatches.
- Distinguish clearly between:
  - "the implementation is not finished yet";
  - "the spec is wrong/outdated";
  - "the task tracker is inaccurate".
- During a pre-completion gate, treat `in-progress` as accurate for the selected
  task and state whether it is ready for the implementer to mark `done`; do not
  make that expected post-gate transition a finding.
- Do not ask to update the spec just because later tasks are still open.
- Treat the spec as the intended end state unless the implementation proves the spec is internally inconsistent or materially outdated.
- If task boundaries are blurred but still coherent, call that out as a note, not a defect.
- Treat `specs/roadmap-legacy.md` as read-only during bootstrap validation. Do not delete, add, or update it; cleanup belongs to bootstrap finalization.
- Report stale prerequisite references, missing prerequisite metadata, and a
  matching roadmap entry whose status does not reflect the active spec.

## Output

Use this structure:

**Findings**

- One severity-ordered list combining spec-alignment and general code-review
  findings, with a lens label, file references, and concise impact.
- If there are no findings, say so explicitly.

**Assessment**

- State whether the implementation is correct for the requested scope or task.
- State whether the full spec is satisfied yet.
- State whether general code review was completed or deferred due to major spec
  misses.

**Spec Update**

- Say one of:
  - spec does not need updating;
  - tasks file should be updated;
  - spec should be updated;
  - both should be updated.
- Briefly justify the conclusion.
- For a clean pre-completion gate, say the tasks file needs no corrective
  update and that the implementer may perform the expected `in-progress` to
  `done` transition after the gate.

**Validation**

- List the commands run, or say no commands were needed.
- If validation used a fallback due to environment behavior, name it explicitly.
