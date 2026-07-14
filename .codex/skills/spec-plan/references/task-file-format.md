# Task File Format

Use this reference when writing or rewriting task files for a spec.

## Naming

Primary output:
- `specs/<name>.tasks.md`

If the generated task file would exceed about 500 lines, split it into:
- `specs/<name>.task.1.md`
- `specs/<name>.task.2.md`
- and so on

Prefer a single `.tasks.md` file unless size makes it difficult to navigate or update safely.

If split files are used, the first file should explain the sequence and list the remaining task files.

## Section Structure

Each executable section should be either a user-visible `Task N` or an internal
`Dev Task N`. Use one flat integer sequence across the whole file. For example:
- `Dev Task 1`
- `Task 2`
- `Task 3`

The label communicates the outcome type:
- `Task N` delivers observable, user-testable behavior.
- `Dev Task N` is a necessary green implementation increment that enables a
  later user-visible task.

If a slice is too large for one safe, reviewable increment, prefer flattening
its implementation increments into sections with consecutive integer IDs.
Do not emit a status-bearing umbrella task in addition to the tasks an agent
should execute, because both can be mistaken for executable work.
Never use decimal IDs such as `Dev Task 1.1` or parent/child task numbering.
Do not add a development task when the user-visible slice is already a safe,
reviewable increment.

Development tasks use the same required fields and the same flat sequence:

```md
## Dev Task 1: <short technical increment>
Status: todo
Summary: <concrete contribution to Task 2>
Scope:
- ...
Dependencies:
- Enables: Task 2
- Depends on: ...
- Parallelizable: no
- Parallel with: none
Validation:
- ...
Definition of done:
- The repository remains working and this increment clearly advances Task 2.
```

User-visible task example:

```md
# Tasks For <spec title>

## Task 2: <user-visible outcome enabled by Dev Task 1>
Status: todo
Summary: <one short paragraph>
Scope:
- ...
- ...
Dependencies:
- Depends on: Dev Task 1
- Parallelizable: yes
- Parallel with: Task 3
Validation:
- ...
- ...
Definition of done:
- ...
- ...
```

## Required Fields

Every task must include:
- `Status`
- `Summary`
- `Scope`
- `Dependencies`
- `Validation`
- `Definition of done`

Every development task must also identify the later user-visible task it
`Enables` under `Dependencies`.

Recommended dependency metadata inside `Dependencies`:
- `Depends on:`
- `Enables:` for development tasks
- `Parallelizable:`
- `Parallel with:`

## Supported Statuses

Use only:
- `todo`
- `in-progress`
- `done`
- `blocked`

Keep the format stable so later updates can preserve status cleanly.
