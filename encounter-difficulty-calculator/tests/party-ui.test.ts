import test from "node:test";
import assert from "node:assert/strict";

import { initializePartyCalculator } from "../src/party-ui";

class FakeElement {
    value = "";
    textContent = "";
    readonly attributes = new Map<string, string>();
    readonly listeners = new Map<string, (() => void)[]>();

    setAttribute(name: string, value: string): void {
        this.attributes.set(name, value);
    }

    addEventListener(name: string, listener: () => void): void {
        this.listeners.set(name, [...(this.listeners.get(name) ?? []), listener]);
    }

    dispatch(name: string): void {
        this.listeners.get(name)?.forEach((listener) => listener());
    }
}

class FakeDocument {
    readonly elements = new Map<string, FakeElement>();

    constructor() {
        [
            "player-count", "party-level", "modifier-type", "modifier-value",
            "player-count-error", "party-level-error", "modifier-value-error",
            "low-result", "moderate-result", "high-result",
        ].forEach((id) => this.elements.set(id, new FakeElement()));
    }

    getElementById(id: string): FakeElement | null {
        return this.elements.get(id) ?? null;
    }

    element(id: string): FakeElement {
        const element = this.getElementById(id);
        if (!element) throw new Error(`Missing fake element: ${id}`);
        return element;
    }
}

function setup(): FakeDocument {
    const document = new FakeDocument();
    document.element("player-count").value = "4";
    document.element("party-level").value = "5";
    document.element("modifier-type").value = "percentage";
    document.element("modifier-value").value = "0";
    initializePartyCalculator(document as unknown as Document);
    return document;
}

test("renders initial formatted thresholds", () => {
    const document = setup();
    assert.equal(document.element("low-result").textContent, "2,000 XP");
    assert.equal(document.element("moderate-result").textContent, "3,000 XP");
    assert.equal(document.element("high-result").textContent, "4,400 XP");
});

test("recalculates when player count and level change", () => {
    const document = setup();
    document.element("player-count").value = "2";
    document.element("party-level").value = "8";
    document.element("party-level").dispatch("change");
    assert.equal(document.element("moderate-result").textContent, "3,400 XP");
});

test("switches between percentage and flat modifiers", () => {
    const document = setup();
    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    assert.equal(document.element("low-result").textContent, "2,200 XP");

    document.element("modifier-type").value = "flat";
    document.element("modifier-type").dispatch("change");
    assert.equal(document.element("low-result").textContent, "2,000 XP");
});

test("shows field validation and withholds results for invalid input", () => {
    const document = setup();
    document.element("player-count").value = "0";
    document.element("player-count").dispatch("input");
    assert.equal(document.element("player-count").attributes.get("aria-invalid"), "true");
    assert.match(document.element("player-count-error").textContent, /positive whole number/);
    assert.equal(document.element("low-result").textContent, "—");
});

test("keeps valid zero thresholds distinct from invalid input", () => {
    const document = setup();
    document.element("modifier-type").value = "flat";
    document.element("modifier-value").value = "-100000";
    document.element("modifier-value").dispatch("input");
    assert.equal(document.element("low-result").textContent, "0 XP");
    assert.equal(document.element("modifier-value").attributes.get("aria-invalid"), "false");
});
