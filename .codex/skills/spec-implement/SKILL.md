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
7. Run the independent validation gate below before marking the task done.

In whole-feature mode, repeat this workflow task by task. Keep the repository working at each task boundary when practical.

## Run the independent validation gate

After finishing each task, run up to three validation iterations:

1. Spawn a fresh project custom agent named `spec_validator`, configured in `.codex/agents/spec-validator.toml` to use `gpt-5.6` with `model_reasoning_effort = "low"`. Give it the target spec and task scope, then instruct it to run `/spec-validate` against the current worktree. Do not give it prior validation conclusions or expected findings.
2. Process the subagent's complete report. For every actionable finding attributable to the current task, inspect the cited evidence, fix the implementation or tracking as appropriate, and rerun the affected required checks.
3. Spawn another fresh `spec_validator` agent and run `/spec-validate` again after the fixes. Never ask the previous subagent to merely recheck its own report.
4. Pass the gate only when a validation iteration reports no actionable findings for the current task. Notes about later tasks, unrelated pre-existing issues, or intentionally out-of-scope work do not fail the gate; include them in the final report when relevant.

Count every spawned `/spec-validate` review as one iteration, including a clean review. Stop after at most three iterations. If actionable findings remain after the third report, do not mark the task done and do not continue to another task. Report the unresolved findings, fixes attempted, and validation evidence, then wait for user guidance.

If the `spec_validator` custom agent or subagents themselves are unavailable, stop before marking the task done, report the unavailable gate, and wait for user guidance. Do not replace the configured custom agent with a generic subagent.

## Update tracking

After implementation, required local validation, and the independent validation gate succeed, change the implemented task's status to `done`. Preserve task text and unrelated notes. Do not mark a task done when required behavior remains missing, a relevant failure is attributable to the change, or the gate has not passed.

In whole-feature mode, update each task only after its own completion. Do not archive the spec or update current-state documentation unless the user also requests the post-implementation documentation workflow.

## Report

Summarize:

- selected spec and task scope;
- behavior implemented and files changed;
- validation commands and outcomes;
- assumptions, edge cases, and any remaining open tasks.
