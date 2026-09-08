# OpenSpec Workflow

Use `specs/roadmap.yml` for unselected work. Add an item with
`npm run roadmap:add -- --area <area> --slug <slug> --description <text>` and
repeat `--prerequisite <slug>` for dependencies.

For Codex, use `$openspec-explore` for read-only discussion,
`$openspec-propose` for selection and proposal work, and
`$openspec-apply-change` for implementation. Selection must start with
`npm run opsx:select -- <slug>`. The active change is the ownership claim.

Apply the repository-wide [budget model routing](../AGENTS.md#budget-model-routing)
to this workflow. It defines the coordinator, small-task, implementation,
consultation, and independent-review roles. A new Codex session may be needed
to discover newly added roles; instructions cannot switch the active model.

For an OpenSpec change, the coordinator owns the active claim and gives each
delegated worker its ownership context, acceptance criteria, artifact paths,
and required checks. Workers do not claim tasks or recursively delegate.
Reuse a worker and its passing evidence unless a concrete risk or the mandatory
gate requires a repeat. Use a fresh read-only `toolkit_reviewer` for each
independent-review iteration; the coordinator owns remediation and retains the
three-iteration limit.

Use `$openspec-verify-change` after implementation. A fresh independent
read-only reviewer must report no actionable findings. Run every command in
the root `AGENTS.md` gate without waivers. Write concise `verification.md`
evidence, then run `npm run opsx:record-verification -- <slug>`. Any later
non-ignored edit makes the receipt stale.

Use `$openspec-archive-change` and `npm run opsx:archive -- <slug>`. The wrapper
requires complete artifacts and tasks, a fresh receipt, and strict validation.
It synchronizes delta specs, cleans roadmap dependencies, and rolls back
handled failures. Raw archive commands and skip options are unsupported.

Run `npm run openspec:update` only after a deliberate configuration or pinned
version change. Review the generated diff and run `npm run openspec:check`.
Do not edit generated skills by hand. For upgrades, change the exact version
and allowlist deliberately and run all workflow contract tests.

If `openspec/.lifecycle-lock` remains after interruption, do not delete it
because it is old. Read its operation and affected paths. Inspect and
deliberately finish or restore the roadmap, change, archive, specs, and receipt.
Run roadmap, workflow, strict OpenSpec, and diff validation before removing the
lock.

The retained `$spec-*` skills are legacy and may only complete the one-time
`migrate-agentic-flow-to-open-spec` bootstrap. They are unavailable for new
work.
