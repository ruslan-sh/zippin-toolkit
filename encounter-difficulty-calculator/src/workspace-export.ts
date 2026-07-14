import { WorkspaceState } from "./workspace-state";
import { serializeWorkspaceYaml, WORKSPACE_EXPORT_FILENAME } from "./workspace-yaml";

export interface WorkspaceDownloadEnvironment {
    createObjectURL: (blob: Blob) => string;
    revokeObjectURL: (url: string) => void;
}

function browserDownloadEnvironment(): WorkspaceDownloadEnvironment {
    return {
        createObjectURL: (blob) => URL.createObjectURL(blob),
        revokeObjectURL: (url) => URL.revokeObjectURL(url),
    };
}

export function initializeWorkspaceExport(
    document: Document,
    getState: () => WorkspaceState,
    announce: (message: string | null) => void,
    environment: WorkspaceDownloadEnvironment = browserDownloadEnvironment(),
    serialize: (state: WorkspaceState) => string = serializeWorkspaceYaml,
): void {
    document.getElementById("export-workspace")?.addEventListener("click", () => {
        let url: string | null = null;
        try {
            const yaml = serialize(getState());
            url = environment.createObjectURL(new Blob([yaml], { type: "application/yaml;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = WORKSPACE_EXPORT_FILENAME;
            link.click();
        } catch {
            announce("The workspace backup could not be exported. Your workspace was not changed.");
        } finally {
            if (url) environment.revokeObjectURL(url);
        }
    });
}
