## MODIFIED Requirements

### Requirement: Automatic implementation routing
The coordinator SHALL apply budget routing to all repository work, including direct requests without an OpenSpec skill. Sol with low reasoning SHALL be the default coordinator. Explicit user model choices SHALL take precedence. Small, clear edits SHALL use Luna with low reasoning; normal implementation SHALL use Terra with medium reasoning. Delegated work SHALL include scope, ownership, acceptance criteria, relevant paths, and required checks. Routing SHALL NOT authorize work beyond the user request or bypass the change lifecycle.

#### Scenario: Approved implementation
- **WHEN** approved work needs normal implementation
- **THEN** the coordinator delegates a coherent scope to the Terra implementation role
- **AND** it reuses the worker and its passing evidence unless a concrete risk or the mandatory gate requires a repeat

#### Scenario: Small direct request
- **WHEN** a user requests a small edit with clear acceptance criteria without invoking a skill
- **THEN** the coordinator selects the Luna role under the same ownership and scope rules

#### Scenario: Simple answer
- **WHEN** the coordinator can answer a simple question with the available context
- **THEN** it answers directly without starting an agent solely for routing

#### Scenario: Design issue during implementation
- **WHEN** a worker finds an unresolved design question or failure outside its scope
- **THEN** it returns evidence to the coordinator without recursive delegation or wider edits
- **AND** the coordinator routes a Luna task to Terra when it needs normal implementation judgment

### Requirement: Explicit routing failures
The coordinator SHALL report unavailable roles before the affected phase. A callable generic agent MAY use the exact required model, reasoning, and role instructions as a disclosed fallback. The coordinator SHALL request guidance if no equivalent agent is available. It SHALL NOT silently change models or use self-review. Instructions SHALL NOT claim to switch the active coordinator model.

#### Scenario: Required role unavailable
- **WHEN** a named role is unavailable but a generic agent can use its exact settings and instructions
- **THEN** the coordinator discloses and uses that equivalent agent
- **AND** otherwise requests guidance before that phase

#### Scenario: Coordinator uses another setting
- **WHEN** the user explicitly selects a coordinator other than Sol Low
- **THEN** the coordinator respects that choice and still applies budget routing to delegated work

## ADDED Requirements

### Requirement: Focused Astra consultation
The coordinator SHALL use Astra with low reasoning only for a difficult diagnosis or design decision that needs stronger reasoning, or when explicitly requested. A consultation SHALL receive a compact question, relevant paths, constraints, and prior evidence. It SHALL return a diagnosis or plan without edits or recursive delegation. It SHALL NOT become a routine extra review phase. A further consultation SHALL require a new unresolved question or new evidence.

#### Scenario: Difficult problem
- **WHEN** a problem needs stronger reasoning than routine coordination
- **THEN** the coordinator requests one bounded Astra consultation
- **AND** routes implementation of the resulting plan to the appropriate cheaper worker

#### Scenario: Routine review
- **WHEN** a normal change is ready for independent review
- **THEN** the workflow retains the fresh Sol Low reviewer and existing verification gate without adding Astra
