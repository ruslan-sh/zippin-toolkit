import test from "node:test";
import assert from "node:assert/strict";

import {
    CHALLENGE_RATINGS,
    isChallengeRating,
    minionXpForChallengeRating,
    standardXpForChallengeRating,
} from "../src/challenge-rating-calculator";

const expectedStandardXp = [
    10, 25, 50, 100,
    200, 450, 700, 1100, 1800, 2300, 2900, 3900, 5000, 5900,
    7200, 8400, 10000, 11500, 13000, 15000, 18000, 20000, 22000, 25000,
    33000, 41000, 50000, 62000, 75000, 90000, 105000, 120000, 135000, 155000,
];

const expectedMinionXp = [
    2, 5, 10, 20,
    40, 90, 140, 220, 225, 285, 360, 485, 500, 590,
    720, 840, 1000, 1150, 1300, 1500, 1800, 2000, 2200, 2500,
    3300, 4100, 5000, 6200, 7500, 9000, 10500, 12000, 13500, 15500,
];

test("exposes every canonical challenge rating in order", () => {
    assert.deepEqual(CHALLENGE_RATINGS, [
        "0", "1/8", "1/4", "1/2",
        ...Array.from({ length: 30 }, (_, index) => String(index + 1)),
    ]);
});

test("maps every canonical challenge rating to standard XP", () => {
    assert.deepEqual(CHALLENGE_RATINGS.map(standardXpForChallengeRating), expectedStandardXp);
});

test("maps every canonical challenge rating to Minion XP", () => {
    assert.deepEqual(CHALLENGE_RATINGS.map(minionXpForChallengeRating), expectedMinionXp);
});

test("does not map blank or unsupported challenge ratings", () => {
    for (const value of [null, undefined, "", "1/3", "31", 1]) {
        assert.equal(isChallengeRating(value), false);
        assert.equal(standardXpForChallengeRating(value), null);
        assert.equal(minionXpForChallengeRating(value), null);
    }
});
