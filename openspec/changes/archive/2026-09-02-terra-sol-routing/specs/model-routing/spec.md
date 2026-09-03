## Purpose

Route implementation and independent review to defined models while preserving task ownership and the repository verification gate.

## ADDED Requirements

### Requirement: Automatic implementation routing
The workflow SHALL use Sol with low reasoning for coordination and design, and Terra with medium reasoning for approved implementation and routine fixes. The worker SHALL receive a bounded scope, ownership, acceptance criteria, artifact paths, and required checks.

#### Scenario: Approved implementation
- **WHEN** a selected change has approved implementation tasks
- **THEN** the coordinator delegates a coherent task scope to the Terra implementation role without requiring a manual model switch
- **AND** the coordinator does not repeat the worker's exploration or passing checks unless a concrete risk or the mandatory gate requires it

#### Scenario: Design issue during implementation
- **WHEN** the worker finds an unresolved design question or cannot resolve a failure within its scope
- **THEN** it reports the evidence to the Sol coordinator without broadening the task or selecting a stronger model

### Requirement: Independent Sol review
The workflow SHALL use a fresh read-only Sol reviewer with low reasoning for each verification iteration. The primary agent SHALL own remediation and retain the existing three-iteration limit, validation suite, and receipt requirements.

#### Scenario: Verification after implementation
- **WHEN** implementation is ready for the mandatory gate
- **THEN** a fresh Sol reviewer compares it with all change artifacts without editing files
- **AND** a clean review is followed by all required checks and fresh verification evidence

### Requirement: Explicit routing failures
The workflow SHALL report unavailable roles or a coordinator model mismatch and request user guidance rather than silently changing models or using self-review.

#### Scenario: Required role unavailable
- **WHEN** Codex cannot launch a required configured role
- **THEN** the coordinator reports the unavailable role and asks for user guidance before proceeding with that phase

#### Scenario: Coordinator uses another setting
- **WHEN** the coordinator is not running Sol with low reasoning
- **THEN** it reports the mismatch and requests the intended task setting before running the routed workflow
