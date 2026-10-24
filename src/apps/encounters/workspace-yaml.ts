import { parseDocument, stringify } from "yaml";

import { migrateWorkspaceState, WorkspaceState } from "./workspace-state";

export const WORKSPACE_EXPORT_FILENAME = "encounter-workspace.yml";

export function serializeWorkspaceYaml(state: WorkspaceState): string {
    return stringify(state, {
        lineWidth: 0,
        sortMapEntries: false,
    });
}

export function parseWorkspaceYaml(source: string): WorkspaceState {
    const document = parseDocument(source, { customTags: [], schema: "core", uniqueKeys: true });
    if (document.errors.length || document.warnings.length) throw new Error("The backup is not valid YAML.");
    let candidate: unknown;
    try {
        candidate = document.toJS({ maxAliasCount: 0 });
    } catch {
        throw new Error("The backup is not valid YAML.");
    }
    const migrated = migrateWorkspaceState(candidate);
    if (!migrated) throw new Error("The backup does not use the supported workspace format.");
    return migrated;
}
