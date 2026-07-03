# Archive Rules

Use this reference when moving an implemented spec into project documentation.

## Documentation Target

Prefer a focused document in `docs/` for enduring behavior.

Guidelines:
- update an existing doc if it already owns that behavior;
- create a new doc in `docs/` if the behavior deserves its own page;
- keep `README.md` as a brief index unless the repository already uses it for substantial behavior docs;
- write in present tense and describe actual behavior, constraints, and entry points.

## Archive Location

Move the spec from:
- `specs/<name>.md`

to:
- `specs/archive/YYYYMMDD-<name>.md`

Use a compact ISO-like date prefix in sortable form:
- `YYYYMMDD`
- example: `20260409-convert-logic-ts-to-class.md`

Put the date at the beginning of the archived filename so archive entries sort chronologically by default.

Preserve the original content unless there is a strong reason to trim it.

When choosing the archive date:
- for a newly archived spec, use the current archive date;
- for backfilling older archived specs, use git history to find a reasonable archival date and prefix the filename with that value.

Add a short archival note at the top stating that:
- the spec was archived after implementation; and
- the behavior now lives in project documentation.

Remove the active spec file from `specs/`.
If `specs/<name>.tasks.md` exists beside the active spec, delete that tasks file instead of archiving it.

After the archive file exists, check `specs/roadmap.md` for an entry whose slug
matches the original spec basename. If exactly one entry matches, remove it
from its `h3` slug heading through its content, without changing sibling
entries or the tool heading. If no entry matches, leave the roadmap unchanged.
If multiple entries match, do not remove any of them; ask the user which
tool-scoped entry belongs to the archived spec.

## Rewrite Rules

Translate planning material into documentation for the implemented system.

Include only what is useful for future readers:
- purpose and scope;
- supported user flows or behavior paths;
- important boundaries and edge cases;
- implementation notes only when they help maintenance;
- links or references to relevant modules.

Avoid:
- future-tense acceptance criteria;
- "current status" sections that merely say the docs are current;
- duplicated speculative design discussion that is no longer needed;
- feature-plan wording such as "proposed behavior", "validation plan", or "risks and mitigations" unless those sections still serve a real documentation purpose.
