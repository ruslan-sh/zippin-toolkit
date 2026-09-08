## Why

The budget routing policy names models but leaves task boundaries and worker completion subjective. Clear, observable rules reduce inconsistent routing, unnecessary escalation, and wasted subscription turns.

## What Changes

- Define observable boundaries for direct handling, Luna, Terra, and Astra.
- Make coordinator model mismatch handling non-blocking except where a phase requires exact constraints.
- Give implementation and consultation roles checkable completion conditions.
- Sharpen role descriptions so agent selection uses the intended boundary.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-routing`: Make budget routing and completion decisions observable and non-blocking.

## Impact

Root agent instructions, Codex role definitions, the model-routing specification, and the archived change record for PR 22 are affected. Application behavior and dependencies are unchanged.
