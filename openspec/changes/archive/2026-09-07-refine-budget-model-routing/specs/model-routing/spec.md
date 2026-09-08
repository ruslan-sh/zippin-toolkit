## MODIFIED Requirements

### Requirement: Automatic implementation routing
The coordinator SHALL apply budget routing to all repository work, including direct requests without an OpenSpec skill. Sol with low reasoning SHALL be the default coordinator, and explicit user model choices SHALL take precedence. The coordinator SHALL handle questions and read-only checks directly. It SHALL use Luna with low reasoning for localized edits whose requested behavior, affected paths, and validation are already known. It SHALL use Terra with medium reasoning when implementation needs behavior decisions, debugging with a known cause, coordinated edits, or new or updated tests. Delegated work SHALL include scope, ownership, acceptance criteria, relevant paths, and required checks. Routing SHALL NOT authorize work beyond the user request or bypass the change lifecycle.

#### Scenario: Approved implementation
- **WHEN** approved work needs behavior judgment, coordinated edits, or test changes
- **THEN** the coordinator delegates a coherent scope to the Terra implementation role
- **AND** it reuses the worker and its passing evidence unless a concrete risk or the mandatory gate requires a repeat

#### Scenario: Small direct request
- **WHEN** a user requests a localized edit with settled behavior, known paths, and known validation
- **THEN** the coordinator selects the Luna role under the same ownership and scope rules

#### Scenario: Simple answer
- **WHEN** the coordinator can answer a question or complete a read-only check with the available context
- **THEN** it works directly without starting an agent solely for routing

#### Scenario: Design issue during implementation
- **WHEN** a worker finds unresolved behavior, an unknown cause, or work outside its scope
- **THEN** it returns evidence to the coordinator without recursive delegation or wider edits
- **AND** the coordinator routes implementation judgment to Terra or a difficult unresolved diagnosis or design decision to Astra

### Requirement: Explicit routing failures
The coordinator SHALL report an active-model mismatch in its next progress update when the user did not explicitly choose that model, while continuing authorized work through the configured roles. It SHALL stop only before a phase whose exact model or execution constraints cannot be satisfied. A callable generic agent MAY use the exact required model, reasoning, and role instructions as a disclosed fallback. The coordinator SHALL request guidance if no equivalent agent is available for a required phase. It SHALL NOT silently change models or use self-review. Instructions SHALL NOT claim to switch the active coordinator model.

#### Scenario: Required role unavailable
- **WHEN** a named role is unavailable but a generic agent can use its exact settings and constraints
- **THEN** the coordinator discloses and uses that equivalent agent
- **AND** otherwise requests guidance before the required phase

#### Scenario: Coordinator uses another setting
- **WHEN** the coordinator uses another model without an explicit user choice
- **THEN** it reports the mismatch without blocking work that configured roles can perform

#### Scenario: User selects another coordinator
- **WHEN** the user explicitly selects a coordinator other than Sol Low
- **THEN** the coordinator respects that choice and still applies budget routing to delegated work

### Requirement: Focused Astra consultation
The coordinator SHALL use Astra with low reasoning only when a diagnosis still has an unknown cause after relevant evidence is gathered, a design decision has unresolved material trade-offs, or the user explicitly requests Astra. A consultation SHALL receive one compact question, relevant paths, constraints, and prior evidence. It SHALL return an evidence-based diagnosis or decision, recommended next action, and remaining unknowns without edits or recursive delegation. It SHALL NOT become a routine extra review phase. A further consultation SHALL require a new unresolved question or new evidence.

#### Scenario: Difficult problem
- **WHEN** gathered evidence leaves a material diagnosis or design decision unresolved
- **THEN** the coordinator requests one bounded Astra consultation
- **AND** routes implementation of the result to the appropriate cheaper worker

#### Scenario: Routine review
- **WHEN** a normal change is ready for independent review
- **THEN** the workflow retains the fresh Sol Low reviewer and existing verification gate without adding Astra

## ADDED Requirements

### Requirement: Observable role completion
An implementation worker SHALL report completion only when every supplied acceptance criterion is satisfied and every required check passes. If either condition is unmet, it SHALL report the exact blocker and evidence. A consultation SHALL complete only after it answers the supplied question with evidence, recommends the next action, and identifies remaining unknowns or states that none remain.

#### Scenario: Implementation completes
- **WHEN** an implementation worker finishes its bounded scope
- **THEN** it reports each acceptance criterion as satisfied and each required check as passed

#### Scenario: Implementation cannot complete
- **WHEN** an acceptance criterion is unmet or a required check cannot pass
- **THEN** the worker reports the exact blocker and supporting evidence instead of claiming completion

#### Scenario: Consultation completes
- **WHEN** the consultant returns its result
- **THEN** it answers the supplied question with evidence, recommends the next action, and lists remaining unknowns or states that none remain
