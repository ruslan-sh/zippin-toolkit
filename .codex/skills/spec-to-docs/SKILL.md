---
name: spec-to-docs
description: Update current-state project documentation from an implemented spec, and archive the spec as cleanup when appropriate. Use when a spec in specs/ reflects shipped behavior that should now live in docs/ or other project documentation.
---

# Spec To Docs

## Overview

Use this skill when the user wants an implemented spec translated into current-state project documentation. The primary goal is to make docs reflect the shipped behavior; archiving the spec and deleting any sibling `*.tasks.md` tracker are cleanup steps to keep `specs/` focused on active plans.

Before editing, read:
- [`references/archive-rules.md`](./references/archive-rules.md) for archival location and rewrite rules
- [`references/verification.md`](./references/verification.md) for doc-change verification guidance

## When To Use

Trigger this skill for requests like:
- "update docs from this spec"
- "turn this implemented spec into docs"
- "make the docs reflect this implemented spec"
- "archive this spec"
- "move this implemented spec into docs"
- "make this behavior part of the project documentation"
- "turn this spec into current-state docs"

Use it only when the feature is already implemented or the user explicitly wants the docs to describe the current shipped behavior.

## Workflow

### 1. Confirm the implementation surface

Read the target spec and inspect the relevant code paths before editing docs.

Check:
- whether the described behavior is already implemented;
- where the behavior lives in code;
- which existing docs already cover adjacent behavior;
- whether `README.md` should stay minimal and link to docs instead of carrying feature detail.

If the implementation does not match the spec, document the real behavior rather than blindly copying the spec.

### 2. Choose the target documentation

Prefer a focused document in `docs/` for enduring behavior.

Use the documentation-target guidance in [`references/archive-rules.md`](./references/archive-rules.md).

### 3. Archive the spec

If appropriate, archive the spec according to [`references/archive-rules.md`](./references/archive-rules.md).

Treat archival as cleanup after the documentation is correctly updated, not as the primary goal of the skill.
If the spec has a sibling `*.tasks.md` file, delete it as part of the same cleanup.

After the spec has been successfully archived, remove its matching entry from
`specs/roadmap.md` if one exists. Do not remove the roadmap entry before the
archive is in place. Leave unrelated roadmap entries unchanged.

### 4. Rewrite as current-state documentation

Translate planning material into documentation for the implemented system.

Use the rewrite rules in [`references/archive-rules.md`](./references/archive-rules.md).

### 5. Keep diffs focused

Do not refactor unrelated docs. Limit the change to:
- the target doc in `docs/`;
- the archived spec when archival is part of the requested or sensible cleanup;
- deletion of the sibling `*.tasks.md` file when present;
- removal of the archived spec's matching roadmap entry when present;
- small README link updates if needed.

### 6. Verify the result

Run the verification described in [`references/verification.md`](./references/verification.md).

## Output Expectations

A good result has these properties:
- project docs describe the behavior as implemented, not proposed;
- the documentation is easier to find than the spec;
- the spec is archived under `specs/archive/` when that cleanup is appropriate;
- any sibling `*.tasks.md` tracker is removed when the spec is archived;
- the matching roadmap entry is removed after archival when present;
- the final summary calls out files changed, behavior impact, and verification performed.
