import { initializeEncounterBuilder } from "./encounter-ui";
import { initializePartyCalculator } from "./party-ui";
import {
    createWorkspaceStateCoordinator,
    DEFAULT_WORKSPACE_STATE,
    WorkspaceState,
} from "./workspace-state";

export function initializeWorkspace(
    document: Document,
    initialState: WorkspaceState = DEFAULT_WORKSPACE_STATE,
    onStateChange: (state: WorkspaceState) => void = () => undefined,
): () => WorkspaceState {
    const coordinator = createWorkspaceStateCoordinator(initialState, onStateChange);
    const encounterBuilder = initializeEncounterBuilder(
        document,
        initialState.encounters,
        coordinator.updateEncounters,
    );
    initializePartyCalculator(
        document,
        encounterBuilder,
        initialState.party,
        coordinator.updateParty,
    );
    return coordinator.getState;
}
