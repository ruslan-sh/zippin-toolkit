## Why

The current workflow uses the coordinator model for most work. Explicit worker and reviewer roles let routine implementation use less usage while keeping design and independent review on Sol.

## What Changes

- Add project agents for Terra implementation and read-only Sol review.
- Define automatic delegation, task ownership, failure handling, and the Sol/low ceiling in root contributor instructions.
- Document the workflow and check the configured model settings.

## Capabilities

### New Capabilities

- `model-routing`: Automatic model selection for implementation and independent review.

### Modified Capabilities

None.

## Impact

Project agent configuration, root AGENTS.md, workflow documentation, and workflow checks. Generated OpenSpec skills and application behavior remain unchanged.
