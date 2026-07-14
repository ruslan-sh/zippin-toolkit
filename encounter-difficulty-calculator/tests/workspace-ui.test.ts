import test from "node:test";
import assert from "node:assert/strict";

import { initializeWorkspace } from "../src/workspace-ui";
import { WorkspaceState } from "../src/workspace-state";

class FakeElement {
    value = "";
    textContent = "";
    hidden = false;
    focused = false;
    href = "";
    type = "";
    required = false;
    min = "";
    max = "";
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

    constructor(private readonly document: FakeDocument, id = "", readonly tag = "div") {
        this.id = id;
    }

    append(...children: (FakeElement | string)[]): void {
        children.forEach((child) => {
            const element = typeof child === "string" ? new FakeElement(this.document) : child;
            if (typeof child === "string") element.textContent = child;
            element.parent = this;
            this.children.push(element);
            if (element.id) this.document.elements.set(element.id, element);
        });
    }

    remove(): void {
        if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    }

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
    defaultView = {
        prompt: (): string | null => null,
        alert: (): void => undefined,
    };

    createElement(tag: string): FakeElement { return new FakeElement(this, "", tag); }
    getElementById(id: string): FakeElement | null { return this.elements.get(id) ?? null; }
    make(id: string, tag = "div", value = ""): FakeElement {
        const element = new FakeElement(this, id, tag);
        element.value = value;
        this.elements.set(id, element);
        return element;
    }
    element(id: string): FakeElement { return this.elements.get(id) as FakeElement; }
}

function descendants(element: FakeElement): FakeElement[] {
    return element.children.flatMap((child) => [child, ...descendants(child)]);
}

function setup(): FakeDocument {
    const document = new FakeDocument();
    const rows = document.make("party-rows");
    const templateRow = document.make("");
    templateRow.dataset.partyRow = "1";
    rows.append(templateRow);
    document.make("add-party-row", "button");
    document.make("modifier-type", "select", "percentage");
    document.make("modifier-value", "input", "0");
    document.make("modifier-value-error");
    ["low", "moderate", "high"].forEach((name) => document.make(`${name}-result`));
    document.make("encounters");
    document.make("add-encounter", "button");
    return document;
}

test("publishes complete workspace snapshots for party and encounter edits", () => {
    const document = setup();
    const initial: WorkspaceState = {
        version: 1,
        party: {
            groups: [{ playerCount: "4", level: "5" }],
            modifierType: "percentage",
            modifierValue: "0",
        },
        encounters: [{
            name: "Bridge",
            monsters: [{ name: "Ogre", xp: "450", quantity: "1", url: "" }],
        }],
    };
    const updates: WorkspaceState[] = [];
    const getState = initializeWorkspace(document as unknown as Document, initial, (state) => updates.push(state));

    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    assert.equal(updates[0].party.modifierValue, "10");
    assert.equal(updates[0].encounters[0].name, "Bridge");

    const encounter = document.element("encounters").children[0];
    const monsterName = descendants(encounter).find((element) => element.placeholder === "Monster Name");
    assert.ok(monsterName);
    monsterName.value = "Troll";
    monsterName.dispatch("input");
    assert.equal(updates[1].party.modifierValue, "10");
    assert.equal(updates[1].encounters[0].monsters[0].name, "Troll");
    assert.deepEqual(getState(), updates[1]);
});
