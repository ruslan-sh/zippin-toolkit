import test from "node:test";
import assert from "node:assert/strict";

import {
    loadWorkspace,
    saveWorkspace,
    WORKSPACE_STORAGE_KEY,
    WorkspaceStorage,
} from "../src/workspace-storage";
import { DEFAULT_WORKSPACE_STATE, WorkspaceState } from "../src/workspace-state";

class FakeStorage implements WorkspaceStorage {
    value: string | null = null;
    reads = 0;
    writes = 0;
    readError = false;
    writeError = false;

    getItem(key: string): string | null {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        this.reads += 1;
        if (this.readError) throw new Error("unavailable");
        return this.value;
    }

    setItem(key: string, value: string): void {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        this.writes += 1;
        if (this.writeError) throw new Error("quota");
        this.value = value;
    }
}

function unfinishedWorkspace(): WorkspaceState {
    return {
        version: 1,
        party: {
            groups: [{ playerCount: null, level: 99 }, { playerCount: 2, level: 1 }],
            modifierType: "flat",
            modifierValue: -25,
        },
        encounters: [{
            name: "Ruins",
            monsters: [
                { name: "Ogre", xp: 450, quantity: 2, url: "https://example.com/ogre" },
                { name: "Unknown", xp: null, quantity: 0, url: "" },
            ],
        }],
    };
}

test("uses defaults when storage is empty or unavailable", () => {
    const empty = new FakeStorage();
    assert.deepEqual(loadWorkspace(empty), { state: DEFAULT_WORKSPACE_STATE, error: null });
    assert.match(loadWorkspace(null).error ?? "", /unavailable/);

    empty.readError = true;
    const unreadable = loadWorkspace(empty);
    assert.deepEqual(unreadable.state, DEFAULT_WORKSPACE_STATE);
    assert.match(unreadable.error ?? "", /could not be read/);
});

test("restores valid ordered state including unfinished and UI-invalid values", () => {
    const storage = new FakeStorage();
    const state = unfinishedWorkspace();
    storage.value = JSON.stringify(state);

    assert.deepEqual(loadWorkspace(storage), { state, error: null });
});

test("preserves malformed and unsupported stored values while falling back", () => {
    for (const original of ["not json", JSON.stringify({ ...unfinishedWorkspace(), version: 2 })]) {
        const storage = new FakeStorage();
        storage.value = original;
        const result = loadWorkspace(storage);

        assert.deepEqual(result.state, DEFAULT_WORKSPACE_STATE);
        assert.match(result.error ?? "", /could not be restored/);
        assert.equal(storage.value, original);
        assert.equal(storage.writes, 0);
    }
});

test("saves complete snapshots and contains write and quota failures", () => {
    const storage = new FakeStorage();
    const state = unfinishedWorkspace();
    assert.equal(saveWorkspace(storage, state), null);
    assert.deepEqual(JSON.parse(storage.value ?? ""), state);

    storage.writeError = true;
    assert.match(saveWorkspace(storage, state) ?? "", /could not be saved/);
    assert.match(saveWorkspace(null, state) ?? "", /unavailable/);
});
