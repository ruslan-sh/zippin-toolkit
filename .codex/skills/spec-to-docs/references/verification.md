# Verification

Use this reference after archiving a spec into docs.

## Lightweight Checks

Run verification suitable for documentation-focused changes:
- inspect the final diff;
- confirm the archive path is correct;
- confirm any sibling `*.tasks.md` file was removed when archiving the spec;
- confirm the matching roadmap entry was removed after archival, or confirm no matching entry existed;
- confirm links and references point to the right docs;
- scan the updated docs for stale planning language or awkward headings introduced by the rewrite.

## Reporting

If no code changed, it is usually sufficient to report that build, tests, and lint were not run because the change was documentation-only.
