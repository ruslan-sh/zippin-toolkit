export const CHALLENGE_RATINGS = [
    "0", "1/8", "1/4", "1/2",
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
] as const;

export type ChallengeRating = typeof CHALLENGE_RATINGS[number];

const STANDARD_XP_BY_CR: Readonly<Record<ChallengeRating, number>> = {
    "0": 10,
    "1/8": 25,
    "1/4": 50,
    "1/2": 100,
    "1": 200,
    "2": 450,
    "3": 700,
    "4": 1100,
    "5": 1800,
    "6": 2300,
    "7": 2900,
    "8": 3900,
    "9": 5000,
    "10": 5900,
    "11": 7200,
    "12": 8400,
    "13": 10000,
    "14": 11500,
    "15": 13000,
    "16": 15000,
    "17": 18000,
    "18": 20000,
    "19": 22000,
    "20": 25000,
    "21": 33000,
    "22": 41000,
    "23": 50000,
    "24": 62000,
    "25": 75000,
    "26": 90000,
    "27": 105000,
    "28": 120000,
    "29": 135000,
    "30": 155000,
};

const MINION_XP_BY_CR: Readonly<Record<ChallengeRating, number>> = {
    "0": 2,
    "1/8": 5,
    "1/4": 10,
    "1/2": 20,
    "1": 40,
    "2": 90,
    "3": 140,
    "4": 220,
    "5": 225,
    "6": 285,
    "7": 360,
    "8": 485,
    "9": 500,
    "10": 590,
    "11": 720,
    "12": 840,
    "13": 1000,
    "14": 1150,
    "15": 1300,
    "16": 1500,
    "17": 1800,
    "18": 2000,
    "19": 2200,
    "20": 2500,
    "21": 3300,
    "22": 4100,
    "23": 5000,
    "24": 6200,
    "25": 7500,
    "26": 9000,
    "27": 10500,
    "28": 12000,
    "29": 13500,
    "30": 15500,
};

export function isChallengeRating(value: unknown): value is ChallengeRating {
    return typeof value === "string" && (CHALLENGE_RATINGS as readonly string[]).indexOf(value) !== -1;
}

export function standardXpForChallengeRating(value: unknown): number | null {
    return isChallengeRating(value) ? STANDARD_XP_BY_CR[value] : null;
}

export function minionXpForChallengeRating(value: unknown): number | null {
    return isChallengeRating(value) ? MINION_XP_BY_CR[value] : null;
}
