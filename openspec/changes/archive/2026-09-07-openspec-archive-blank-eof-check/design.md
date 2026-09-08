## Context

The archive wrapper deliberately runs plain `git diff --check` after the pinned OpenSpec CLI synchronizes specifications. The CLI emits two final LF bytes for a modified existing spec. Git classifies the second as `blank-at-eof`. Existing real-CLI tests cover a newly added spec only.

## Goals / Non-Goals

**Goals:** Permit the CLI's stable EOF formatting for canonical OpenSpec specs while preserving every other whitespace check and the wrapper's plain Git command.

**Non-Goals:** Normalize generated files, change application code, suppress trailing spaces, or weaken checks outside canonical OpenSpec specifications.

## Decisions

- Add a path-scoped `.gitattributes` whitespace rule for `openspec/specs/**/spec.md` that disables only `blank-at-eof`.
- Keep `git diff --check` unchanged so it continues to apply repository attributes and report other whitespace errors.
- Extend the pinned-CLI integration fixture with an existing specification and a MODIFIED requirement. Run the real archive with its real diff check and assert that synchronization preserves behavior and can include the CLI's EOF blank line.

## Risks / Trade-offs

- Contributors may add intentional or accidental EOF blank lines to canonical specs without an error. This matches the requested formatting preference and the pinned generator's output.
- A broad Markdown exception could hide unrelated errors. The attribute is limited to canonical `spec.md` files under `openspec/specs/`.
