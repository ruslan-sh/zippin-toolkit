import { stringify } from "yaml";

import { WorkspaceState } from "./workspace-state";

export const WORKSPACE_EXPORT_FILENAME = "encounter-workspace.yml";

export function serializeWorkspaceYaml(state: WorkspaceState): string {
    return stringify(state, {
        lineWidth: 0,
        sortMapEntries: false,
    });
}
