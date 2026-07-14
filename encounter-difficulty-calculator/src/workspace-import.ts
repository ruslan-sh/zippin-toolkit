import { WorkspaceState } from "./workspace-state";
import { parseWorkspaceYaml } from "./workspace-yaml";

export interface WorkspaceImportEnvironment {
    confirm: (message: string) => boolean;
    readFile: (file: File) => Promise<string>;
}

function browserImportEnvironment(document: Document): WorkspaceImportEnvironment {
    return {
        confirm: (message) => document.defaultView?.confirm(message) ?? false,
        readFile: (file) => file.text(),
    };
}

export function initializeWorkspaceImport(
    document: Document,
    getState: () => WorkspaceState,
    replaceState: (state: WorkspaceState) => void,
    persist: (state: WorkspaceState) => string | null,
    announce: (message: string | null) => void,
    environment: WorkspaceImportEnvironment = browserImportEnvironment(document),
    parse: (source: string) => WorkspaceState = parseWorkspaceYaml,
): void {
    const input = document.getElementById("import-workspace") as HTMLInputElement | null;
    input?.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        let candidate: WorkspaceState;
        try {
            candidate = parse(await environment.readFile(file));
        } catch (error) {
            announce(error instanceof Error ? error.message : "The workspace backup could not be read.");
            return;
        }
        if (!environment.confirm("Importing this backup will permanently replace the current browser workspace. Continue?")) {
            announce("Import canceled. Your workspace was not changed.");
            return;
        }
        const previous = getState();
        try {
            replaceState(candidate);
            const saveError = persist(candidate);
            if (saveError) throw new Error(saveError);
        } catch (error) {
            try { replaceState(previous); } catch { /* Keep the original actionable error. */ }
            announce(error instanceof Error ? `${error.message} Your workspace was not changed.` : "The backup could not be imported. Your workspace was not changed.");
            return;
        }
        announce("Workspace imported successfully.");
    });
}
