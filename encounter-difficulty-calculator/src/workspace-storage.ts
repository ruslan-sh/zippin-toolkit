import {
    DEFAULT_WORKSPACE_STATE,
    isWorkspaceState,
    WorkspaceState,
} from "./workspace-state";

export const WORKSPACE_STORAGE_KEY = "zippin-toolkit.encounter-workspace.v1";

export interface WorkspaceStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

export type WorkspaceLoadResult =
    | { state: WorkspaceState; error: null }
    | { state: WorkspaceState; error: string };

export function loadWorkspace(storage: WorkspaceStorage | null): WorkspaceLoadResult {
    if (!storage) {
        return { state: DEFAULT_WORKSPACE_STATE, error: "Browser storage is unavailable. Changes cannot be saved." };
    }

    let serialized: string | null;
    try {
        serialized = storage.getItem(WORKSPACE_STORAGE_KEY);
    } catch {
        return { state: DEFAULT_WORKSPACE_STATE, error: "Saved workspace data could not be read. The default workspace was loaded." };
    }

    if (serialized === null) return { state: DEFAULT_WORKSPACE_STATE, error: null };

    try {
        const candidate: unknown = JSON.parse(serialized);
        if (isWorkspaceState(candidate)) return { state: candidate, error: null };
    } catch {
        // The original value is deliberately left untouched for recovery.
    }

    return { state: DEFAULT_WORKSPACE_STATE, error: "Saved workspace data could not be restored. The default workspace was loaded." };
}

export function saveWorkspace(storage: WorkspaceStorage | null, state: WorkspaceState): string | null {
    if (!storage) return "Browser storage is unavailable. Changes could not be saved.";
    try {
        storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(state));
        return null;
    } catch {
        return "Changes could not be saved to browser storage.";
    }
}
