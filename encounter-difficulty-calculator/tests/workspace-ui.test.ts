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
    disabled = false;
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
    files: File[] | null = null;
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
        if (selector === ".encounter") return this.className === "encounter";
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
    failNextCreate = false;
    createErrors: string[] = [];
    readonly alerts: string[] = [];
    defaultView = {
        prompt: (): string | null => null,
        alert: (message: string): void => { this.alerts.push(message); },
        confirm: (): boolean => false,
    };

    createElement(tag: string): FakeElement {
        const createError = this.createErrors.shift();
        if (createError) throw new Error(createError);
        if (this.failNextCreate) {
            this.failNextCreate = false;
            throw new Error("Simulated DOM rendering failure.");
        }
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

function lastAlert(document: FakeDocument): string {
    return document.alerts[document.alerts.length - 1] ?? "";
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
    document.make("import-workspace", "input");
    return document;
}

class FakeStorage implements WorkspaceStorage {
    value: string | null = null;
    writeError = false;
    writes = 0;

    getItem(key: string): string | null {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        return this.value;
    }

    setItem(key: string, value: string): void {
        assert.equal(key, WORKSPACE_STORAGE_KEY);
        this.writes += 1;
        if (this.writeError) throw new Error("quota");
        this.value = value;
    }
}

test("publishes complete workspace snapshots for party and encounter edits", () => {
    const document = setup();
    const initial: WorkspaceState = {
        version: 2,
        party: {
            groups: [{ playerCount: 4, level: 5 }],
            modifierType: "percentage",
            modifierValue: 0,
        },
        encounters: [{
            name: "Bridge",
            monsters: [{ name: "Ogre", cr: "2", xp: 450, quantity: 1, url: "", minion: true }],
        }],
    };
    const updates: WorkspaceState[] = [];
    const getState = initializeWorkspace(document as unknown as Document, initial, (state) => updates.push(state));

    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    assert.equal(updates[0].party.modifierValue, 10);
    assert.equal(updates[0].encounters[0].name, "Bridge");

    const encounter = document.element("encounters").children[0];
    const monsterName = descendants(encounter).find((element) => element.placeholder === "Monster Name");
    assert.ok(monsterName);
    monsterName.value = "Troll";
    monsterName.dispatch("input");
    assert.equal(updates[1].party.modifierValue, 10);
    assert.equal(updates[1].encounters[0].monsters[0].name, "Troll");
    assert.equal(updates[1].encounters[0].monsters[0].cr, "2");
    assert.equal(updates[1].encounters[0].monsters[0].minion, true);
    assert.deepEqual(getState(), updates[1]);
});

test("rolls back a partial rendering failure before reporting the import error", async () => {
    const document = setup();
    const storage = new FakeStorage();
    const original: WorkspaceState = {
        ...DEFAULT_WORKSPACE_STATE,
        party: { ...DEFAULT_WORKSPACE_STATE.party, modifierValue: 7 },
        encounters: [{ name: "Original", monsters: [{ name: "Ogre", cr: "2", xp: 450, quantity: 2, url: "", minion: false }] }],
    };
    const originalSerialized = JSON.stringify(original);
    storage.value = originalSerialized;
    const candidate: WorkspaceState = {
        ...original,
        party: { ...original.party, modifierValue: 99 },
    };
    const yaml = (await import("../src/workspace-yaml")).serializeWorkspaceYaml(candidate);
    initializePersistedWorkspace(document as unknown as Document, storage, undefined, {
        confirm: () => true,
        readFile: async () => yaml,
    });
    document.failNextCreate = true;
    const input = document.element("import-workspace");
    input.files = [{} as File];
    input.dispatch("change");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(document.element("modifier-value").value, "7");
    const encounter = document.element("encounters").children[0];
    assert.equal(descendants(encounter).find((element) => element.className === "encounter-total")?.textContent, "900 XP");
    assert.equal(storage.value, originalSerialized);
    assert.match(lastAlert(document), /not changed/);
});

test("preserves the original rendering error when rollback also fails", () => {
    const document = setup();
    const controller = initializeWorkspace(document as unknown as Document);
    document.createErrors.push("Original rendering failure", "Rollback rendering failure");

    assert.throws(() => controller.replaceState({
        ...DEFAULT_WORKSPACE_STATE,
        encounters: [{ name: "Imported", monsters: [] }],
    }), /Original rendering failure/);
    assert.deepEqual(controller(), DEFAULT_WORKSPACE_STATE);
});

test("imports a validated backup after confirmation and persists the replacement", async () => {
    const storage = new FakeStorage();
    const imported: WorkspaceState = {
        version: 2,
        party: { groups: [{ playerCount: 2, level: 20 }], modifierType: "flat", modifierValue: 10 },
        encounters: [{ name: "Finale", monsters: [{ name: "Dragon", cr: "19", xp: 22000, quantity: 1, url: "", minion: false }] }],
    };
    let warning = "";
    const yaml = (await import("../src/workspace-yaml")).serializeWorkspaceYaml(imported);
    const successDocument = setup();
    initializePersistedWorkspace(successDocument as unknown as Document, storage, undefined, {
        confirm: (message) => { warning = message; return true; },
        readFile: async () => yaml,
    });
    const successInput = successDocument.element("import-workspace");
    successInput.files = [{} as File];
    successInput.dispatch("change");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.match(warning, /permanently replace/);
    assert.equal(successDocument.element("modifier-value").value, "10");
    const importedEncounter = successDocument.element("encounters").children[0];
    const importedTotal = descendants(importedEncounter).find((element) => element.className === "encounter-total")?.textContent;
    const importedRank = descendants(importedEncounter).find((element) => element.className === "encounter-rank")?.textContent;
    assert.equal(importedTotal, "22,000 XP");
    assert.notEqual(importedRank, "");
    assert.deepEqual(JSON.parse(storage.value ?? ""), imported);
    assert.match(lastAlert(successDocument), /successfully/);

    const refreshedDocument = setup();
    initializePersistedWorkspace(refreshedDocument as unknown as Document, storage);
    const refreshedEncounter = refreshedDocument.element("encounters").children[0];
    assert.equal(refreshedDocument.element("modifier-value").value, "10");
    assert.equal(descendants(refreshedEncounter).find((element) => element.className === "encounter-total")?.textContent, importedTotal);
    assert.equal(descendants(refreshedEncounter).find((element) => element.className === "encounter-rank")?.textContent, importedRank);
});

test("ignores a second file selection while an import is pending", async () => {
    const document = setup();
    const storage = new FakeStorage();
    const imported: WorkspaceState = {
        ...DEFAULT_WORKSPACE_STATE,
        party: { ...DEFAULT_WORKSPACE_STATE.party, modifierValue: 12 },
    };
    const yaml = (await import("../src/workspace-yaml")).serializeWorkspaceYaml(imported);
    let finishRead: (source: string) => void = () => undefined;
    let reads = 0;
    initializePersistedWorkspace(document as unknown as Document, storage, undefined, {
        confirm: () => true,
        readFile: () => {
            reads += 1;
            return new Promise((resolve) => { finishRead = resolve; });
        },
    });
    const input = document.element("import-workspace");
    input.files = [{} as File];
    input.dispatch("change");
    assert.equal(input.disabled, true);

    input.files = [{} as File];
    input.dispatch("change");
    assert.equal(reads, 1);

    finishRead(yaml);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(input.disabled, false);
    assert.deepEqual(JSON.parse(storage.value ?? ""), imported);
});

test("imports null and out-of-range values and derives validation presentation", async () => {
    const document = setup();
    const storage = new FakeStorage();
    const imported: WorkspaceState = {
        version: 2,
        party: { groups: [{ playerCount: null, level: 99 }], modifierType: "percentage", modifierValue: 0 },
        encounters: [{ name: "Invalid draft", monsters: [{ name: "Unknown", cr: null, xp: null, quantity: 0, url: "", minion: true }] }],
    };
    const yaml = (await import("../src/workspace-yaml")).serializeWorkspaceYaml(imported);
    initializePersistedWorkspace(document as unknown as Document, storage, undefined, {
        confirm: () => true,
        readFile: async () => yaml,
    });
    const input = document.element("import-workspace");
    input.files = [{} as File];
    input.dispatch("change");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(document.element("player-count-1").value, "");
    assert.equal(document.element("player-count-1").attributes.get("aria-invalid"), "true");
    assert.equal(document.element("party-level-1").attributes.get("aria-invalid"), "true");
    assert.equal(document.element("low-result").textContent, "—");
    const encounter = document.element("encounters").children[0];
    const xp = descendants(encounter).find((element) => element.placeholder === "XP");
    const quantity = descendants(encounter).find((element) => element.placeholder === "Quantity");
    assert.equal(xp?.attributes.get("aria-invalid"), "true");
    assert.equal(quantity?.attributes.get("aria-invalid"), "true");
    assert.equal(descendants(encounter).find((element) => element.className === "encounter-total")?.textContent, "0 XP");
    assert.deepEqual(JSON.parse(storage.value ?? ""), imported);
});

test("canceled and failed imports preserve visible and stored state", async () => {
    const original: WorkspaceState = {
        version: 2,
        party: { groups: [{ playerCount: 4, level: 5 }], modifierType: "percentage", modifierValue: 7 },
        encounters: [{ name: "Original", monsters: [] }],
    };
    const candidate: WorkspaceState = {
        version: 2,
        party: { groups: [{ playerCount: 1, level: 20 }], modifierType: "flat", modifierValue: null },
        encounters: [{ name: "Replacement", monsters: [] }],
    };
    const yaml = (await import("../src/workspace-yaml")).serializeWorkspaceYaml(candidate);

    for (const scenario of ["cancel", "read", "save"] as const) {
        const document = setup();
        const storage = new FakeStorage();
        storage.value = JSON.stringify(original);
        if (scenario === "save") storage.writeError = true;
        initializePersistedWorkspace(document as unknown as Document, storage, undefined, {
            confirm: () => scenario !== "cancel",
            readFile: async () => {
                if (scenario === "read") throw new Error("The selected backup could not be read.");
                return yaml;
            },
        });
        const input = document.element("import-workspace");
        input.files = [{} as File];
        input.dispatch("change");
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(document.element("modifier-value").value, "7", scenario);
        assert.equal(storage.value, JSON.stringify(original), scenario);
        assert.match(lastAlert(document), /not changed|could not be read/, scenario);
    }
});

test("parse and structural validation failures do not confirm or mutate workspace", async () => {
    const original: WorkspaceState = {
        version: 2,
        party: { groups: [{ playerCount: 4, level: 5 }], modifierType: "flat", modifierValue: 13 },
        encounters: [{ name: "Original", monsters: [] }],
    };
    for (const source of ["version: [", "version: 1\nparty: {}\nencounters: []\n"]) {
        const document = setup();
        const storage = new FakeStorage();
        const originalSerialized = JSON.stringify(original);
        storage.value = originalSerialized;
        let confirmations = 0;
        initializePersistedWorkspace(document as unknown as Document, storage, undefined, {
            confirm: () => { confirmations += 1; return true; },
            readFile: async () => source,
        });
        const input = document.element("import-workspace");
        input.files = [{} as File];
        input.dispatch("change");
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(confirmations, 0);
        assert.equal(document.element("modifier-value").value, "13");
        assert.equal(storage.value, originalSerialized);
        assert.match(lastAlert(document), /not valid YAML|supported workspace format/);
    }
});

test("restores persisted raw state and derives calculations and validation", () => {
    const document = setup();
    const storage = new FakeStorage();
    const restored: WorkspaceState = {
        version: 2,
        party: {
            groups: [{ playerCount: 4, level: 5 }, { playerCount: null, level: 99 }],
            modifierType: "flat",
            modifierValue: 25,
        },
        encounters: [{
            name: "Bridge",
            monsters: [
                { name: "Ogre", cr: "2", xp: 450, quantity: 2, url: "https://example.com/ogre", minion: false },
                { name: "Unknown", cr: null, xp: null, quantity: 0, url: "", minion: true },
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

test("migrates a version-1 browser workspace and saves later edits as version 2", async () => {
    const document = setup();
    const storage = new FakeStorage();
    storage.value = JSON.stringify({
        version: 1,
        party: { groups: [{ playerCount: 4, level: 5 }], modifierType: "flat", modifierValue: 0 },
        encounters: [{ name: "Legacy", monsters: [{ name: "Ogre", xp: 450, quantity: 2, url: "" }] }],
    });

    initializePersistedWorkspace(document as unknown as Document, storage);
    assert.equal(descendants(document.element("encounters")).find((element) => element.className === "encounter-total")?.textContent, "900 XP");
    document.element("modifier-value").value = "5";
    document.element("modifier-value").dispatch("input");
    await Promise.resolve();

    const saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.equal(saved.version, 2);
    assert.deepEqual(saved.encounters[0].monsters[0], {
        name: "Ogre", xp: 450, quantity: 2, url: "", cr: null, minion: false,
    });
});

test("batches autosaves while preserving complete party and encounter snapshots", async () => {
    const document = setup();
    const storage = new FakeStorage();
    initializePersistedWorkspace(document as unknown as Document, storage);

    document.element("modifier-value").value = "10";
    document.element("modifier-value").dispatch("input");
    document.element("modifier-value").value = "11";
    document.element("modifier-value").dispatch("input");
    assert.equal(storage.writes, 0);
    await Promise.resolve();
    let saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.equal(saved.version, 2);
    assert.equal(saved.party.modifierValue, 11);
    assert.equal(saved.encounters[0].monsters[0].cr, null);
    assert.equal(saved.encounters[0].monsters[0].minion, false);
    assert.equal(storage.writes, 1);

    const encounter = document.element("encounters").children[0];
    document.defaultView.prompt = () => "https://example.com/goblin";
    const editStatblock = descendants(encounter).find((element) => element.className === "edit-statblock");
    assert.ok(editStatblock);
    editStatblock.dispatch("click");
    await Promise.resolve();
    saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.equal(saved.party.modifierValue, 11);
    assert.equal(saved.encounters[0].monsters[0].url, "https://example.com/goblin");

    document.element("add-encounter").dispatch("click");
    await Promise.resolve();
    saved = JSON.parse(storage.value ?? "") as WorkspaceState;
    assert.deepEqual(saved.encounters.map(({ name }) => name), ["Encounter 1", "Encounter 2"]);
});

test("preserves corrupt startup data and deduplicates save failure announcements", async () => {
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
    await Promise.resolve();
    const writesAfterFirstFailure = status.textContentWrites;
    assert.match(status.textContent, /could not be saved/);
    document.element("modifier-value").value = "2";
    document.element("modifier-value").dispatch("input");
    await Promise.resolve();
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
    assert.match(yaml, /modifierValue: 17/);
    assert.deepEqual(revoked, []);
    await new Promise((resolve) => setTimeout(resolve, 0));
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
    assert.match(await (exported as Blob).text(), /modifierValue: 8/);
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
