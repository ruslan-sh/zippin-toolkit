import test from "node:test";
import assert from "node:assert/strict";

import {
    createWorkspaceStateCoordinator,
    DEFAULT_WORKSPACE_STATE,
    isWorkspaceNumber,
    isWorkspaceState,
    migrateWorkspaceState,
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
            monsters: [{ name: "Ogre", cr: "4", xp: -1, quantity: 1.5, url: "https://example.com/ogre", minion: true }],
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
    assert.equal(isWorkspaceState({ ...workspace(), version: 3 }), false);
    assert.equal(isWorkspaceState({ ...workspace(), extra: true }), false);
    assert.equal(isWorkspaceState(workspace({ party: { ...DEFAULT_WORKSPACE_STATE.party, groups: [] } })), false);
    assert.equal(isWorkspaceState(workspace({
        party: { ...DEFAULT_WORKSPACE_STATE.party, modifierValue: "1" as never },
    })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Sanitized",
        monsters: [{ name: "", cr: null, xp: Number.NaN, quantity: 1, url: "", minion: false }],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Unsafe",
        monsters: [{ name: "", cr: null, xp: 1, quantity: 1, url: "javascript:alert(1)", minion: false }],
    }] })), false);
    const monster = workspace().encounters[0].monsters[0];
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Bad CR", monsters: [{ ...monster, cr: "1.5" as never }],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Bad Minion", monsters: [{ ...monster, minion: "false" as never }],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{
        name: "Unknown Field", monsters: [{ ...monster, extra: true } as never],
    }] })), false);
    assert.equal(isWorkspaceState(workspace({ encounters: [{ name: " ", monsters: [] }] })), false);

    const inheritedProperty = workspace();
    Object.setPrototypeOf(inheritedProperty, { extra: true });
    assert.equal(isWorkspaceState(inheritedProperty), false);
});

test("migrates an exact version-1 workspace without changing source XP", () => {
    const migrated = migrateWorkspaceState({
        version: 1,
        party: { groups: [{ playerCount: 4, level: 5 }], modifierType: "percentage", modifierValue: 0 },
        encounters: [{
            name: "Legacy",
            monsters: [{ name: "Ogre", xp: 450, quantity: 2, url: "" }],
        }],
    });
    assert.deepEqual(migrated?.encounters[0].monsters[0], {
        name: "Ogre", xp: 450, quantity: 2, url: "", cr: null, minion: false,
    });
    assert.equal(migrated?.version, 2);
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
        { name: "First", monsters: [{ name: "Goblin", cr: "1/4", xp: 50, quantity: 2, url: "", minion: false }] },
    ]);
    assert.deepEqual(coordinator.getState(), updates[1]);
    assert.equal(updates[1].party.modifierValue, 10);
    assert.deepEqual(updates[1].encounters.map((encounter) => encounter.name), ["Second", "First"]);
});
