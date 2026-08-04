# Contribution Conventions

Use the repository [OpenSpec workflow](./openspec-workflow.md) for roadmap
intake, proposal, implementation, verification, and archival.

## Branch Names

Use lowercase kebab-case branch names in this format:

```text
<type>/<short-kebab-case-description>
```

Examples:

```text
feat/monster-cr-mode-support
fix/calendar-leap-day-selection
docs/contribution-conventions
chore/update-typescript
```

Use one of these types:

- `feat`: user-visible functionality
- `fix`: defect correction
- `docs`: documentation-only work
- `refactor`: internal restructuring without behavior changes
- `test`: test-only work
- `build`: build system or dependencies
- `ci`: continuous-integration configuration
- `chore`: repository maintenance

Keep the description concise and specific. Do not use spaces, underscores,
generic descriptions, contributor names, or coding-tool names.

Place an issue identifier after the type when applicable:

```text
fix/123-calendar-leap-day-selection
```

Coding tools and automation use the same convention.

## Commit Messages

Use the Conventional Commits subject format:

```text
<type>(<optional-scope>): <summary>
```

Examples:

```text
feat(encounter): support monster challenge ratings
fix(calendar): preserve leap-day selection
docs(contributing): define branch and commit conventions
chore(build): update TypeScript
```

Use the same types as branch names. Additional standard types such as `perf`
and `revert` may be used when applicable.

Use a scope when it adds useful context. Preferred scopes are:

- `app`: landing page
- `calendar`: Fantasy Calendar
- `encounter`: Encounter Difficulty Calculator
- `shared`: cross-tool source
- `specs`: specifications and roadmap
- `agents`: contributor instructions and coding-tool skills
- `build`: shared build configuration

Write the summary in imperative present tense, start with a lowercase letter,
omit the final period, and keep the subject to 72 characters or fewer when
practical.

Use a body for relevant motivation, tradeoffs, or migration behavior. Mark
breaking changes with `!` and a `BREAKING CHANGE:` footer:

```text
feat(encounter)!: migrate workspace schema to version 2

BREAKING CHANGE: version 1 exports are no longer produced.
```

Keep each commit focused on one coherent change. Do not mix unrelated cleanup
into feature or fix commits.
