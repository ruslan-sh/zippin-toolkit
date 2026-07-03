# Update Rules

Use this reference when resyncing tasks from an updated spec.

## Preservation Rules

When an existing task still maps cleanly to the updated spec:
- preserve the task ID;
- preserve `Status`;
- preserve useful manual notes where possible;
- update wording, scope, dependencies, and validation details to match the new spec.

When a task no longer maps cleanly:
- replace it only if keeping it would be misleading;
- add new tasks for newly introduced work;
- remove or rewrite obsolete tasks clearly.

Keep completed tasks visible unless the user explicitly asks for cleanup or archival.

## Reordering

If the updated spec significantly changes the plan:
- reorder tasks as needed;
- preserve existing statuses for matched tasks;
- add a short note at the top of the regenerated file explaining that the task graph changed.

## Goal

Do not blindly overwrite progress tracking. Keep the task files useful as both an execution plan and an active status board.
