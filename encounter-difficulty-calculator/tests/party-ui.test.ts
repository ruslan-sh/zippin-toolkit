import test from "node:test";
import assert from "node:assert/strict";

import { initializePartyCalculator } from "../src/party-ui";
import { PartyState } from "../src/workspace-state";

class FakeElement {
    value = "";
    textContent = "";
    className = "";
    type = "";
    min = "";
    max = "";
    step = "";
    htmlFor = "";
    title = "";
    disabled = false;
    hidden = false;
    focused = false;
    parent: FakeElement | null = null;
    readonly dataset: Record<string, string> = {};
    readonly attributes = new Map<string, string>();
    readonly listeners = new Map<string, (() => void)[]>();
    readonly children: FakeElement[] = [];

    constructor(readonly document: FakeDocument, public id = "", public tag = "div") {}

    add(child: FakeElement): void {
        child.parent = this;
        this.children.push(child);
        if (child.id) this.document.elements.set(child.id, child);
    }
    append(child: FakeElement): void { this.add(child); }
    remove(): void { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); }
    focus(): void { this.focused = true; }
    setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
        if (name === "title") this.title = "";
    }
    addEventListener(name: string, listener: () => void): void {
        this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    }
    dispatch(name: string): void { this.listeners.get(name)?.forEach((listener) => listener()); }
    matches(selector: string): boolean {
        if (selector === "input") return this.tag === "input";
        if (selector === ".remove-party-row") return this.className === "remove-party-row";
        if (selector === ".party-row-controls") return this.className === "party-row-controls";
        if (selector === "[data-party-row]") return this.dataset.partyRow !== undefined;
        return false;
    }
    querySelectorAll<T>(selector: string): T[] {
        return this.children.flatMap((child) => [child, ...child.querySelectorAll<FakeElement>(selector)])
            .filter((child) => child.matches(selector)) as T[];
    }
    querySelector<T>(selector: string): T | null { return this.querySelectorAll<T>(selector)[0] ?? null; }
}

class FakeDocument {
    readonly elements = new Map<string, FakeElement>();
    createElement(tag: string): FakeElement { return new FakeElement(this, "", tag); }
    make(id: string, tag = "div", value = ""): FakeElement {
        const element = new FakeElement(this, id, tag);
        element.value = value;
        if (id) this.elements.set(id, element);
        return element;
    }
    getElementById(id: string): FakeElement | null { return this.elements.get(id) ?? null; }
    element(id: string): FakeElement {
        const element = this.getElementById(id);
        if (!element) throw new Error(`Missing fake element: ${id}`);
        return element;
    }
}

function setup(
    updateEncounter: (value: unknown) => void = () => undefined,
    initialize = true,
): FakeDocument {
    const document = new FakeDocument();
    const rows = document.make("party-rows");
    const row = document.make("");
    row.dataset.partyRow = "1";
    row.add(document.make("player-count-1", "input", "4"));
    row.add(document.make("party-level-1", "input", "5"));
    document.element("player-count-1").setAttribute("aria-describedby", "player-count-1-error");
    document.element("party-level-1").setAttribute("aria-describedby", "party-level-1-error");
    const remove = document.make("", "button");
    remove.className = "remove-party-row";
    remove.setAttribute("aria-label", "Remove party group 1");
    row.add(remove);
    row.add(document.make("player-count-1-error"));
    row.add(document.make("party-level-1-error"));
    rows.add(row);
    document.make("add-party-row", "button");
    document.make("modifier-type", "select", "percentage");
    document.make("modifier-value", "input", "0");
    document.make("modifier-value-error");
    ["low", "moderate", "high"].forEach((name) => document.make(`${name}-result`));
    if (initialize) initializePartyCalculator(document as unknown as Document, updateEncounter as never);
    return document;
}

test("renders initial thresholds and aggregates an added mixed-level group", () => {
    const document = setup();
    assert.equal(document.element("low-result").textContent, "2,000 XP");
    document.element("player-count-1").value = "2";
    document.element("party-level-1").dispatch("input");
    document.element("add-party-row").dispatch("click");
    document.element("player-count-2").value = "2";
    document.element("party-level-2").value = "7";
    document.element("party-level-2").dispatch("input");
    assert.equal(document.element("low-result").textContent, "2,500 XP");
    assert.equal(document.element("moderate-result").textContent, "4,100 XP");
    assert.equal(document.element("high-result").textContent, "5,600 XP");
    assert.equal(document.element("player-count-2").focused, true);
});

test("invalidates the whole party and recovers after removing the bad row", () => {
    const updates: unknown[] = [];
    const document = setup((value) => updates.push(value));
    document.element("add-party-row").dispatch("click");
    document.element("player-count-2").value = "0";
    document.element("player-count-2").dispatch("input");
    assert.equal(document.element("low-result").textContent, "—");
    assert.equal(document.element("add-party-row").parent?.className, "party-row-controls");
    assert.equal(document.element("player-count-2").attributes.get("aria-invalid"), "true");
    assert.equal(document.element("player-count-2").attributes.get("title"), "Party group 2: enter a positive whole number of players.");
    assert.equal(document.element("player-count-2").attributes.get("aria-describedby"), "player-count-2-error");
    assert.equal(document.element("player-count-2-error").textContent, "Party group 2: enter a positive whole number of players.");
    assert.equal(updates[updates.length - 1], null);
    const rows = document.element("party-rows");
    rows.querySelectorAll<FakeElement>(".remove-party-row")[1].dispatch("click");
    assert.equal(document.element("low-result").textContent, "2,000 XP");
    assert.equal(document.element("player-count-1").focused, true);
});

test("recovers after correcting an invalid row without replacing either group", () => {
    const updates: unknown[] = [];
    const document = setup((value) => updates.push(value));
    document.element("add-party-row").dispatch("click");
    document.element("party-level-2").value = "21";
    document.element("party-level-2").dispatch("input");
    assert.equal(document.element("moderate-result").textContent, "—");
    assert.equal(updates[updates.length - 1], null);

    document.element("party-level-2").value = "7";
    document.element("party-level-2").dispatch("input");
    assert.equal(document.element("moderate-result").textContent, "4,300 XP");
    assert.equal(document.element("party-rows").querySelectorAll("[data-party-row]").length, 2);
    assert.deepEqual(updates[updates.length - 1], { low: 2800, moderate: 4300, high: 6100 });
});

test("gives invalid controls accessible correction text and descriptive remove names", () => {
    const document = setup();
    document.element("add-party-row").dispatch("click");
    document.element("party-level-2").value = "21";
    document.element("party-level-2").dispatch("input");
    assert.equal(document.element("party-level-2").attributes.get("title"), "Party group 2: select a level from 1 through 20.");
    assert.equal(document.element("party-level-2-error").textContent, "Party group 2: select a level from 1 through 20.");
    document.element("party-level-2").value = "7";
    document.element("party-level-2").dispatch("input");
    assert.equal(document.element("party-level-2").attributes.has("title"), false);
    assert.equal(document.element("party-level-2-error").textContent, "");
    const removeButtons = document.element("party-rows").querySelectorAll<FakeElement>(".remove-party-row");
    assert.equal(removeButtons[0].attributes.get("aria-label"), "Remove party group 1");
    assert.equal(removeButtons[1].attributes.get("aria-label"), "Remove party group 2");
});

test("hides removal for the final row and applies one shared modifier", () => {
    const document = setup();
    const remove = document.element("party-rows").querySelector<FakeElement>(".remove-party-row");
    assert.equal(remove?.hidden, true);
    remove?.dispatch("click");
    assert.equal(document.element("party-rows").querySelectorAll("[data-party-row]").length, 1);
    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    assert.equal(document.element("low-result").textContent, "2,200 XP");
});

test("hydrates raw party state and publishes ordered snapshots", () => {
    const document = setup(() => undefined, false);
    const updates: PartyState[] = [];
    const getState = initializePartyCalculator(
        document as unknown as Document,
        () => undefined,
        {
            groups: [
                { playerCount: "", level: "21" },
                { playerCount: "2", level: "7" },
            ],
            modifierType: "flat",
            modifierValue: "-10.5",
        },
        (state) => updates.push(state),
    );
    assert.deepEqual(getState(), {
        groups: [
            { playerCount: "", level: "21" },
            { playerCount: "2", level: "7" },
        ],
        modifierType: "flat",
        modifierValue: "-10.5",
    });
    assert.equal(document.element("low-result").textContent, "—");
    document.element("player-count-1").value = "3";
    document.element("player-count-1").dispatch("input");
    assert.equal(updates.length, 1);
    assert.equal(updates[0].groups[0].playerCount, "3");
    assert.equal(updates[0].groups[1].level, "7");

    document.element("modifier-type").value = "percentage";
    document.element("modifier-type").dispatch("change");
    assert.equal(updates[1].modifierType, "percentage");

    document.element("add-party-row").dispatch("click");
    assert.equal(updates[2].groups.length, 3);
    assert.deepEqual(updates[2].groups[2], { playerCount: "1", level: "1" });

    const removeButtons = document.element("party-rows").querySelectorAll<FakeElement>(".remove-party-row");
    removeButtons[1].dispatch("click");
    assert.equal(updates[3].groups.length, 2);
    assert.equal(updates[3].groups[1].level, "1");
});
