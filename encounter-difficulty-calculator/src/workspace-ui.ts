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
): WorkspaceController {
    const coordinator = createWorkspaceStateCoordinator(initialState, onStateChange);
    const encounterBuilder = initializeEncounterBuilder(
        document,
        initialState.encounters,
        coordinator.updateEncounters,
    );
    const partyCalculator = initializePartyCalculator(
        document,
        encounterBuilder,
        initialState.party,
        coordinator.updateParty,
    );
    const controller = coordinator.getState as WorkspaceController;
    controller.replaceState = (state): void => {
        const previous = coordinator.getState();
        try {
            encounterBuilder.replaceState(state.encounters);
            partyCalculator.replaceState(state.party);
            coordinator.replaceState(state);
        } catch (error) {
            encounterBuilder.replaceState(previous.encounters);
            partyCalculator.replaceState(previous.party);
            coordinator.replaceState(previous);
            throw error;
        }
    };
    return controller;
}

export interface WorkspaceController {
    (): WorkspaceState;
    replaceState: (state: WorkspaceState) => void;
}
