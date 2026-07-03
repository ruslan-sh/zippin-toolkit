import test from "node:test";
import assert from "node:assert/strict";

import { initializeEncounterBuilder } from "../src/encounter-ui";

class FakeElement {
    value = "";
    textContent = "";
    hidden = false;
    focused = false;
    href = "";
    type = "";
    required = false;
    min = "";
    step = "";
    className = "";
    target = "";
    rel = "";
    parent: FakeElement | null = null;
    children: FakeElement[] = [];
    attributes = new Map<string, string>();
    dataset: Record<string, string> = {};
    id = "";
    title = "";
    placeholder = "";
    htmlFor = "";
    listeners = new Map<string, (() => void)[]>();
    append(...children: (FakeElement | string)[]): void {
        children.forEach((child) => {
            const element = typeof child === "string" ? Object.assign(new FakeElement(), { textContent: child }) : child;
            element.parent = this;
            this.children.push(element);
        });
    }
    remove(): void { if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
    focus(): void { this.focused = true; }
    setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
        if (name === "title") this.title = "";
        if (name === "href") this.href = "";
    }
    addEventListener(name: string, listener: () => void): void {
        this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    }
    dispatch(name: string): void { this.listeners.get(name)?.forEach((listener) => listener()); }
}

class FakeDocument {
    elements = new Map<string, FakeElement>();
    nextPrompt: string | null = null;
    promptInitial = "";
    lastAlert = "";
    defaultView = {
        prompt: (_message: string, initial = ""): string | null => { this.promptInitial = initial; return this.nextPrompt; },
        alert: (message: string): void => { this.lastAlert = message; },
    };
    constructor() {
        ["encounters", "add-encounter"].forEach((id) => this.elements.set(id, new FakeElement()));
    }
    getElementById(id: string): FakeElement | null { return this.elements.get(id) ?? null; }
    createElement(): FakeElement { return new FakeElement(); }
    element(id: string): FakeElement { return this.elements.get(id) as FakeElement; }
}

function descendants(element: FakeElement): FakeElement[] {
    return element.children.flatMap((child) => [child, ...descendants(child)]);
}

function byClass(element: FakeElement, className: string): FakeElement[] {
    return descendants(element).filter((child) => child.className === className);
}

function inputs(element: FakeElement): FakeElement[] {
    return descendants(element).filter((child) => child.type === "text" || child.type === "number");
}

test("creates isolated encounters and distributes shared thresholds", () => {
    const document = new FakeDocument();
    const setThresholds = initializeEncounterBuilder(document as unknown as Document);
    setThresholds({ low: 1000, moderate: 1700, high: 2100 });
    const encounters = document.element("encounters");
    assert.equal(encounters.children.length, 1);

    const first = encounters.children[0];
    const addMonster = byClass(first, "add-monster")[0];
    assert.equal(addMonster.children[0].textContent, "add_circle");
    assert.equal(addMonster.children[1].textContent, "Add Monster");
    const firstInputs = inputs(first);
    assert.equal(firstInputs[0].focused, false);
    [firstInputs[0].value, firstInputs[1].value, firstInputs[2].value] = ["Ogre", "1000", "2"];
    firstInputs[1].dispatch("input");
    assert.equal(byClass(first, "encounter-total")[0].textContent, "2,000 XP");
    assert.equal(byClass(first, "encounter-rank")[0].textContent, "High");
    assert.equal(byClass(first, "encounter-rank")[0].dataset.difficulty, "high");

    document.element("add-encounter").dispatch("click");
    assert.equal(encounters.children.length, 2);
    const second = encounters.children[1];
    assert.equal(inputs(second)[0].focused, true);
    assert.equal(byClass(second, "encounter-total")[0].textContent, "0 XP");
    inputs(second)[1].value = "500";
    inputs(second)[1].dispatch("input");
    assert.equal(byClass(second, "encounter-total")[0].textContent, "500 XP");
    assert.equal(byClass(first, "encounter-total")[0].textContent, "2,000 XP");

    setThresholds(null);
    assert.equal(byClass(first, "encounter-rank")[0].textContent, "");
    assert.equal(byClass(first, "encounter-rank")[0].dataset.difficulty, "");
    assert.equal(byClass(second, "encounter-rank")[0].textContent, "");
    assert.equal(byClass(first, "encounter-total")[0].textContent, "2,000 XP");
});

test("exposes every encounter difficulty for color coding", () => {
    const document = new FakeDocument();
    const setThresholds = initializeEncounterBuilder(document as unknown as Document);
    setThresholds({ low: 100, moderate: 200, high: 300 });
    const encounter = document.element("encounters").children[0];
    const xp = inputs(encounter)[1];
    const rank = byClass(encounter, "encounter-rank")[0];
    const cases = [
        [0, "Trivial", "trivial"],
        [81, "Low", "low"],
        [180, "Moderate", "moderate"],
        [270, "High", "high"],
        [360, "Deadly", "deadly"],
    ] as const;

    cases.forEach(([value, label, difficulty]) => {
        xp.value = String(value);
        xp.dispatch("input");
        assert.equal(rank.textContent, label);
        assert.equal(rank.dataset.difficulty, difficulty);
    });
});

test("renames, deletes, and applies positional default names", () => {
    const document = new FakeDocument();
    initializeEncounterBuilder(document as unknown as Document);
    const encounters = document.element("encounters");
    document.element("add-encounter").dispatch("click");
    const first = encounters.children[0];
    const second = encounters.children[1];
    const rename = byClass(first, "rename-encounter")[0];
    assert.equal(rename.parent, byClass(first, "remove-encounter")[0].parent);
    document.nextPrompt = "  Boss fight  ";
    rename.dispatch("click");
    assert.equal(document.promptInitial, "Encounter 1");
    assert.equal(rename.attributes.get("aria-label"), "Rename Boss fight");
    assert.equal(byClass(first, "remove-encounter")[0].attributes.get("aria-label"), "Delete Boss fight");
    assert.equal(byClass(first, "remove-monster")[0].attributes.get("aria-label"), "Remove monster 1 from Boss fight");
    assert.equal(byClass(first, "edit-statblock")[0].attributes.get("aria-label"), "Add statblock for monster 1 in Boss fight");
    assert.ok(descendants(first).some((element) => element.textContent === "Monster Name for Boss fight, monster 1"));

    document.nextPrompt = "   ";
    rename.dispatch("click");
    assert.equal(rename.attributes.get("aria-label"), "Rename Boss fight");
    byClass(first, "remove-encounter")[0].dispatch("click");
    assert.equal(encounters.children.length, 1);
    assert.equal(document.element("add-encounter").focused, true);
    document.element("add-encounter").dispatch("click");
    assert.equal(byClass(encounters.children[1], "rename-encounter")[0].attributes.get("aria-label"), "Rename Encounter 2");

    byClass(second, "remove-encounter")[0].dispatch("click");
    byClass(encounters.children[0], "remove-encounter")[0].dispatch("click");
    assert.equal(encounters.children.length, 0);
    document.element("add-encounter").dispatch("click");
    assert.equal(byClass(encounters.children[0], "rename-encounter")[0].attributes.get("aria-label"), "Rename Encounter 1");
});

test("keeps monster controls, validation, URLs, and identities encounter-specific", () => {
    const document = new FakeDocument();
    initializeEncounterBuilder(document as unknown as Document);
    const encounter = document.element("encounters").children[0];
    const row = byClass(encounter, "monster-row")[0];
    const rowInputs = inputs(row);
    assert.equal(rowInputs[1].attributes.get("aria-invalid"), "true");
    assert.match(rowInputs[0].id, /^encounter-1-monster-1-/);
    const statblockButton = byClass(row, "edit-statblock")[0];
    assert.equal(statblockButton.attributes.get("aria-label"), "Add statblock for monster 1 in Encounter 1");
    assert.equal(statblockButton.title, "Add statblock");
    document.nextPrompt = "https://example.com/ogre";
    statblockButton.dispatch("click");
    assert.equal(statblockButton.title, "Edit statblock");
    const link = descendants(row).find((element) => element.rel === "noopener noreferrer");
    assert.equal(link?.hidden, false);
    document.nextPrompt = "";
    statblockButton.dispatch("click");
    assert.equal(link?.hidden, true);
    assert.equal(link?.href, "");

    byClass(encounter, "add-monster")[0].dispatch("click");
    assert.equal(byClass(encounter, "monster-row").length, 2);
    const secondRow = byClass(encounter, "monster-row")[1];
    assert.match(inputs(secondRow)[0].id, /^encounter-1-monster-2-/);
    byClass(row, "remove-monster")[0].dispatch("click");
    assert.equal(byClass(encounter, "monster-row").length, 1);
    assert.equal(byClass(encounter, "add-monster")[0].focused, true);
});
