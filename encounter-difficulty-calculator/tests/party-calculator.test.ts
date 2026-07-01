import test from "node:test";
import assert from "node:assert/strict";

import { calculatePartyThresholds, roundThreshold, XP_BY_LEVEL } from "../src/party-calculator";

const expectedRows = [
    [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500],
    [500, 750, 1100], [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100],
    [1300, 2000, 2600], [1600, 2300, 3100], [1900, 2900, 4100], [2200, 3700, 4700],
    [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800], [3800, 6100, 9800],
    [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000],
];

test("contains every supplied per-character XP row", () => {
    assert.deepEqual(XP_BY_LEVEL.map(({ low, moderate, high }) => [low, moderate, high]), expectedRows);
});

test("calculates thresholds for representative party sizes", () => {
    assert.deepEqual(calculatePartyThresholds(4, 5), { low: 2000, moderate: 3000, high: 4400 });
    assert.deepEqual(calculatePartyThresholds(2, 8), { low: 2000, moderate: 3400, high: 4200 });
});

test("applies percentage and flat modifiers independently", () => {
    assert.deepEqual(calculatePartyThresholds(4, 5, "percentage", 10), { low: 2200, moderate: 3300, high: 4800 });
    assert.deepEqual(calculatePartyThresholds(4, 5, "flat", -500), { low: 1500, moderate: 2500, high: 3900 });
});

test("clamps negative results to zero", () => {
    assert.deepEqual(calculatePartyThresholds(1, 1, "flat", -1000), { low: 0, moderate: 0, high: 0 });
});

test("rounds each tier, exactly 1,000, and halfway ties upward", () => {
    assert.equal(roundThreshold(487.5), 500);
    assert.equal(roundThreshold(525), 550);
    assert.equal(roundThreshold(975), 1000);
    assert.equal(roundThreshold(1000), 1000);
    assert.equal(roundThreshold(1050), 1100);
});

test("rejects invalid party inputs", () => {
    assert.throws(() => calculatePartyThresholds(0, 1), RangeError);
    assert.throws(() => calculatePartyThresholds(1.5, 1), RangeError);
    assert.throws(() => calculatePartyThresholds(1, 21), RangeError);
});
