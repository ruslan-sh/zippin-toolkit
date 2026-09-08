## Context

See proposal.md for motivation. Existing Codex roles define Terra implementation and Sol review. Root AGENTS.md currently places routing inside the specification workflow.

## Goals / Non-Goals

Make one root policy apply to direct work and skill workflows. Keep the existing review and receipt guarantees. Do not build a runtime scheduler, change global user settings, or edit generated skills.

## Decisions

- Move routing to a top-level AGENTS.md section. Workflow documentation links to it instead of copying the full policy.
- Keep toolkit_implementer on Terra Medium and toolkit_reviewer on Sol Low. Add toolkit_small_task on Luna Low and toolkit_consultant on Astra Low. Each role carries its scope and escalation instructions.
- Prefer Sol Low for coordination, while respecting an explicit user model selection. Instructions cannot switch a running model.
- Pass compact task briefs. Do not spawn an agent just to answer a simple question. Workers return blockers to the coordinator and do not spawn more agents.
- If a new role is not yet discovered, use a generic agent with the same explicit model, reasoning, and role instructions when supported. Disclose the fallback. Otherwise stop that phase and request guidance. This avoids requiring a new session when equivalent routing is available.

## Risks / Trade-offs

- Model selection is an instruction policy, not runtime enforcement. Validate role settings and ask an independent reviewer to assess routing scenarios.
- Subscription savings depend on task length and retries. Do not promise a fixed saving or include prices that can become stale.
- Fresh roles may need a new Codex session. Document discovery and the equivalent fallback.

## Migration Plan

Land the root policy, role files, and workflow link together. Existing role names remain valid. Revert those scoped changes to restore the old routing policy.
