import { loadWorkspace, saveWorkspace, WorkspaceStorage } from "./workspace-storage";
import { initializeWorkspaceExport, WorkspaceDownloadEnvironment } from "./workspace-export";
import { initializeWorkspace } from "./workspace-ui";

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
    const getState = initializeWorkspace(document, restored.state, (state) => {
        announce(saveWorkspace(storage, state));
    });
    initializeWorkspaceExport(document, getState, announce, downloadEnvironment);
}
