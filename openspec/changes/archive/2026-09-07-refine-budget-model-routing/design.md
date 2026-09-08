## Context

See proposal.md for motivation. The current root map and four roles are compact, but their qualitative labels do not reliably separate adjacent task types.

## Goals / Non-Goals

Define observable routing signals and role completion without adding another routing layer. Do not encode token prices, task-size estimates, or a rigid file-count threshold.

## Decisions

- Use evidence and uncertainty as the routing boundary. Luna receives localized edits with settled behavior and known validation. Terra receives implementation judgment, coordinated edits, understood debugging, or test changes. Astra receives one unresolved diagnosis or material design trade-off after evidence is gathered.
- Handle questions and read-only checks directly because delegation would add context cost without implementation benefit.
- Report a coordinator mismatch in progress and continue through correctly configured roles. Stop only when a required phase cannot meet its exact model or execution constraints, such as an unavailable independent read-only reviewer.
- Put exhaustive completion conditions in each worker role. Implementation roles must satisfy every acceptance criterion and required check or return the exact blocker. The consultant must answer its one question, recommend an action, and account for remaining unknowns.
- Keep the detailed decision table in root AGENTS.md. Role descriptions state the positive boundary and important exclusion; role bodies retain operational constraints.

## Risks / Trade-offs

- Some judgment remains at task boundaries. Evidence, uncertainty, and required work give the coordinator consistent signals without brittle numeric thresholds.
- Longer completion wording adds a small context cost. The explicit stopping conditions reduce retries and premature completion.

## Migration Plan

Update root routing and the three affected worker role files. Keep role names and model assignments stable.
