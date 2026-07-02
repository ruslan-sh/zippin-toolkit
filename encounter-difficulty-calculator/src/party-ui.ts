import { calculateMixedPartyThresholds, ModifierType, PartyGroup, Thresholds } from "./party-calculator";

const RESULT_IDS = ["low", "moderate", "high"] as const;

function requiredElement<T extends HTMLElement>(document: Document, id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing calculator element: ${id}`);
    return element as T;
}

function createPartyRow(document: Document, id: number): HTMLElement {
    const row = document.createElement("div");
    row.className = "party-row";
    row.dataset.partyRow = String(id);

    const controls = document.createElement("div");
    controls.className = "party-row-controls";

    const addInput = (kind: "player-count" | "party-level", labelText: string): void => {
        const inputId = `${kind}-${id}`;
        const errorId = `${kind}-error-${id}`;
        const label = document.createElement("label");
        label.className = "visually-hidden";
        label.htmlFor = inputId;
        label.textContent = labelText;

        const input = document.createElement("input");
        input.id = inputId;
        input.type = "number";
        input.min = "1";
        input.step = "1";
        input.value = "1";
        input.setAttribute("aria-describedby", errorId);
        if (kind === "party-level") input.max = "20";
        controls.append(label);
        controls.append(input);
    };

    addInput("player-count", `Players in group ${id}`);
    addInput("party-level", `Level for group ${id}`);

    const remove = document.createElement("button");
    remove.className = "remove-party-row";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove party group ${id}`);
    const icon = document.createElement("span");
    icon.className = "material-icons";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "delete";
    remove.append(icon);
    controls.append(remove);
    row.append(controls);

    (["player-count", "party-level"] as const).forEach((kind) => {
        const error = document.createElement("p");
        error.id = `${kind}-error-${id}`;
        error.className = "error";
        error.setAttribute("aria-live", "polite");
        row.append(error);
    });
    return row;
}

export function initializePartyCalculator(
    document: Document,
    updateEncounter: (thresholds: Thresholds | null) => void = () => undefined,
): void {
    const rows = requiredElement<HTMLElement>(document, "party-rows");
    const addButton = requiredElement<HTMLButtonElement>(document, "add-party-row");
    const modifierType = requiredElement<HTMLSelectElement>(document, "modifier-type");
    const modifierValue = requiredElement<HTMLInputElement>(document, "modifier-value");
    let nextRowId = 2;

    const setValidation = (input: HTMLElement, errorId: string, valid: boolean, message: string): void => {
        input.setAttribute("aria-invalid", String(!valid));
        requiredElement(document, errorId).textContent = valid ? "" : message;
    };

    const updateRemoveButtons = (): void => {
        const buttons = rows.querySelectorAll<HTMLButtonElement>(".remove-party-row");
        const partyRows = rows.querySelectorAll<HTMLElement>("[data-party-row]");
        buttons.forEach((button) => { button.hidden = partyRows.length === 1; });
    };

    const update = (): void => {
        const groups: PartyGroup[] = [];
        let rowsValid = true;
        rows.querySelectorAll<HTMLElement>("[data-party-row]").forEach((row) => {
            const id = row.dataset.partyRow;
            const countInput = requiredElement<HTMLInputElement>(document, `player-count-${id}`);
            const levelInput = requiredElement<HTMLInputElement>(document, `party-level-${id}`);
            const playerCount = Number(countInput.value);
            const level = Number(levelInput.value);
            const countValid = countInput.value !== "" && Number.isInteger(playerCount) && playerCount > 0;
            const levelValid = levelInput.value !== "" && Number.isInteger(level) && level >= 1 && level <= 20;
            setValidation(countInput, `player-count-error-${id}`, countValid, `Party group ${id}: enter a positive whole number of players.`);
            setValidation(levelInput, `party-level-error-${id}`, levelValid, `Party group ${id}: select a level from 1 through 20.`);
            rowsValid = rowsValid && countValid && levelValid;
            groups.push({ playerCount, level });
        });

        const modifier = modifierValue.value === "" ? 0 : Number(modifierValue.value);
        const modifierValid = Number.isFinite(modifier);
        setValidation(modifierValue, "modifier-value-error", modifierValid, "Enter a numeric modifier.");
        if (!rowsValid || !modifierValid) {
            RESULT_IDS.forEach((difficulty) => { requiredElement(document, `${difficulty}-result`).textContent = "—"; });
            updateEncounter(null);
            return;
        }

        const thresholds = calculateMixedPartyThresholds(groups, modifierType.value as ModifierType, modifier);
        RESULT_IDS.forEach((difficulty) => {
            requiredElement(document, `${difficulty}-result`).textContent = `${thresholds[difficulty].toLocaleString()} XP`;
        });
        updateEncounter(thresholds);
    };

    const bindRow = (row: HTMLElement): void => {
        row.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
            input.addEventListener("input", update);
            input.addEventListener("change", update);
        });
        const remove = row.querySelector<HTMLButtonElement>(".remove-party-row");
        if (!remove) throw new Error("Missing party row remove button.");
        remove.addEventListener("click", () => {
            const currentRows = Array.from(rows.querySelectorAll<HTMLElement>("[data-party-row]"));
            if (currentRows.length === 1) return;
            const index = currentRows.indexOf(row);
            row.remove();
            updateRemoveButtons();
            update();
            const remaining = rows.querySelectorAll<HTMLElement>("[data-party-row]");
            remaining[remaining.length - 1]?.querySelector(".party-row-controls")?.append(addButton);
            remaining[Math.min(index, remaining.length - 1)]?.querySelector<HTMLInputElement>("input")?.focus();
        });
    };

    rows.querySelectorAll<HTMLElement>("[data-party-row]").forEach(bindRow);
    [modifierType, modifierValue].forEach((control) => {
        control.addEventListener("input", update);
        control.addEventListener("change", update);
    });
    addButton.addEventListener("click", () => {
        const id = nextRowId++;
        const row = createPartyRow(document, id);
        rows.append(row);
        row.querySelector(".party-row-controls")?.append(addButton);
        bindRow(row);
        updateRemoveButtons();
        update();
        requiredElement<HTMLInputElement>(document, `player-count-${id}`).focus();
    });

    updateRemoveButtons();
    update();
}
