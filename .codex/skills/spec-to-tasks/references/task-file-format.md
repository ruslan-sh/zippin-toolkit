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

Each vertical delivery slice should be a separate primary task section. Task IDs may be simple and local to the file, such as:
- `Task 1`
- `Task 2`
- `Task 3`

If a slice is too large for one safe, reviewable increment, add development-task sections immediately after its primary task using IDs such as:
- `Dev Task 2.1`
- `Dev Task 2.2`

The primary task describes the user-testable delivery outcome. Its development tasks describe the implementation increments required to reach it. Do not add development tasks to a manageable slice.

Example shape:

```md
# Tasks For <spec title>

## Task 1: <short title>
Status: todo
Summary: <one short paragraph>
Scope:
- ...
- ...
Dependencies:
- Depends on: none
- Parallelizable: yes
- Parallel with: Task 3
Validation:
- ...
- ...
Definition of done:
- ...
- ...
```

Development tasks use the same required fields:

```md
## Dev Task 2.1: <short technical increment>
Status: todo
Summary: <concrete contribution to Task 2>
Scope:
- ...
Dependencies:
- Parent slice: Task 2
- Depends on: ...
- Parallelizable: no
- Parallel with: none
Validation:
- ...
Definition of done:
- The repository remains working and this increment clearly advances Task 2.
```

## Required Fields

Every task must include:
- `Status`
- `Summary`
- `Scope`
- `Dependencies`
- `Validation`
- `Definition of done`

Every development task must also identify its `Parent slice` under `Dependencies`.

Recommended dependency metadata inside `Dependencies`:
- `Depends on:`
- `Parallelizable:`
- `Parallel with:`

## Supported Statuses

Use only:
- `todo`
- `in-progress`
- `done`
- `blocked`

Keep the format stable so later updates can preserve status cleanly.
