## Why

The pinned OpenSpec CLI adds a blank line at EOF when it updates an existing specification. The repository archive wrapper then rejects the valid generated output through Git's default whitespace policy, blocking otherwise verified changes.

## What Changes

- Permit EOF blank lines in canonical OpenSpec specification Markdown files.
- Keep all other `git diff --check` whitespace validation active.
- Exercise a modified existing specification with the real pinned CLI in the archive integration test.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This changes repository tooling policy and test coverage, not product behavior.

## Impact

The repository `.gitattributes` policy and OpenSpec archive integration tests. No runtime code or dependencies change.
