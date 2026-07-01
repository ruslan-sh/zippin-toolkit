---
name: spec-to-tasks
description: Split a spec into user-testable vertical delivery slices, with smaller development tasks when a slice is too large, and keep a task-tracking file beside the spec. Use when the user wants a spec in specs/ converted into executable tasks or an existing tasks file updated after the spec changes.
---

# Spec To Tasks

## Overview

Use this skill when the user wants a spec decomposed into concrete, incremental implementation work. Prefer vertical slices that add user-testable value. Split an oversized slice into development tasks only when needed to keep changes reviewable and the repository green.

Before writing output, read:
- [`references/task-file-format.md`](./references/task-file-format.md) for file naming, section structure, required fields, and size-splitting rules.

Read only if updating an existing tasks file or task files:
- [`references/update-rules.md`](./references/update-rules.md) for status preservation and resync behavior.

## When To Use

Trigger this skill for requests like:
- "split this spec into tasks"
- "turn this spec into implementation tasks"
- "create a task list from this spec"
- "update the tasks for this spec"
- "resync task breakdown after the spec changed"

Use it for both:
- initial task generation from a spec
- later updates that preserve task status and useful manual notes where possible

## Core Rules

- Make each primary task a vertical slice that adds observable, user-testable value.
- Order slices so the earliest useful behavior can be exercised as soon as practical.
- If a vertical slice is too large for a digestible PR, split it into explicitly labeled development tasks that converge on that slice.
- Each slice and development task should leave the repo in a working state with build and relevant tests passing.
- If keeping the repo green requires a slightly larger task, prefer the green boundary over an artificially tiny task.
- Represent both execution order and dependency/parallelism explicitly.
- Preserve existing task statuses and human-added notes when updating, unless the spec changed enough that the task must be replaced.
- Do not create busywork tasks. Each task should correspond to a meaningful implementation increment.

## Workflow

### 1. Read the spec and extract work streams

Read the target spec and identify:
- the main implementation areas;
- user-visible capabilities and the smallest end-to-end path for each;
- likely touched modules;
- sequencing constraints;
- validation requirements;
- natural green checkpoints;
- work that can run in parallel.

Split by user-testable delivery boundaries, not document headings or technical layers alone. Avoid making separate primary tasks for UI, logic, tests, or integration when they can form one coherent vertical slice.

### 2. Decide the task graph

Create tasks that are:
- independently understandable;
- independently valuable and testable by a user whenever they are primary tasks;
- sized for a small but real implementation increment or split into development tasks;
- explicit about whether they depend on earlier tasks;
- explicit about whether they can be done in parallel.

Prefer fewer, cleaner vertical slices over many technical-layer tasks. When a slice is too large, keep it as the stated delivery outcome and add the minimum development tasks needed to implement it safely. Development tasks may deliver internal value, but must have a concrete outcome, validation, and a clear relationship to their parent slice.

### 3. Preserve existing tracking on updates

If a `.tasks.md` or split task files already exist:
- read them first;
- preserve tracking according to [`references/update-rules.md`](./references/update-rules.md).

Do not blindly overwrite task progress tracking.

### 4. Write the task file

Use the output format and naming rules from [`references/task-file-format.md`](./references/task-file-format.md).

### 5. Validate task quality

Before finalizing, check that:
- every primary task produces observable, user-testable value;
- every development task is necessary, reviewable, and advances a named vertical slice;
- no slice is split merely by technical layer when it could remain a manageable end-to-end increment;
- every task has a clear working outcome;
- dependencies are coherent;
- parallelizable work is marked clearly;
- validation expectations are concrete;
- the overall set covers the spec without large gaps or overlap;
- the output stays practical for a human or agent to execute incrementally.

## Task Design Guidance

Good primary tasks usually align to boundaries like:
- expose a navigable page that a user can open;
- complete one end-to-end interaction and its validation;
- add one usable workflow while preserving existing behavior.

Use development tasks only when a vertical slice would otherwise be too large or risky. Good development-task boundaries include:
- establish a tested domain or data boundary needed by the slice;
- integrate one prerequisite while keeping the repository green;
- complete a substantial interaction subset that the final slice will expose.

Do not create development tasks by default. Do not split implementation and tests unless keeping them together is genuinely impractical.

Avoid tasks like:
- "update some imports"
- "fix leftovers"
- "misc cleanup"

unless they are the smallest safe unit needed to keep the repo working and green.

## Dependency Guidance

Use both ordering and dependency language.

Examples:
- a foundational refactor task may unblock multiple parallel migration tasks;
- test expansion may be bundled with a behavior task if separate testing work would leave the branch red;
- cleanup can be its own task only if earlier tasks still produce working code.

If a task is independent, say so explicitly.

## Output Expectations

A good result has these properties:
- the task file sits beside the spec;
- primary tasks deliver user-testable vertical slices;
- oversized slices are decomposed into only the necessary development tasks;
- tasks are executable in small, practical increments;
- each task can realistically end with working code;
- dependency and parallelism information is obvious;
- status tracking survives future updates;
- the task set is complete enough that a developer or agent can start work immediately.
