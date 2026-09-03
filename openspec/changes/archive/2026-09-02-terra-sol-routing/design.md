## Context

See proposal.md for the problem. OpenSpec skills are generated. Root AGENTS.md owns repository workflow rules. Codex supports project agent files with explicit model and reasoning settings.

## Goals / Non-Goals

Use automatic delegation within the current task. Keep the coordinator on Sol/low and preserve the existing verification gate. Do not change generated skills, personal settings, application code, or the legacy reviewer.

## Decisions

- Add `toolkit_implementer` with `gpt-5.6-terra` and `medium`, and `toolkit_reviewer` with `gpt-5.6-sol` and `low`. The reviewer is read-only; the worker inherits the caller's permissions.
- Keep model values in the agent files. Root instructions define when to use the roles. Documentation explains the workflow without creating a second policy.
- Delegate a coherent approved task scope, not each command. Provide ownership, artifact paths, acceptance criteria, and validation needs. Reuse the implementation worker for related work and avoid duplicate exploration.
- The coordinator handles design questions and difficult debugging at Sol/low. The primary agent owns fixes raised by independent verification. Each review iteration uses a fresh reviewer.
- Instructions cannot switch the active coordinator model. If the coordinator is not Sol/low, report the mismatch and request the correct task setting. Never silently use a different model when a required role is unavailable. Ask for user guidance, with no self-review fallback.
- Keep this as instruction and configuration changes. Use real TOML parsing and runtime role probes rather than tests that match prose. An explicit-model probe is not proof of named-role discovery; report these separately if the running session cannot reload roles.

## Risks / Trade-offs

- Extra coordination can reduce savings. Give workers concise scopes and use their fresh check results where the gate permits.
- New roles may require a new Codex session. Record whether named-role discovery was tested and clearly report any runtime limitation.
- Instructions are not a runtime enforcement layer. Agent settings select models; the existing gate still controls verification.

## Migration Plan

Add the two project agents and the root routing policy, then update workflow documentation. Validate the files and exercise available runtime routing. Run the existing independent gate. Revert these scoped files to remove the routing policy.
