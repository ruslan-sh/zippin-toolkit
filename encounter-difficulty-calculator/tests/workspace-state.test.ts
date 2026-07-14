import test from "node:test";
import assert from "node:assert/strict";

import {
    createWorkspaceStateCoordinator,
    DEFAULT_WORKSPACE_STATE,
    isWorkspaceNumber,
    isWorkspaceState,
    WorkspaceState,
} from "../src/workspace-state";

function workspace(overrides: Partial<WorkspaceState> = {}): WorkspaceState {
    return {
        ...DEFAULT_WORKSPACE_STATE,
        party: {
            ...DEFAULT_WORKSPACE_STATE.party,
            groups: DEFAULT_WORKSPACE_STATE.party.groups.map((group) => ({ ...group })),
        },
        encounters: DEFAULT_WORKSPACE_STATE.encounters.map((encounter) => ({
            ...encounter,
            monsters: encounter.monsters.map((monster) => ({ ...monster })),
        })),
        ...overrides,
    };
}

test("accepts the versioned workspace shape and UI-invalid numeric values", () => {
    const value = workspace({
        party: {
            groups: [{ playerCount: null, level: 21 }],
            modifierType: "flat",
            modifierValue: -10.5,
        },
        encounters: [{
            name: "Boss: finale",
            monsters: [{ name: "Ogre", xp: -1, quantity: 1.5, url: "https://example.com/ogre" }],
        }],
    });
    assert.equal(isWorkspaceState(value), true);
});

test("accepts only finite numbers or null for workspace numeric fields", () => {
    [null, 0, -1, 21, 1.5, 1e3].forEach((value) => {
        assert.equal(isWorkspaceNumber(value), true, String(value));
    });
    ["", "1", undefined, Number.NaN, Infinity, -Infinity].forEach((value) => {
        assert.equal(isWorkspaceNumber(value), false, String(value));
    });
});

test("rejects unsupported, ambiguous, and unsafe workspace structures", () => {
    assert.equal(isWorkspaceState({ ...workspace(), version: 2 }), false);
    assert.equal(isWorkspaceState({ ...workspace(), extra: true }), false);
    assert.equal(isWorkspaceState(workspace({ party: { ...DEFAULT_WORKSPACE_STATE.party, groups: [] } })), false);
    assert.equal(isWorkspaceState(workspace({
        party: { ...DEFAULT_WORKSPACE_STATE.party, modifierValue: "1" as never },
    })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Sanitized",
        monsters: [{ name: "", xp: Number.NaN, quantity: 1, url: "" }],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Unsafe",
        monsters: [{ name: "", xp: 1, quantity: 1, url: "javascript:alert(1)" }],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{ name: " ", monsters: [] }] })), false);
});

test("coordinates complete ordered state updates", () => {
    const updates: WorkspaceState[] = [];
    const coordinator = createWorkspaceStateCoordinator(workspace(), (state) => updates.push(state));
    coordinator.updateParty({
        groups: [{ playerCount: 2, level: 3 }],
        modifierType: "percentage",
        modifierValue: 10,
    });
    coordinator.updateEncounters([
        { name: "Second", monsters: [] },
        { name: "First", monsters: [{ name: "Goblin", xp: 50, quantity: 2, url: "" }] },
    ]);
    assert.deepEqual(coordinator.getState(), updates[1]);
    assert.equal(updates[1].party.modifierValue, 10);
    assert.deepEqual(updates[1].encounters.map((encounter) => encounter.name), ["Second", "First"]);
});
