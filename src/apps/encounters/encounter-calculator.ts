import { Thresholds } from "./party-calculator";

export type EncounterRank = "Trivial" | "Low" | "Moderate" | "High" | "Deadly";

export interface MonsterInput {
    name: string;
    quantity: number;
    xp: number;
    url?: string;
}

export function isCompleteMonster(monster: MonsterInput): boolean {
    return Number.isInteger(monster.quantity) && monster.quantity > 0
        && Number.isInteger(monster.xp) && monster.xp >= 0
        && (!monster.url?.trim() || safeStatblockUrl(monster.url) !== null);
}

export function monsterTotal(monster: MonsterInput): number | null {
    return isCompleteMonster(monster) ? monster.quantity * monster.xp : null;
}

export function encounterTotal(monsters: readonly MonsterInput[]): number {
    return monsters.reduce((total, monster) => total + (monsterTotal(monster) ?? 0), 0);
}

export function rankEncounter(xp: number, thresholds: Thresholds): EncounterRank {
    if (xp >= thresholds.high * 1.2) return "Deadly";
    if (xp >= thresholds.high * 0.9) return "High";
    if (xp >= thresholds.moderate * 0.9) return "Moderate";
    if (xp > thresholds.low * 0.8) return "Low";
    return "Trivial";
}

export function safeStatblockUrl(value: string): string | null {
    if (value.trim() === "") return null;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
    } catch {
        return null;
    }
}
