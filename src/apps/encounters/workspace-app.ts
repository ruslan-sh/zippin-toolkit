import { loadWorkspace, replaceWorkspace, saveWorkspace, WorkspaceStorage } from "./workspace-storage";
import { initializeWorkspaceExport, WorkspaceDownloadEnvironment } from "./workspace-export";
import { initializeWorkspaceImport, WorkspaceImportEnvironment } from "./workspace-import";
import { initializeWorkspace } from "./workspace-ui";
import { WorkspaceState } from "./workspace-state";

function browserStorage(): WorkspaceStorage | null {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export function initializePersistedWorkspace(
    document: Document,
    storage: WorkspaceStorage | null = browserStorage(),
    downloadEnvironment?: WorkspaceDownloadEnvironment,
    importEnvironment?: WorkspaceImportEnvironment,
): void {
    const status = document.getElementById("workspace-status");
    let announced = "";
    const announce = (message: string | null): void => {
        const next = message ?? "";
        if (next === announced) return;
        announced = next;
        if (status) status.textContent = next;
    };

    const restored = loadWorkspace(storage);
    announce(restored.error);
    let pendingSave: WorkspaceState | null = null;
    let saveScheduled = false;
    const scheduleSave = (state: WorkspaceState): void => {
        pendingSave = state;
        if (saveScheduled) return;
        saveScheduled = true;
        queueMicrotask(() => {
            saveScheduled = false;
            const nextState = pendingSave;
            pendingSave = null;
            if (nextState) announce(saveWorkspace(storage, nextState));
        });
    };
    const workspace = initializeWorkspace(document, restored.state, scheduleSave);
    initializeWorkspaceExport(document, workspace, announce, downloadEnvironment);
    initializeWorkspaceImport(document, workspace, workspace.replaceState, (state) => replaceWorkspace(storage, state), importEnvironment);
}
