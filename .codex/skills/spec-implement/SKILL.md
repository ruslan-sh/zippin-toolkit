---
name: spec-implement
description: Implement work from the repository's active specs and sibling task trackers. Use when the user asks to implement the next spec, next open task, current spec work, or an entire feature/spec. Default to the first actionable open task; implement every remaining task only when the user explicitly requests the whole feature, whole spec, or all remaining tasks.
---

# Spec Implement

Implement the selected scope completely, including code, tests, validation, and task tracking. Follow the repository and project-scoped `AGENTS.md` files.

## Select the spec

1. Use a spec or task file explicitly named by the user.
2. Otherwise inspect `specs/*.tasks.md`, excluding `specs/archive/`. Select the single tracker containing unfinished work.
3. If multiple trackers contain unfinished work and repository context does not identify one as active, ask the user which spec to use. Do not guess based only on filename ordering.
4. Read the complete spec, its sibling task tracker, `specs/roadmap.md`, and applicable `AGENTS.md` files before editing code.

If the spec's matching roadmap entry lists any prerequisite slug, stop before
implementation and report the unresolved prerequisites. Do not offer or accept
an override while the roadmap dependency remains. A missing matching entry or
`Prerequisite: none` does not block implementation.

Treat statuses other than `done` or equivalent checked completion as unfinished. Respect dependencies and select the earliest actionable unfinished task, including an unfinished development subtask when the tracker uses them.

## Select the scope

- Default mode: implement only the next actionable unfinished task.
- Whole-feature mode: implement all remaining tasks in dependency order only when explicitly requested with language such as "whole feature", "entire spec", or "all remaining tasks".
- If the user names a particular task, implement that task if its dependencies are satisfied. Otherwise explain the unmet dependency and implement it only if the user's requested scope includes it.

Do not silently expand default mode into later tasks. Small prerequisite or integration edits required to leave the selected task working are within scope.

## Implement

1. Read files named by the spec and task, then inspect only direct integration points needed to understand the change.
2. Check `git status` and relevant diffs. Preserve unrelated user changes and generated output.
3. Implement the smallest coherent vertical slice satisfying the task's scope and definition of done.
4. Add or update tests with the behavior. Do not defer validation work assigned to the task.
5. Run the task-specific checks plus all checks required by applicable `AGENTS.md` files. Use documented fallbacks when necessary.
6. Fix failures caused by the implementation. Report pre-existing or environmental failures precisely.

In whole-feature mode, repeat this workflow task by task. Keep the repository working at each task boundary when practical.

## Update tracking

After implementation and required validation succeed, change the implemented task's status to `done`. Preserve task text and unrelated notes. Do not mark a task done when required behavior remains missing or a relevant failure is attributable to the change.

In whole-feature mode, update each task only after its own completion. Do not archive the spec or update current-state documentation unless the user also requests the post-implementation documentation workflow.

## Report

Summarize:

- selected spec and task scope;
- behavior implemented and files changed;
- validation commands and outcomes;
- assumptions, edge cases, and any remaining open tasks.
