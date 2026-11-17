import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../token-model";
import {
    decodeTokenMakerState,
    loadTokenMakerState,
    saveTokenMakerState,
    TOKEN_MAKER_DEFAULTS,
    TOKEN_SETTINGS_STORAGE_KEY,
} from "../token-settings-storage";
import type { StorageLike, TokenMakerState } from "../token-settings-storage";

class MemoryStorage implements StorageLike {
    values = new Map<string, string>();
    getItem(key: string): string | null { return this.values.get(key) ?? null; }
    setItem(key: string, value: string): void { this.values.set(key, value); }
}

test("settings and palette UI state round trip through versioned storage", () => {
    const state: TokenMakerState = {
        settings: { ...DEFAULT_SETTINGS, shape: "vertical-hex", lancerSize: "4A", frameColor: "#123abc", imageScale: 187, imageOffsetX: -42 },
        family: "Blue",
        shade: "700",
        color: "#123abc",
        hexDraft: "#123abc",
    };
    const storage = new MemoryStorage();

    saveTokenMakerState(state, storage);

    assert.deepEqual(loadTokenMakerState(storage), state);
    assert.equal(JSON.parse(storage.getItem(TOKEN_SETTINGS_STORAGE_KEY) ?? "{}").version, 1);

    const runtimeExtendedState = { ...state, settings: { ...state.settings, uploadedImage: "must not be persisted" } };
    saveTokenMakerState(runtimeExtendedState, storage);
    const stored = JSON.parse(storage.getItem(TOKEN_SETTINGS_STORAGE_KEY) ?? "{}") as { settings: Record<string, unknown> };
    assert.equal("uploadedImage" in stored.settings, false);
});

test("invalid enum, numeric, color, and obsolete stored data use safe defaults", () => {
    const invalidStates: unknown[] = [
        { version: 1, settings: { ...DEFAULT_SETTINGS, lancerSize: "5" }, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
        { version: 1, settings: { ...DEFAULT_SETTINGS, imageScale: Number.POSITIVE_INFINITY }, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
        { version: 1, settings: { ...DEFAULT_SETTINGS, imageOffsetX: Number.NaN }, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
        { version: 1, settings: { ...DEFAULT_SETTINGS, frameThickness: 49 }, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
        { version: 1, settings: { ...DEFAULT_SETTINGS, backgroundColor: "red" }, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
        { version: 0, settings: DEFAULT_SETTINGS, family: "Red", shade: "500", color: "#f44336", hexDraft: "#f44336" },
    ];
    for (const value of invalidStates) assert.deepEqual(decodeTokenMakerState(value), TOKEN_MAKER_DEFAULTS);
});

test("malformed JSON and unavailable or throwing storage fall back without throwing", () => {
    const malformed: StorageLike = { getItem: () => "{", setItem: () => undefined };
    const throwing: StorageLike = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } };
    assert.deepEqual(loadTokenMakerState(malformed), TOKEN_MAKER_DEFAULTS);
    assert.deepEqual(loadTokenMakerState(throwing), TOKEN_MAKER_DEFAULTS);
    assert.doesNotThrow(() => saveTokenMakerState(TOKEN_MAKER_DEFAULTS, throwing));
    assert.deepEqual(loadTokenMakerState(undefined), TOKEN_MAKER_DEFAULTS);
    assert.doesNotThrow(() => saveTokenMakerState(TOKEN_MAKER_DEFAULTS, undefined));
});
