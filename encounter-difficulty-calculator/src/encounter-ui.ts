import { encounterTotal, MonsterInput, rankEncounter, safeStatblockUrl } from "./encounter-calculator";
import { Thresholds } from "./party-calculator";

export function initializeEncounterBuilder(document: Document): (thresholds: Thresholds | null) => void {
    const rows = document.getElementById("monster-rows");
    const addButton = document.getElementById("add-monster");
    const totalOutput = document.getElementById("encounter-total");
    const rankOutput = document.getElementById("encounter-rank");
    if (!rows || !addButton || !totalOutput || !rankOutput) throw new Error("Missing encounter builder element.");

    let nextId = 1;
    let thresholds: Thresholds | null = null;
    const entries = new Map<number, { element: HTMLElement; read: () => MonsterInput }>();

    const update = (): void => {
        const total = encounterTotal(Array.from(entries.values(), (entry) => entry.read()));
        totalOutput.textContent = `${total.toLocaleString()} XP`;
        rankOutput.textContent = thresholds ? rankEncounter(total, thresholds) : "";
    };

    const addRow = (): void => {
        const id = nextId++;
        const fieldset = document.createElement("fieldset");
        fieldset.className = "monster-row";
        const legend = document.createElement("legend");
        legend.className = "visually-hidden";
        legend.textContent = `Monster ${id}`;
        fieldset.append(legend);

        const makeInput = (labelText: string, type: string, required = false): HTMLInputElement => {
            const label = document.createElement("label");
            label.textContent = labelText;
            label.className = "visually-hidden";
            const input = document.createElement("input");
            input.id = `monster-${id}-${labelText.toLowerCase().replace(/\s/g, "-")}`;
            input.type = type;
            input.required = required;
            input.placeholder = labelText;
            label.htmlFor = input.id;
            fieldset.append(label);
            fieldset.append(input);
            return input;
        };
        const name = makeInput("Monster Name", "text");
        const xp = makeInput("XP", "number", true);
        xp.min = "0";
        xp.step = "1";
        const quantity = makeInput("Quantity", "number", true);
        quantity.value = "1";
        quantity.min = "1";
        quantity.step = "1";
        const statblock = document.createElement("div");
        statblock.className = "statblock-control";
        const link = document.createElement("a");
        link.textContent = "Open statblock";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.hidden = true;
        const externalIcon = document.createElement("span");
        externalIcon.className = "material-icons external-link-icon";
        externalIcon.textContent = "open_in_new";
        externalIcon.setAttribute("aria-hidden", "true");
        link.append(externalIcon);
        statblock.append(link);
        const editStatblock = document.createElement("button");
        editStatblock.type = "button";
        editStatblock.className = "edit-statblock";
        editStatblock.textContent = "Add statblock";
        statblock.append(editStatblock);
        fieldset.append(statblock);

        const error = document.createElement("p");
        error.id = `monster-${id}-error`;
        error.className = "visually-hidden";
        error.setAttribute("aria-live", "polite");
        fieldset.append(error);
        [name, quantity, xp].forEach((input) => input.setAttribute("aria-describedby", error.id));
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-monster";
        remove.setAttribute("aria-label", `Remove monster ${id}`);
        const removeIcon = document.createElement("span");
        removeIcon.className = "material-icons";
        removeIcon.textContent = "delete";
        removeIcon.setAttribute("aria-hidden", "true");
        remove.append(removeIcon);
        fieldset.append(remove);

        let savedUrl = "";

        const read = (): MonsterInput => ({
            name: name.value,
            quantity: quantity.value === "" ? Number.NaN : Number(quantity.value),
            xp: xp.value === "" ? Number.NaN : Number(xp.value),
            url: savedUrl,
        });
        const validate = (): void => {
            const messages: string[] = [];
            const quantityInvalid = quantity.value === "" || !Number.isInteger(Number(quantity.value)) || Number(quantity.value) < 1;
            const xpInvalid = xp.value === "" || !Number.isInteger(Number(xp.value)) || Number(xp.value) < 0;
            if (quantityInvalid) messages.push("Quantity must be a positive whole number.");
            if (xpInvalid) messages.push("XP must be a non-negative whole number.");
            const safeUrl = safeStatblockUrl(savedUrl);
            name.setAttribute("aria-invalid", "false");
            quantity.setAttribute("aria-invalid", String(quantityInvalid));
            xp.setAttribute("aria-invalid", String(xpInvalid));
            name.removeAttribute("title");
            if (quantityInvalid) quantity.title = "Quantity must be a positive whole number.";
            else quantity.removeAttribute("title");
            if (xpInvalid) xp.title = "XP must be a non-negative whole number.";
            else xp.removeAttribute("title");
            error.textContent = messages.join(" ");
            link.hidden = !safeUrl;
            editStatblock.textContent = safeUrl ? "" : "Add statblock";
            if (safeUrl) {
                link.href = safeUrl;
                editStatblock.setAttribute("aria-label", `Edit statblock for monster ${id}`);
                const editIcon = document.createElement("span");
                editIcon.className = "material-icons";
                editIcon.textContent = "edit";
                editIcon.setAttribute("aria-hidden", "true");
                editStatblock.append(editIcon);
            } else editStatblock.removeAttribute("aria-label");
            update();
        };
        [name, quantity, xp].forEach((input) => input.addEventListener("input", validate));
        editStatblock.addEventListener("click", () => {
            const enteredUrl = document.defaultView?.prompt("Statblock URL", savedUrl);
            if (enteredUrl === null || enteredUrl === undefined) return;
            const safeUrl = safeStatblockUrl(enteredUrl);
            if (enteredUrl.trim() && !safeUrl) {
                document.defaultView?.alert("Statblock URL must use HTTP or HTTPS.");
                return;
            }
            savedUrl = safeUrl ?? "";
            validate();
        });
        remove.addEventListener("click", () => {
            entries.delete(id);
            fieldset.remove();
            update();
        });
        entries.set(id, { element: fieldset, read });
        rows.append(fieldset);
        validate();
    };

    addButton.addEventListener("click", addRow);
    addRow();
    return (nextThresholds: Thresholds | null): void => {
        thresholds = nextThresholds;
        update();
    };
}
