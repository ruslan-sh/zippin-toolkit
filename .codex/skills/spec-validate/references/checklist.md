# Checklist

Use this checklist while reviewing:

## Inputs

- Confirm the target spec path.
- Check for sibling `*.tasks.md`.
- Check `AGENTS.md` for repo-specific validation rules or environment notes.
- Check relevant git worktree changes when the request is about current implementation progress or uncommitted work.

## Spec extraction

- What is the promised end state?
- What are the acceptance criteria?
- What validations are required?
- What is intentionally out of scope?

## Implementation comparison

- Which files changed in the worktree for this feature or task?
- Which acceptance criteria are clearly met?
- Which are only partially met?
- Which are not implemented?
- Are there behavior-preserving temporary choices that the spec already allows?

## Task tracker comparison

- Are `done` tasks actually complete in code?
- Did implementation spill into later tasks?
- Is any task marked `todo` even though its work is already complete?

## Document update decision

- If code is incomplete but the spec still describes the intended end state, do not update the spec.
- If task statuses no longer reflect repo state, update the tasks file.
- If the implemented product intentionally diverged from the spec, update the spec.
- If the spec and implementation differ only because work is still in progress, report the gap but do not rewrite the spec.
