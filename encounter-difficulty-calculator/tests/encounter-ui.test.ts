import test from "node:test";
import assert from "node:assert/strict";

import { initializeEncounterBuilder } from "../src/encounter-ui";

class FakeElement {
    value = "";
    textContent = "";
    hidden = false;
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
    id = "";
    title = "";
    placeholder = "";
    htmlFor = "";
    listeners = new Map<string, (() => void)[]>();
    append(...children: FakeElement[]): void {
        children.forEach((child) => { child.parent = this; this.children.push(child); });
    }
    remove(): void {
        if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
    }
    setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
    removeAttribute(name: string): void {
        this.attributes.delete(name);
        if (name === "title") this.title = "";
    }
    addEventListener(name: string, listener: () => void): void {
        this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    }
    dispatch(name: string): void { this.listeners.get(name)?.forEach((listener) => listener()); }
    showModal(): void { this.attributes.set("open", ""); }
    close(): void { this.attributes.delete("open"); }
}

class FakeDocument {
    elements = new Map<string, FakeElement>();
    nextPrompt: string | null = null;
    lastAlert = "";
    defaultView = {
        prompt: (): string | null => this.nextPrompt,
        alert: (message: string): void => { this.lastAlert = message; },
    };
    constructor() {
        ["monster-rows", "add-monster", "encounter-total", "encounter-rank"]
            .forEach((id) => this.elements.set(id, new FakeElement()));
    }
    getElementById(id: string): FakeElement | null { return this.elements.get(id) ?? null; }
    createElement(): FakeElement { return new FakeElement(); }
    element(id: string): FakeElement { return this.elements.get(id) as FakeElement; }
}

function inputs(row: FakeElement): FakeElement[] {
    return row.children.flatMap((child) => ["text", "number", "url"].includes(child.type)
        ? [child]
        : inputs(child));
}

test("adds, updates, links, ranks, and removes monster rows", () => {
    const document = new FakeDocument();
    const setThresholds = initializeEncounterBuilder(document as unknown as Document);
    setThresholds({ low: 1000, moderate: 1700, high: 2100 });
    const rows = document.element("monster-rows");
    assert.equal(rows.children.length, 1);

    const firstInputs = inputs(rows.children[0]);
    assert.equal(firstInputs[2].value, "1");
    assert.equal(firstInputs[1].attributes.get("aria-invalid"), "true");
    assert.equal(document.element("encounter-total").textContent, "0 XP");
    [firstInputs[0].value, firstInputs[1].value, firstInputs[2].value] = ["Ogre", "1000", "2"];
    firstInputs[1].dispatch("input");
    assert.equal(document.element("encounter-total").textContent, "2,000 XP");
    assert.equal(document.element("encounter-rank").textContent, "High");

    const addStatblock = rows.children[0].children.find((child) => child.className === "statblock-control")?.children[1];
    document.nextPrompt = "https://example.com/ogre";
    addStatblock?.dispatch("click");
    const link = rows.children[0].children
        .find((child) => child.className === "statblock-control")?.children[0];
    assert.equal(link?.hidden, false);
    assert.equal(link?.rel, "noopener noreferrer");

    document.element("add-monster").dispatch("click");
    assert.equal(rows.children.length, 2);
    const secondInputs = inputs(rows.children[1]);
    assert.equal(secondInputs[1].attributes.get("aria-invalid"), "true");
    assert.equal(document.element("encounter-total").textContent, "2,000 XP");
    const remove = rows.children[0].children.find((child) => child.attributes.get("aria-label") === "Remove monster 1");
    remove?.dispatch("click");
    assert.equal(rows.children.length, 1);
    assert.equal(document.element("encounter-total").textContent, "0 XP");
});

test("invalid input and unsafe URLs do not contribute XP", () => {
    const document = new FakeDocument();
    initializeEncounterBuilder(document as unknown as Document);
    const row = document.element("monster-rows").children[0];
    const rowInputs = inputs(row);
    [rowInputs[0].value, rowInputs[1].value, rowInputs[2].value] = ["Ogre", "1000", "2"];
    rowInputs[1].dispatch("input");
    rowInputs[1].value = "";
    rowInputs[1].dispatch("input");
    assert.equal(document.element("encounter-total").textContent, "0 XP");
    assert.equal(rowInputs[1].attributes.get("aria-invalid"), "true");
    rowInputs[1].value = "1000";
    rowInputs[1].dispatch("input");
    document.nextPrompt = "javascript:bad";
    const addStatblock = row.children.find((child) => child.className === "statblock-control")?.children[1];
    addStatblock?.dispatch("click");
    assert.equal(document.element("encounter-total").textContent, "2,000 XP");
    assert.match(document.lastAlert, /HTTP or HTTPS/);
});

test("withholds rank for an invalid party and preserves rows when thresholds change", () => {
    const document = new FakeDocument();
    const setThresholds = initializeEncounterBuilder(document as unknown as Document);
    const rowInputs = inputs(document.element("monster-rows").children[0]);
    rowInputs[1].value = "500";
    rowInputs[1].dispatch("input");
    assert.equal(document.element("encounter-rank").textContent, "");

    setThresholds({ low: 1000, moderate: 1700, high: 2100 });
    assert.equal(document.element("encounter-rank").textContent, "Trivial");
    assert.equal(rowInputs[1].value, "500");

    setThresholds(null);
    assert.equal(document.element("encounter-rank").textContent, "");
    assert.equal(document.element("encounter-total").textContent, "500 XP");
});
