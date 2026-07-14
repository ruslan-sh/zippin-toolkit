import test from "node:test";
import assert from "node:assert/strict";

import { initializePersistedWorkspace } from "../src/workspace-app";
import { initializeWorkspaceExport } from "../src/workspace-export";
import { WORKSPACE_STORAGE_KEY, WorkspaceStorage } from "../src/workspace-storage";
import { initializeWorkspace } from "../src/workspace-ui";
import { DEFAULT_WORKSPACE_STATE, WorkspaceState } from "../src/workspace-state";

class FakeElement {
    value = "";
    private content = "";
    textContentWrites = 0;
    hidden = false;
    focused = false;
    href = "";
    download = "";
    clicked = false;
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

    get textContent(): string { return this.content; }
    set textContent(value: string) {
        this.content = value;
        this.textContentWrites += 1;
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
    click(): void { this.clicked = true; this.dispatch("click"); }
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
    readonly created: FakeElement[] = [];
    defaultView = {
        prompt: (): string | null => null,
        alert: (): void => undefined,
    };

    createElement(tag: string): FakeElement {
        const element = new FakeElement(this, "", tag);
        this.created.push(element);
        return element;
    }
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
    document.make("workspace-status");
    document.make("export-workspace", "button");
    return document;
}

class FakeStorage implements WorkspaceStorage {
    value: string | null = null;
    writeError = false;

    getItem(key: string): string | null {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        return this.value;
    }

    setItem(key: string, value: string): void {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        if (this.writeError) throw new Error("quota");
        this.value = value;
    }
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

test("restores persisted raw state and derives calculations and validation", () => {
    const document = setup();
    const storage = new FakeStorage();
    const restored: WorkspaceState = {
        version: 1,
        party: {
            groups: [{ playerCount: "4", level: "5" }, { playerCount: "", level: "99" }],
            modifierType: "flat",
            modifierValue: "25",
        },
        encounters: [{
            name: "Bridge",
            monsters: [
                { name: "Ogre", xp: "450", quantity: "2", url: "https://example.com/ogre" },
                { name: "Unknown", xp: "", quantity: "0", url: "" },
            ],
        }],
    };
    storage.value = JSON.stringify(restored);

    initializePersistedWorkspace(document as unknown as Document, storage);

    assert.equal(document.element("modifier-type").value, "flat");
    assert.equal(document.element("modifier-value").value, "25");
    assert.equal(document.element("low-result").textContent, "—");
    assert.equal(document.element("player-count-2").value, "");
    assert.equal(document.element("player-count-2").attributes.get("aria-invalid"), "true");
    const encounter = document.element("encounters").children[0];
    assert.equal(descendants(encounter).find((element) => element.className === "encounter-total")?.textContent, "900 XP");
    assert.equal(descendants(encounter).find((element) => element.tag === "a")?.href, "https://example.com/ogre");
    assert.equal(document.element("workspace-status").textContent, "");
});

test("autosaves complete party and encounter snapshots", () => {
    const document = setup();
    const storage = new FakeStorage();
    initializePersistedWorkspace(document as unknown as Document, storage);

    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    let saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.equal(saved.party.modifierValue, "10");

    const encounter = document.element("encounters").children[0];
    document.defaultView.prompt = () => "https://example.com/goblin";
    const editStatblock = descendants(encounter).find((element) => element.className === "edit-statblock");
    assert.ok(editStatblock);
    editStatblock.dispatch("click");
    saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.equal(saved.party.modifierValue, "10");
    assert.equal(saved.encounters[0].monsters[0].url, "https://example.com/goblin");

    document.element("add-encounter").dispatch("click");
    saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.deepEqual(saved.encounters.map(({ name }) => name), ["Encounter 1", "Encounter 2"]);
});

test("preserves corrupt startup data and deduplicates save failure announcements", () => {
    const document = setup();
    const storage = new FakeStorage();
    storage.value = "corrupt recovery data";

    initializePersistedWorkspace(document as unknown as Document, storage);
    const status = document.element("workspace-status");
    assert.match(status.textContent, /could not be restored/);
    assert.equal(storage.value, "corrupt recovery data");

    storage.writeError = true;
    document.element("modifier-value").value = "1";
    document.element("modifier-value").dispatch("input");
    const writesAfterFirstFailure = status.textContentWrites;
    assert.match(status.textContent, /could not be saved/);
    document.element("modifier-value").value = "2";
    document.element("modifier-value").dispatch("input");
    assert.equal(status.textContentWrites, writesAfterFirstFailure);
    assert.equal(storage.value, "corrupt recovery data");
});

test("exports the current in-memory workspace after a storage write failure", async () => {
    const document = setup();
    const storage = new FakeStorage();
    let exported: Blob | null = null;
    const revoked: string[] = [];
    initializePersistedWorkspace(document as unknown as Document, storage, {
        createObjectURL: (blob) => {
            exported = blob;
            return "blob:workspace";
        },
        revokeObjectURL: (url) => revoked.push(url),
    });

    storage.writeError = true;
    document.element("modifier-value").value = "17";
    document.element("modifier-value").dispatch("input");
    document.element("export-workspace").click();

    assert.ok(exported);
    const yaml = await (exported as Blob).text();
    assert.match(yaml, /modifierValue: "17"/);
    assert.deepEqual(revoked, ["blob:workspace"]);
    assert.match(document.element("workspace-status").textContent, /could not be saved/);
});

test("downloads a normally persisted workspace with the documented filename", async () => {
    const document = setup();
    const storage = new FakeStorage();
    let exported: Blob | null = null;
    initializePersistedWorkspace(document as unknown as Document, storage, {
        createObjectURL: (blob) => {
            exported = blob;
            return "blob:normal-workspace";
        },
        revokeObjectURL: () => undefined,
    });

    document.element("modifier-value").value = "8";
    document.element("modifier-value").dispatch("input");
    document.element("export-workspace").click();

    const link = document.created.find((element) => element.href === "blob:normal-workspace");
    assert.ok(link);
    assert.equal(link.download, "encounter-workspace.yml");
    assert.equal(link.href, "blob:normal-workspace");
    assert.equal(link.clicked, true);
    assert.ok(exported);
    assert.match(await (exported as Blob).text(), /modifierValue: "8"/);
});

test("announces export setup and serialization failures without changing state", () => {
    const document = setup();
    const status = document.element("workspace-status");
    const messages: (string | null)[] = [];
    initializeWorkspaceExport(
        document as unknown as Document,
        () => DEFAULT_WORKSPACE_STATE,
        (message) => {
            messages.push(message);
            status.textContent = message ?? "";
        },
        {
            createObjectURL: () => { throw new Error("download unavailable"); },
            revokeObjectURL: () => undefined,
        },
    );
    document.element("export-workspace").click();
    assert.match(status.textContent, /could not be exported/);
    assert.equal(messages.length, 1);

    const serializationDocument = setup();
    initializeWorkspaceExport(
        serializationDocument as unknown as Document,
        () => DEFAULT_WORKSPACE_STATE,
        (message) => { serializationDocument.element("workspace-status").textContent = message ?? ""; },
        { createObjectURL: () => "unused", revokeObjectURL: () => undefined },
        () => { throw new Error("serialization failed"); },
    );
    serializationDocument.element("export-workspace").click();
    assert.match(serializationDocument.element("workspace-status").textContent, /could not be exported/);
});
