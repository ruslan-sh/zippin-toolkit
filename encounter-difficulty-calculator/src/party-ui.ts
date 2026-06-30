import { calculatePartyThresholds, ModifierType } from "./party-calculator";

const RESULT_IDS = ["low", "moderate", "high"] as const;

function requiredElement<T extends HTMLElement>(document: Document, id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing calculator element: ${id}`);
    return element as T;
}

export function initializePartyCalculator(document: Document): void {
    const playerCount = requiredElement<HTMLInputElement>(document, "player-count");
    const partyLevel = requiredElement<HTMLInputElement>(document, "party-level");
    const modifierType = requiredElement<HTMLSelectElement>(document, "modifier-type");
    const modifierValue = requiredElement<HTMLInputElement>(document, "modifier-value");

    const update = (): void => {
        const count = Number(playerCount.value);
        const level = Number(partyLevel.value);
        const modifier = modifierValue.value === "" ? 0 : Number(modifierValue.value);
        const countValid = playerCount.value !== "" && Number.isInteger(count) && count > 0;
        const levelValid = partyLevel.value !== "" && Number.isInteger(level) && level >= 1 && level <= 20;
        const modifierValid = Number.isFinite(modifier);

        const setValidation = (input: HTMLElement, errorId: string, valid: boolean, message: string): void => {
            input.setAttribute("aria-invalid", String(!valid));
            requiredElement(document, errorId).textContent = valid ? "" : message;
        };
        setValidation(playerCount, "player-count-error", countValid, "Enter a positive whole number of players.");
        setValidation(partyLevel, "party-level-error", levelValid, "Select a party level from 1 through 20.");
        setValidation(modifierValue, "modifier-value-error", modifierValid, "Enter a numeric modifier.");

        if (!countValid || !levelValid || !modifierValid) {
            RESULT_IDS.forEach((difficulty) => {
                requiredElement(document, `${difficulty}-result`).textContent = "—";
            });
            return;
        }

        const thresholds = calculatePartyThresholds(
            count,
            level,
            modifierType.value as ModifierType,
            modifier,
        );
        RESULT_IDS.forEach((difficulty) => {
            requiredElement(document, `${difficulty}-result`).textContent =
                `${thresholds[difficulty].toLocaleString()} XP`;
        });
    };

    [playerCount, partyLevel, modifierType, modifierValue].forEach((control) => {
        control.addEventListener("input", update);
        control.addEventListener("change", update);
    });
    update();
}
