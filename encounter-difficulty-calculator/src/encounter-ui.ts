import { encounterTotal, MonsterInput, rankEncounter, safeStatblockUrl } from "./encounter-calculator";
import { Thresholds } from "./party-calculator";

interface EncounterEntry {
    element: HTMLElement;
    setThresholds: (thresholds: Thresholds | null) => void;
}

export function initializeEncounterBuilder(document: Document): (thresholds: Thresholds | null) => void {
    const encountersElement = document.getElementById("encounters");
    const addEncounterButton = document.getElementById("add-encounter");
    if (!encountersElement || !addEncounterButton) throw new Error("Missing encounter coordinator element.");

    let nextEncounterId = 1;
    let sharedThresholds: Thresholds | null = null;
    const encounters = new Map<number, EncounterEntry>();

    const addEncounter = (focusNewEncounter: boolean): void => {
        const encounterId = nextEncounterId++;
        const defaultName = `Encounter ${encounters.size + 1}`;
        const section = document.createElement("section");
        section.className = "encounter";
        section.setAttribute("aria-labelledby", `encounter-${encounterId}-name`);

        const heading = document.createElement("h2");
        heading.className = "encounter-heading";
        const nameArea = document.createElement("span");
        nameArea.className = "encounter-name-area";
        const name = document.createElement("span");
        name.id = `encounter-${encounterId}-name`;
        name.textContent = defaultName;
        const rename = document.createElement("button");
        rename.type = "button";
        rename.className = "rename-encounter";
        rename.setAttribute("aria-label", `Rename ${defaultName}`);
        const renameIcon = document.createElement("span");
        renameIcon.className = "material-icons";
        renameIcon.textContent = "edit";
        renameIcon.setAttribute("aria-hidden", "true");
        rename.append(renameIcon);
        const removeEncounter = document.createElement("button");
        removeEncounter.type = "button";
        removeEncounter.className = "remove-encounter";
        removeEncounter.setAttribute("aria-label", `Delete ${defaultName}`);
        const deleteIcon = document.createElement("span");
        deleteIcon.className = "material-icons";
        deleteIcon.textContent = "delete";
        deleteIcon.setAttribute("aria-hidden", "true");
        removeEncounter.append(deleteIcon);
        nameArea.append(name, rename, removeEncounter);
        const summary = document.createElement("span");
        summary.className = "encounter-summary";
        summary.setAttribute("aria-live", "polite");
        const rank = document.createElement("span");
        rank.className = "encounter-rank";
        const total = document.createElement("span");
        total.className = "encounter-total";
        total.textContent = "0XP";
        const summarySeparator = document.createElement("span");
        summary.append(total, summarySeparator, rank);
        heading.append(nameArea, summary);

        const headers = document.createElement("div");
        headers.className = "monster-headers";
        headers.setAttribute("aria-hidden", "true");
        ["Monster Name", "XP", "Quantity", ""].forEach((text) => {
            const header = document.createElement("span");
            header.textContent = text;
            headers.append(header);
        });
        const rows = document.createElement("div");
        rows.className = "monster-rows";
        const addMonster = document.createElement("button");
        addMonster.type = "button";
        addMonster.className = "add-monster";
        addMonster.setAttribute("aria-label", `Add monster to ${defaultName}`);
        const addIcon = document.createElement("span");
        addIcon.className = "material-icons";
        addIcon.textContent = "add_circle";
        addIcon.setAttribute("aria-hidden", "true");
        const addLabel = document.createElement("span");
        addLabel.className = "add-monster-label";
        addLabel.textContent = "Add Monster";
        addMonster.append(addIcon, addLabel);
        section.append(heading, headers, rows, addMonster);

        let nextMonsterId = 1;
        let thresholds = sharedThresholds;
        const monsters = new Map<number, { read: () => MonsterInput; refreshLabels: () => void }>();
        const update = (): void => {
            const xpTotal = encounterTotal(Array.from(monsters.values(), (entry) => entry.read()));
            total.textContent = `${xpTotal.toLocaleString()}XP`;
            rank.textContent = thresholds ? rankEncounter(xpTotal, thresholds) : "";
            rank.dataset.difficulty = rank.textContent.toLowerCase();
            summarySeparator.textContent = rank.textContent ? " — " : "";
        };

        const addMonsterRow = (focusNewMonster: boolean): void => {
            const monsterId = nextMonsterId++;
            const fieldset = document.createElement("fieldset");
            fieldset.className = "monster-row";
            const legend = document.createElement("legend");
            legend.className = "visually-hidden";
            legend.textContent = `${name.textContent}, monster ${monsterId}`;
            fieldset.append(legend);
            const inputLabels: { element: HTMLLabelElement; text: string }[] = [];
            const makeInput = (labelText: string, type: string, required = false): HTMLInputElement => {
                const label = document.createElement("label");
                label.textContent = `${labelText} for ${name.textContent}, monster ${monsterId}`;
                label.className = "visually-hidden";
                const input = document.createElement("input");
                input.id = `encounter-${encounterId}-monster-${monsterId}-${labelText.toLowerCase().replace(/\s/g, "-")}`;
                input.type = type;
                input.required = required;
                input.placeholder = labelText;
                label.htmlFor = input.id;
                inputLabels.push({ element: label, text: labelText });
                fieldset.append(label, input);
                return input;
            };
            const monsterName = makeInput("Monster Name", "text");
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
            const editStatblock = document.createElement("button");
            editStatblock.type = "button";
            editStatblock.className = "edit-statblock";
            editStatblock.setAttribute("aria-label", `Add statblock for monster ${monsterId} in ${name.textContent}`);
            editStatblock.title = "Add statblock";
            const statblockIcon = document.createElement("span");
            statblockIcon.className = "material-icons";
            statblockIcon.textContent = "attach_file";
            statblockIcon.setAttribute("aria-hidden", "true");
            editStatblock.append(statblockIcon);
            statblock.append(link);
            fieldset.append(statblock);
            const error = document.createElement("p");
            error.id = `encounter-${encounterId}-monster-${monsterId}-error`;
            error.className = "visually-hidden";
            error.setAttribute("aria-live", "polite");
            fieldset.append(error);
            [monsterName, quantity, xp].forEach((input) => input.setAttribute("aria-describedby", error.id));
            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "remove-monster";
            remove.setAttribute("aria-label", `Remove monster ${monsterId} from ${name.textContent}`);
            const removeIcon = document.createElement("span");
            removeIcon.className = "material-icons";
            removeIcon.textContent = "delete";
            removeIcon.setAttribute("aria-hidden", "true");
            remove.append(removeIcon);
            const actions = document.createElement("div");
            actions.className = "monster-actions";
            actions.append(editStatblock, remove);
            fieldset.append(actions);

            let savedUrl = "";
            const refreshLabels = (): void => {
                const encounterName = name.textContent ?? "";
                legend.textContent = `${encounterName}, monster ${monsterId}`;
                inputLabels.forEach(({ element, text }) => {
                    element.textContent = `${text} for ${encounterName}, monster ${monsterId}`;
                });
                remove.setAttribute("aria-label", `Remove monster ${monsterId} from ${encounterName}`);
                editStatblock.setAttribute(
                    "aria-label",
                    `${safeStatblockUrl(savedUrl) ? "Edit" : "Add"} statblock for monster ${monsterId} in ${encounterName}`,
                );
            };
            const read = (): MonsterInput => ({
                name: monsterName.value,
                quantity: quantity.value === "" ? Number.NaN : Number(quantity.value),
                xp: xp.value === "" ? Number.NaN : Number(xp.value),
                url: savedUrl,
            });
            const validate = (): void => {
                const quantityInvalid = quantity.value === "" || !Number.isInteger(Number(quantity.value)) || Number(quantity.value) < 1;
                const xpInvalid = xp.value === "" || !Number.isInteger(Number(xp.value)) || Number(xp.value) < 0;
                quantity.setAttribute("aria-invalid", String(quantityInvalid));
                xp.setAttribute("aria-invalid", String(xpInvalid));
                if (quantityInvalid) quantity.title = "Quantity must be a positive whole number.";
                else quantity.removeAttribute("title");
                if (xpInvalid) xp.title = "XP must be a non-negative whole number.";
                else xp.removeAttribute("title");
                error.textContent = [quantityInvalid ? quantity.title : "", xpInvalid ? xp.title : ""].filter(Boolean).join(" ");
                const safeUrl = safeStatblockUrl(savedUrl);
                link.hidden = !safeUrl;
                if (safeUrl) {
                    link.href = safeUrl;
                    editStatblock.setAttribute("aria-label", `Edit statblock for monster ${monsterId} in ${name.textContent}`);
                    editStatblock.title = "Edit statblock";
                } else {
                    editStatblock.setAttribute("aria-label", `Add statblock for monster ${monsterId} in ${name.textContent}`);
                    editStatblock.title = "Add statblock";
                }
                update();
            };
            [monsterName, quantity, xp].forEach((input) => input.addEventListener("input", validate));
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
                monsters.delete(monsterId);
                fieldset.remove();
                update();
                addMonster.focus();
            });
            monsters.set(monsterId, { read, refreshLabels });
            rows.append(fieldset);
            validate();
            if (focusNewMonster) monsterName.focus();
        };

        rename.addEventListener("click", () => {
            const currentName = name.textContent ?? "";
            const enteredName = document.defaultView?.prompt("Encounter name", currentName);
            const trimmedName = enteredName?.trim();
            if (!trimmedName) return;
            name.textContent = trimmedName;
            rename.setAttribute("aria-label", `Rename ${trimmedName}`);
            removeEncounter.setAttribute("aria-label", `Delete ${trimmedName}`);
            addMonster.setAttribute("aria-label", `Add monster to ${trimmedName}`);
            monsters.forEach((monster) => monster.refreshLabels());
        });
        removeEncounter.addEventListener("click", () => {
            encounters.delete(encounterId);
            section.remove();
            addEncounterButton.focus();
        });
        addMonster.addEventListener("click", () => addMonsterRow(true));
        encounters.set(encounterId, {
            element: section,
            setThresholds: (nextThresholds) => { thresholds = nextThresholds; update(); },
        });
        encountersElement.append(section);
        addMonsterRow(focusNewEncounter);
    };

    addEncounterButton.addEventListener("click", () => addEncounter(true));
    addEncounter(false);
    return (thresholds: Thresholds | null): void => {
        sharedThresholds = thresholds;
        encounters.forEach((encounter) => encounter.setThresholds(thresholds));
    };
}
