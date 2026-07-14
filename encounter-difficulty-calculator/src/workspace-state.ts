import { safeStatblockUrl } from "./encounter-calculator";
import { ModifierType } from "./party-calculator";

export const WORKSPACE_VERSION = 1 as const;

export type WorkspaceNumber = number | null;

export interface PartyGroupState {
    playerCount: WorkspaceNumber;
    level: WorkspaceNumber;
}

export interface PartyState {
    groups: PartyGroupState[];
    modifierType: ModifierType;
    modifierValue: WorkspaceNumber;
}

export interface MonsterState {
    name: string;
    xp: WorkspaceNumber;
    quantity: WorkspaceNumber;
    url: string;
}

export interface EncounterState {
    name: string;
    monsters: MonsterState[];
}

export interface WorkspaceState {
    version: typeof WORKSPACE_VERSION;
    party: PartyState;
    encounters: EncounterState[];
}

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
    version: WORKSPACE_VERSION,
    party: {
        groups: [{ playerCount: 4, level: 5 }],
        modifierType: "percentage",
        modifierValue: 0,
    },
    encounters: [{
        name: "Encounter 1",
        monsters: [{ name: "", xp: null, quantity: 1, url: "" }],
    }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
    const actual = Object.keys(value).sort();
    const expected = [...keys].sort();
    return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isWorkspaceNumber(value: unknown): value is WorkspaceNumber {
    return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isPartyGroupState(value: unknown): value is PartyGroupState {
    return isRecord(value)
        && hasExactKeys(value, ["playerCount", "level"])
        && isWorkspaceNumber(value.playerCount)
        && isWorkspaceNumber(value.level);
}

function isPartyState(value: unknown): value is PartyState {
    return isRecord(value)
        && hasExactKeys(value, ["groups", "modifierType", "modifierValue"])
        && Array.isArray(value.groups)
        && value.groups.length > 0
        && value.groups.every(isPartyGroupState)
        && (value.modifierType === "percentage" || value.modifierType === "flat")
        && isWorkspaceNumber(value.modifierValue);
}

function isMonsterState(value: unknown): value is MonsterState {
    return isRecord(value)
        && hasExactKeys(value, ["name", "xp", "quantity", "url"])
        && isString(value.name)
        && isWorkspaceNumber(value.xp)
        && isWorkspaceNumber(value.quantity)
        && isString(value.url)
        && (!value.url.trim() || safeStatblockUrl(value.url) !== null);
}

function isEncounterState(value: unknown): value is EncounterState {
    return isRecord(value)
        && hasExactKeys(value, ["name", "monsters"])
        && isString(value.name)
        && value.name.trim().length > 0
        && Array.isArray(value.monsters)
        && value.monsters.every(isMonsterState);
}

export function isWorkspaceState(value: unknown): value is WorkspaceState {
    return isRecord(value)
        && hasExactKeys(value, ["version", "party", "encounters"])
        && value.version === WORKSPACE_VERSION
        && isPartyState(value.party)
        && Array.isArray(value.encounters)
        && value.encounters.every(isEncounterState);
}

export interface WorkspaceStateCoordinator {
    getState: () => WorkspaceState;
    replaceState: (state: WorkspaceState) => void;
    updateParty: (party: PartyState) => void;
    updateEncounters: (encounters: EncounterState[]) => void;
}

export function createWorkspaceStateCoordinator(
    initialState: WorkspaceState,
    onStateChange: (state: WorkspaceState) => void = () => undefined,
): WorkspaceStateCoordinator {
    let state = initialState;
    const publish = (nextState: WorkspaceState): void => {
        state = nextState;
        onStateChange(state);
    };
    return {
        getState: () => state,
        replaceState: (nextState) => { state = nextState; },
        updateParty: (party) => publish({ ...state, party }),
        updateEncounters: (encounters) => publish({ ...state, encounters }),
    };
}
