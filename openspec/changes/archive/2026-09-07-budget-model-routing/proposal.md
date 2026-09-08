## Why

The current routing policy ties model selection to OpenSpec and always assigns routine work to Terra. Apply budget routing to all repository work and reserve Astra for focused problems that need stronger reasoning.

## What Changes

- Put model selection in root AGENTS.md so it applies with or without a skill.
- Add Luna Low for small, clear tasks and Astra Low for focused consultation.
- Keep Terra Medium for normal implementation and Sol Low for coordination and independent review.
- Define escalation, compact handoffs, worker reuse, and explicit handling of unavailable roles.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-routing`: Apply budget model selection across repository work with bounded escalation.

## Impact

Root agent instructions, Codex role files, and contributor workflow documentation change. Generated OpenSpec skills, application code, dependencies, and the mandatory verification gate stay unchanged.
