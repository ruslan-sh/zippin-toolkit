---
name: validate-spec-implementation
description: Validate repository implementation against a spec in `specs/*.md` and its sibling `*.tasks.md`. Use when the user asks whether current code matches the spec, whether completed tasks really satisfy the spec, or whether the spec/tasks file need updates after implementation work.
---

# Validate Spec Implementation

Use this skill when the user wants a spec-alignment review for the repo's `spec.md` + `spec.tasks.md` workflow.

Read the target spec first. If the user gives only the spec path, derive the sibling tasks file by replacing `.md` with `.tasks.md`. Read the tasks file if it exists.

Read [`references/checklist.md`](./references/checklist.md) before writing the review.

## Workflow

1. Read the spec and extract:

- intended end state;
- acceptance criteria;
- task boundaries and validation requirements;
- any explicit non-goals.

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
- if a command is known to hang in WSL for this repo, use the documented fallback and say so.

## Review Rules

- Default to code-review mode: findings first, ordered by severity.
- Focus on bugs, missing behavior, task-status drift, validation gaps, and document/code mismatches.
- Distinguish clearly between:
  - "the implementation is not finished yet";
  - "the spec is wrong/outdated";
  - "the task tracker is inaccurate".
- Do not ask to update the spec just because later tasks are still open.
- Treat the spec as the intended end state unless the implementation proves the spec is internally inconsistent or materially outdated.
- If task boundaries are blurred but still coherent, call that out as a note, not a defect.
- Treat `specs/roadmap.md` as read-only during validation. Do not delete, add, or update roadmap entries; roadmap cleanup belongs to the post-implementation archival workflow.

## Output

Use this structure:

**Findings**

- Ordered list with file references and concise impact.
- If there are no findings, say so explicitly.

**Assessment**

- State whether the implementation is correct for the requested scope or task.
- State whether the full spec is satisfied yet.

**Spec Update**

- Say one of:
  - spec does not need updating;
  - tasks file should be updated;
  - spec should be updated;
  - both should be updated.
- Briefly justify the conclusion.

**Validation**

- List the commands run, or say no commands were needed.
- If validation used a fallback due to environment behavior, name it explicitly.
