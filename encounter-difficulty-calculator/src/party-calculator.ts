export type Difficulty = "low" | "moderate" | "high";
export type Thresholds = Record<Difficulty, number>;
export type ModifierType = "percentage" | "flat";

export const XP_BY_LEVEL: readonly Thresholds[] = [
    { low: 50, moderate: 75, high: 100 },
    { low: 100, moderate: 150, high: 200 },
    { low: 150, moderate: 225, high: 400 },
    { low: 250, moderate: 375, high: 500 },
    { low: 500, moderate: 750, high: 1100 },
    { low: 600, moderate: 1000, high: 1400 },
    { low: 750, moderate: 1300, high: 1700 },
    { low: 1000, moderate: 1700, high: 2100 },
    { low: 1300, moderate: 2000, high: 2600 },
    { low: 1600, moderate: 2300, high: 3100 },
    { low: 1900, moderate: 2900, high: 4100 },
    { low: 2200, moderate: 3700, high: 4700 },
    { low: 2600, moderate: 4200, high: 5400 },
    { low: 2900, moderate: 4900, high: 6200 },
    { low: 3300, moderate: 5400, high: 7800 },
    { low: 3800, moderate: 6100, high: 9800 },
    { low: 4500, moderate: 7200, high: 11700 },
    { low: 5000, moderate: 8700, high: 14200 },
    { low: 5500, moderate: 10700, high: 17200 },
    { low: 6400, moderate: 13200, high: 22000 },
];

export function roundThreshold(value: number): number {
    const clamped = Math.max(0, value);
    const increment = clamped < 500 ? 25 : clamped < 1000 ? 50 : 100;
    return Math.floor(clamped / increment + 0.5) * increment;
}

export function calculatePartyThresholds(
    playerCount: number,
    level: number,
    modifierType: ModifierType = "percentage",
    modifier = 0,
): Thresholds {
    if (!Number.isInteger(playerCount) || playerCount < 1) {
        throw new RangeError("Player count must be a positive integer.");
    }
    if (!Number.isInteger(level) || level < 1 || level > XP_BY_LEVEL.length) {
        throw new RangeError("Party level must be an integer from 1 through 20.");
    }

    const perCharacter = XP_BY_LEVEL[level - 1];
    const adjust = (value: number): number => {
        const adjusted = modifierType === "percentage"
            ? value * (1 + modifier / 100)
            : value + modifier;
        return roundThreshold(adjusted);
    };

    return {
        low: adjust(perCharacter.low * playerCount),
        moderate: adjust(perCharacter.moderate * playerCount),
        high: adjust(perCharacter.high * playerCount),
    };
}
