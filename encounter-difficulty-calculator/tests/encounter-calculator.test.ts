import test from "node:test";
import assert from "node:assert/strict";

import { encounterTotal, monsterTotal, rankEncounter, safeStatblockUrl } from "../src/encounter-calculator";

test("validates monster rows and excludes incomplete totals", () => {
    assert.equal(monsterTotal({ name: "Goblin", quantity: 3, xp: 50 }), 150);
    assert.equal(monsterTotal({ name: "", quantity: 3, xp: 50 }), 150);
    assert.equal(monsterTotal({ name: "Goblin", quantity: 0, xp: 50 }), null);
    assert.equal(monsterTotal({ name: "Goblin", quantity: 100, xp: 50 }), 5000);
    assert.equal(monsterTotal({ name: "Goblin", quantity: 1, xp: -1 }), null);
    assert.equal(monsterTotal({ name: "Goblin", quantity: 1, xp: 1000000 }), 1000000);
    assert.equal(monsterTotal({ name: "Goblin", quantity: 1, xp: 50, url: "javascript:bad" }), null);
    assert.equal(encounterTotal([
        { name: "Goblin", quantity: 3, xp: 50 },
        { name: "Incomplete", quantity: Number.NaN, xp: 1000 },
        { name: "Harmless", quantity: 1, xp: 0 },
    ]), 150);
});

test("ranks every exact boundary and adjacent integer", () => {
    const thresholds = { low: 1000, moderate: 1700, high: 2100 };
    assert.equal(rankEncounter(800, thresholds), "Trivial");
    assert.equal(rankEncounter(801, thresholds), "Low");
    assert.equal(rankEncounter(1529, thresholds), "Low");
    assert.equal(rankEncounter(1530, thresholds), "Moderate");
    assert.equal(rankEncounter(1889, thresholds), "Moderate");
    assert.equal(rankEncounter(1890, thresholds), "High");
    assert.equal(rankEncounter(2519, thresholds), "High");
    assert.equal(rankEncounter(2520, thresholds), "Deadly");
});

test("compares integer XP against fractional ranking boundaries without rounding", () => {
    const thresholds = { low: 101, moderate: 101, high: 101 };
    assert.equal(rankEncounter(80, thresholds), "Trivial");
    assert.equal(rankEncounter(81, thresholds), "Low");
    assert.equal(rankEncounter(90, thresholds), "Low");
    assert.equal(rankEncounter(91, thresholds), "High");
    assert.equal(rankEncounter(121, thresholds), "High");
    assert.equal(rankEncounter(122, thresholds), "Deadly");
});

test("uses highest-rank-first classification for collapsed thresholds", () => {
    assert.equal(rankEncounter(0, { low: 0, moderate: 0, high: 0 }), "Deadly");
    assert.equal(rankEncounter(1, { low: 100, moderate: 50, high: 0 }), "Deadly");
});

test("allows only HTTP(S) statblock URLs", () => {
    assert.equal(safeStatblockUrl(""), null);
    assert.match(safeStatblockUrl("https://example.com/statblock") ?? "", /^https:/);
    assert.equal(safeStatblockUrl("javascript:alert(1)"), null);
    assert.equal(safeStatblockUrl("not a url"), null);
});
